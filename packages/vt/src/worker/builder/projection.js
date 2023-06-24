import { wrap } from '../../common/Util';

const rad = Math.PI / 180;
const metersPerDegree = 6378137 * Math.PI / 180;
const maxLatitude = 85.0511287798;

export function project(out, lnglat, projection) {
    if (projection === 'EPSG:3857') {
        return project3857(out, lnglat);
    } else if (projection === 'EPSG:4326' || projection === 'EPSG:4490' || projection === 'identity') {
        return project4326(out, lnglat);
    } else if (projection === 'baidu') {
        return project4326(out, lnglat);
    } else {
        throw new Error('unsupported projection:' + projection);
    }
}

export function unproject(out, coord, projection) {
    if (projection === 'EPSG:3857') {
        return unproject3857(out, coord);
    }
}

function project4326(out, lnglat) {
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

const delta = 1E-7;
function unproject3857(out, pLnglat) {
    let x = pLnglat[0] / metersPerDegree;
    const y = pLnglat[1];
    let c;
    if (y === 0) {
        c = 0;
    } else {
        c = y / metersPerDegree;
        c = (2 * Math.atan(Math.exp(c * rad)) - Math.PI / 2) / rad;
    }
    if (Math.abs(Math.abs(x) - 180) < delta) {
        x = Math.sign(x) * 180;
    }
    if (Math.abs(Math.abs(c) - maxLatitude) < delta) {
        c = Math.sign(c) * maxLatitude;
    }
    const rx = wrap(x, -180, 180);
    const ry = wrap(c, -maxLatitude, maxLatitude);
    out[0] = rx;
    out[1] = ry;
    return out;
}
