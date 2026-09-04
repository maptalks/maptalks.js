import * as maptalks from 'maptalks';

const PI = Math.PI;
const DEG2RAD = PI / 180;

/**
 * 由起点(LLA)、方位角、俯仰角、距离计算目标点(LLA)
 * 从 vid3d-projection 的 ECEF.enu_to_ecef 移植
 */
export function enuToECEF(a, p) {
    const { distance, azimuth, elevation } = p;
    const elevationAbs = Math.abs(elevation);
    const zUp = elevation >= 0
        ? distance * Math.sin(elevation * DEG2RAD)
        : -distance * Math.sin(elevationAbs * DEG2RAD);
    const d = distance * Math.cos(elevationAbs * DEG2RAD);

    let xEast, yNorth;
    if (azimuth <= 90) {
        xEast = d * Math.sin(azimuth * DEG2RAD);
        yNorth = d * Math.cos(azimuth * DEG2RAD);
    } else if (azimuth > 90 && azimuth < 180) {
        xEast = d * Math.cos((azimuth - 90) * DEG2RAD);
        yNorth = -d * Math.sin((azimuth - 90) * DEG2RAD);
    } else if (azimuth > 180 && azimuth < 270) {
        xEast = -d * Math.sin((azimuth - 180) * DEG2RAD);
        yNorth = -d * Math.cos((azimuth - 180) * DEG2RAD);
    } else {
        xEast = -d * Math.sin((360 - azimuth) * DEG2RAD);
        yNorth = d * Math.cos((360 - azimuth) * DEG2RAD);
    }

    const lat = a.latitude * DEG2RAD;
    const lon = a.longitude * DEG2RAD;
    const h0 = a.altitude;

    const aAxis = 6378137.0;
    const eSq = 0.00669437999013;
    const sinLat = Math.sin(lat);
    const cosLat = Math.cos(lat);
    const sinLon = Math.sin(lon);
    const cosLon = Math.cos(lon);
    const N = aAxis / Math.sqrt(1.0 - eSq * sinLat * sinLat);

    const x0 = (h0 + N) * cosLat * cosLon;
    const y0 = (h0 + N) * cosLat * sinLon;
    const z0 = (h0 + (1 - eSq) * N) * sinLat;

    const t = cosLat * zUp - sinLat * yNorth;
    const zd = sinLat * zUp + cosLat * yNorth;
    const xd = cosLon * t - sinLon * xEast;
    const yd = sinLon * t + cosLon * xEast;

    return ecefToLLA({ x: xd + x0, y: yd + y0, z: zd + z0 });
}

/**
 * ECEF 转 WGS84
 */
export function ecefToLLA(pos) {
    const a = 6378137.0;
    const e2 = 6.69437999014e-3;
    const WGSF = 1 / 298.257223563;
    const WGSe2 = WGSF * (2 - WGSF);

    const x = pos.x, y = pos.y, z = pos.z;
    const p = Math.sqrt(x * x + y * y);

    let lon = Math.atan2(y, x);
    let lat = Math.atan2(z, p * (1 - e2));
    let N, h;
    let lat0;
    do {
        lat0 = lat;
        const sinLat = Math.sin(lat);
        N = a / Math.sqrt(1 - WGSe2 * sinLat * sinLat);
        h = p / Math.cos(lat) - N;
        lat = Math.atan2(z, p * (1 - WGSe2 * N / (N + h)));
    } while (Math.abs(lat - lat0) > 1.0e-12);

    return {
        longitude: lon * 180 / PI,
        latitude: lat * 180 / PI,
        altitude: h
    };
}

const COORD = new maptalks.Coordinate(0, 0);

/**
 * 经纬度坐标(可带高度)转 maptalks 世界坐标
 */
export function coordinateToWorld(map, x, y, z) {
    if (!map) {
        return null;
    }
    COORD.set(x, y);
    const p = map.coordinateToPointAtRes(COORD, map.getGLRes());
    const height = z == null ? 0 : map.altitudeToPoint(z, map.getGLRes());
    return [p.x, p.y, height];
}

/**
 * 由相机位置(LLA) + 方位/俯仰/距离 解算目标点世界坐标
 */
export function getTargetWorldPosition(map, camPosition, azimuthDeg, elevationDeg, distance) {
    const targetLla = enuToECEF({
        longitude: camPosition[0],
        latitude: camPosition[1],
        altitude: camPosition[2]
    }, {
        distance,
        azimuth: azimuthDeg,
        elevation: elevationDeg
    });
    return coordinateToWorld(map, targetLla.longitude, targetLla.latitude, targetLla.altitude);
}
