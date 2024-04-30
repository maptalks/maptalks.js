import etmerc from './etmerc.js';
import { isNil } from '../common/Util';

const rad = Math.PI / 180;
const metersPerDegree = 6378137 * Math.PI / 180;
const maxLatitude = 85.0511287798;
const radius = 6378137;

const CACHED_PROJECTIONS = {};

export function project(out, lnglat, projection, dataProjection) {
    if (projection === 'EPSG:3857') {
        return project3857(out, lnglat);
    } else if (projection && (projection.code === 'EPSG:9807' || projection.code === 'Traverse_Mercator')) {
        const is4326 = !dataProjection || dataProjection.wkid === 4326;
        if (!is4326) {
            // 加载i3s数据时，如果dataProjection存在，且不是经纬度，暂时直接返回
            return projectIdentity(out, lnglat);
        }
        const key = JSON.stringify(projection);
        let projector = CACHED_PROJECTIONS[key];
        if (!projector) {
            projector = CACHED_PROJECTIONS[key] = create9807Projection(projection);
        }
        return projector.project(lnglat, out);
    } else if (projection === 'EPSG:4326' || projection === 'EPSG:4490' || projection === 'identity') {
        return project4326(out, lnglat);
    } else if (projection === 'baidu') {
        return project4326(out, lnglat);
    }else {
        throw new Error('unsupported projection:' + projection);
    }
}

function project4326(out, lnglat) {
    out[0] = lnglat[0];
    out[1] = lnglat[1];
    return out;
}

function projectIdentity(out, lnglat) {
    out[0] = lnglat[0];
    out[1] = lnglat[1];
    return out;
}

function project3857(out, lnglat) {
    const max = maxLatitude;
    const lng = lnglat[0],
        lat = Math.max(Math.min(max, lnglat[1]), -max);
    let c;
    if (lat === 0) {
        c = 0;
    } else {
        c = Math.log(Math.tan((90 + lat) * rad / 2)) / rad;
    }
    out[0] = lng * metersPerDegree;
    out[1] = c * metersPerDegree;
    return out;
}

// export function unproject(out, pLnglat) {
//     const x = pLnglat[0],
//         y = pLnglat[1];
//     let c;
//     if (y === 0) {
//         c = 0;
//     } else {
//         c = y / metersPerDegree;
//         c = (2 * Math.atan(Math.exp(c * rad)) - Math.PI / 2) / rad;
//     }
//     out[0] = x / metersPerDegree;
//     out[1] = c;
//     return out;
// }


export function projMeter(c, pc, meter, projection) {
    if (projection === 'EPSG:3857') {
        return projMeter3857(c, pc, meter, projection);
    } else if (projection === 'EPSG:4326' || projection === 'EPSG:4490') {
        return projMeter4326(c, pc, meter);
    } else if (projection === 'identity') {
        return meter;
    } else if (projection === 'baidu') {
        return projMeter4326(c, pc, meter, projection);
    } else {
        throw new Error('unsupported projection:' + projection);
    }
}

const target = [0, 0];
function projMeter4326(c, pc, meter) {
    locate(target, c, meter, 0);
    return target[0] - c[0];
}

function projMeter3857(c, pc, meter, projection) {
    locate(target, c, meter, 0);
    project(target, target, projection);
    // return ((target[0] - pc[0]) + (target[1] - pc[1])) / 2;
    return target[0] - pc[0];
}

function locate(out, c, xDist, yDist) {
    if (!c) {
        return null;
    }
    if (!xDist) {
        xDist = 0;
    }
    if (!yDist) {
        yDist = 0;
    }
    if (!xDist && !yDist) {
        out[0] = c[0];
        out[1] = c[1];
        return out;
    }
    let x, y;
    let ry = toRadian(c[1]);
    if (yDist !== 0) {
        const dy = Math.abs(yDist);
        const sy = Math.sin(dy / (2 * radius)) * 2;
        ry = ry + sy * (yDist > 0 ? 1 : -1);
        y = wrap(ry * 180 / Math.PI, -90, 90);
    } else {
        y = c[1];
    }
    if (xDist !== 0) {
        // distance per degree
        const dx = Math.abs(xDist);
        let rx = toRadian(c[0]);
        const sx = 2 * Math.sqrt(Math.pow(Math.sin(dx / (2 * radius)), 2) / Math.pow(Math.cos(ry), 2));
        rx = rx + sx * (xDist > 0 ? 1 : -1);
        x = wrap(rx * 180 / Math.PI, -180, 180);
    } else {
        x = c[0];
    }
    out[0] = x;
    out[1] = y;
    return out;
}

function toRadian(d) {
    return d * Math.PI / 180;
}

function wrap(n, min, max) {
    if (n === max || n === min) {
        return n;
    }
    const d = max - min;
    const w = ((n - min) % d + d) % d + min;
    return w;
}
/* eslint-disable */
// from proj_api.h
const RAD_TO_DEG = 57.295779513082321,
    DEG_TO_RAD = 0.017453292519943296;
/* eslint-enable */
// from pj_transform.c
const SRS_WGS84_SEMIMAJOR = 6378137;
const SRS_WGS84_ESQUARED = 0.0066943799901413165;

function create9807Projection(params) {
    const P = {
        a: SRS_WGS84_SEMIMAJOR,
        es: SRS_WGS84_ESQUARED,
        x0: isNil(params.falseEasting) ? 500000 : params.falseEasting,
        y0: isNil(params.falseNorthing) ? 0 : params.falseNorthing,
        k0: params.scaleFactor || 0.9996,
        lam0: (params.centralMeridian || 0) * DEG_TO_RAD,
        phi0: (params.latitudeOfOrigin || 0) * DEG_TO_RAD,
        originLam0: params.startLongtitude || 0,
        originPhi0: params.startLatitude || 0
    };
    etmerc(P);
    const lp = { lam: 0, phi: 0 };
    const xy = {};
    let originX = 0;
    let originY = 0;
    if (P.originLam0 || P.originPhi0) {
        lp.lam = P.originLam0 * DEG_TO_RAD - P.lam0;
        lp.phi = P.originPhi0 * DEG_TO_RAD;
        P.fwd(lp, xy);
        originX = P.a * xy.x + P.x0;
        originY = P.a * xy.y + P.y0;
    }

    return {
        project: function (p, out) {
            lp.lam = p[0] * DEG_TO_RAD - P.lam0;
            lp.phi = p[1] * DEG_TO_RAD;
            P.fwd(lp, xy);
            const x = P.a * xy.x + P.x0 - originX;
            const y = P.a * xy.y + P.y0 - originY;
            out[0] = x;
            out[1] = y;
            return out;
        }
    };
}
