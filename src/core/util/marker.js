import { isNumber } from './common';
import { sign } from './util';
import { getAlignPoint } from './strings';
import Point from '../../geo/Point';
import PointExtent from '../../geo/PointExtent';
import Size from '../../geo/Size';

//-------------- methods for fixed extent of markers -------------
function getVectorPadding(/*symbol*/) {
    return 0;
}

const DXDY = new Point(0, 0);
function getFixedExtent(dx, dy, rotation, alignPoint, x, y, w, h) {
    const dxdy = DXDY.set(dx, dy);
    let result = new PointExtent(dxdy.add(x, y), dxdy.add(x + w, y + h));
    result._add(alignPoint);
    if (rotation) {
        result = rotateExtent(result, rotation);
    }

    return result;
}

const SIZE = [];
export function getVectorMarkerFixedExtent(symbol) {
    const padding = getVectorPadding(symbol) * 2;
    let size = calVectorMarkerSize(SIZE, symbol);
    if (padding) {
        size = size.map(d => d - padding);
    }
    const alignPoint = getVectorMarkerAnchor(symbol, size[0], size[1]);
    return getFixedExtent(symbol['markerDx'] || 0, symbol['markerDy'] || 0,
        getMarkerRotation(symbol), alignPoint, 0, 0, size[0], size[1]);
}

const TEMP_SIZE = new Size(0, 0);
export function getVectorMarkerAnchor(symbol, w, h) {
    const padding = getVectorPadding();
    const shadow = 2 * (symbol['shadowBlur'] || 0),
        margin = shadow + padding;
    TEMP_SIZE.width = w;
    TEMP_SIZE.height = h;
    const p = getAlignPoint(TEMP_SIZE, symbol['markerHorizontalAlignment'], symbol['markerVerticalAlignment']);
    if (p.x !== -w / 2) {
        p.x -= sign(p.x + w / 2) * margin;
    }
    if (p.y !== -h / 2) {
        p.y -= sign(p.y + h / 2) * margin;
    }
    return p;
}

export function calVectorMarkerSize(out, symbol) {
    const padding = getVectorPadding(symbol);
    const lineWidth = symbol['markerLineWidth'],
        shadow = 2 * (symbol['shadowBlur'] || 0), // add some tolerance for shadowOffsetX/Y
        w = Math.round(symbol['markerWidth'] + lineWidth + 2 * shadow + padding * 2),
        h = Math.round(symbol['markerHeight'] + lineWidth + 2 * shadow + padding * 2);
    out[0] = w;
    out[1] = h;
    return out;
}

function rotateExtent(fixedExtent, angle) {
    return fixedExtent.convertTo(p => p._rotate(angle));
}

export function getMarkerRotation(symbol, prop = 'markerRotation') {
    const r = symbol[prop];
    if (!isNumber(r)) {
        return null;
    }
    //to radian
    return -r * Math.PI / 180;
}

export function getImageMarkerFixedExtent(symbol, resources) {
    const url = symbol['markerFile'],
        img = resources ? resources.getImage(url) : null;
    const width = symbol['markerWidth'] || (img ? img.width : 0),
        height = symbol['markerHeight'] || (img ? img.height : 0);
    TEMP_SIZE.width = width;
    TEMP_SIZE.height = height;
    const alignPoint = getAlignPoint(TEMP_SIZE, symbol['markerHorizontalAlignment'], symbol['markerVerticalAlignment']);
    return getFixedExtent(symbol['markerDx'] || 0, symbol['markerDy'] || 0,
        getMarkerRotation(symbol), alignPoint, 0, 0, width, height);
}


export function getTextMarkerFixedExtent(symbol, textDesc) {
    let size = textDesc['size'];
    const alignPoint = getAlignPoint(size, symbol['textHorizontalAlignment'], symbol['textVerticalAlignment']);
    const alignW = alignPoint.x,
        alignH = alignPoint.y;
    if (symbol['textHaloRadius']) {
        const r = symbol['textHaloRadius'];
        size = size.add(r * 2, r * 2);
    }
    return getFixedExtent(symbol['textDx'] || 0, symbol['textDy'] || 0, getMarkerRotation(symbol, 'textRotation'),
        alignPoint, alignW, alignH, size.width, size.height);
}
