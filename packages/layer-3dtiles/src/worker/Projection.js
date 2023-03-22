const rad = Math.PI / 180;
const metersPerDegree = 6378137 * Math.PI / 180;
const maxLatitude = 85.0511287798;
const radius = 6378137;

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
    } else if (projection === 'EPSG:4326' || projection === 'EPSG:4490' || projection === 'identity') {
        return projMeter4326(c, pc, meter);
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
