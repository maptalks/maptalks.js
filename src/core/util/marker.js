import { isNumber, isNil } from './common';
import { sign, getValueOrDefault } from './util';
import { getAlignPoint } from './strings';
import Point from '../../geo/Point';
import PointExtent from '../../geo/PointExtent';
import Size from '../../geo/Size';

export const DEFAULT_MARKER_SYMBOLS = {
    markerWidth: 10,
    markerHeight: 10,
    markerLineWidth: 1
};

//-------------- methods for fixed extent of markers -------------
function getVectorPadding(/*symbol*/) {
    return 0.5;
}

const DXDY = new Point(0, 0);
function getFixedExtent(out, dx, dy, rotation, alignPoint, w, h) {
    const dxdy = DXDY.set(dx, dy);
    const result = out.set(dxdy.x, dxdy.y, dxdy.x + w, dxdy.y + h);
    result._add(alignPoint);
    if (rotation) {
        rotateExtent(result, rotation);
    }

    return result;
}

const SIZE = [];
export function getVectorMarkerFixedExtent(out, symbol, size) {
    // const padding = getVectorPadding(symbol) * 2;
    size = size || calVectorMarkerSize(SIZE, symbol);
    // if (padding) {
    //     size = size.map(d => d - padding);
    // }
    const alignPoint = getVectorMarkerAnchor(symbol, size[0], size[1]);
    return getFixedExtent(out, symbol['markerDx'] || 0, symbol['markerDy'] || 0,
        getMarkerRotation(symbol), alignPoint, size[0], size[1]);
}

export function getDefaultHAlign(markerType) {
    if (markerType === 'rectangle') {
        return 'right';
    } else {
        return 'middle';
    }
}

export function getDefaultVAlign(markerType) {
    if (markerType === 'bar' || markerType === 'pie' || markerType === 'pin') {
        return 'top';
    } else if (markerType === 'rectangle') {
        return 'bottom';
    } else {
        return 'middle';
    }
}


const TEMP_SIZE = new Size(0, 0);
export function getVectorMarkerAnchor(symbol, w, h) {
    const padding = getVectorPadding();
    const shadow = 2 * (symbol['shadowBlur'] || 0),
        margin = shadow + padding;
    TEMP_SIZE.width = w;
    TEMP_SIZE.height = h;
    const markerType = symbol['markerType'];
    const p = getAlignPoint(TEMP_SIZE, symbol['markerHorizontalAlignment'] || getDefaultHAlign(markerType), symbol['markerVerticalAlignment'] || getDefaultVAlign(markerType));
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
    const width = getValueOrDefault(symbol['markerWidth'], DEFAULT_MARKER_SYMBOLS.markerWidth);
    const height = getValueOrDefault(symbol['markerHeight'], DEFAULT_MARKER_SYMBOLS.markerHeight);
    const lineWidth = getValueOrDefault(symbol['markerLineWidth'], DEFAULT_MARKER_SYMBOLS.markerLineWidth),
        shadow = 2 * ((symbol['shadowBlur'] || 0) + Math.max(Math.abs(symbol['shadowOffsetX'] || 0) + Math.abs(symbol['shadowOffsetY'] || 0))), // add some tolerance for shadowOffsetX/Y
        w = Math.round(width + lineWidth + shadow + padding * 2),
        h = Math.round(height + lineWidth + shadow + padding * 2);
    out[0] = w;
    out[1] = h;
    return out;
}

const ROTATE_EXTENT = new PointExtent();
function rotateExtent(fixedExtent, angle) {
    const { xmin, ymin, xmax, ymax } = fixedExtent;
    ROTATE_EXTENT.set(xmin, ymin, xmax, ymax);
    return ROTATE_EXTENT.convertTo(p => p._rotate(angle), fixedExtent);
}

export function getMarkerRotation(symbol, prop = 'markerRotation') {
    const r = symbol[prop];
    if (!isNumber(r)) {
        return 0;
    }
    //to radian
    return -r * Math.PI / 180;
}

export function getImageMarkerFixedExtent(out, symbol, resources) {
    const url = symbol['markerFile'],
        img = resources ? resources.getImage(url) : null;
    const width = symbol['markerWidth'] || (img ? img.width : 0),
        height = symbol['markerHeight'] || (img ? img.height : 0);
    TEMP_SIZE.width = width;
    TEMP_SIZE.height = height;
    const alignPoint = getAlignPoint(TEMP_SIZE, symbol['markerHorizontalAlignment'] || 'middle', symbol['markerVerticalAlignment'] || 'top');
    return getFixedExtent(out, symbol['markerDx'] || 0, symbol['markerDy'] || 0,
        getMarkerRotation(symbol), alignPoint, width, height);
}


export function getTextMarkerFixedExtent(out, symbol, textDesc) {
    let size = textDesc['size'];
    const alignPoint = getAlignPoint(size, symbol['textHorizontalAlignment'], symbol['textVerticalAlignment']);
    if (symbol['textHaloRadius']) {
        const r = symbol['textHaloRadius'];
        size = size.add(r * 2, r * 2);
    }
    return getFixedExtent(out, symbol['textDx'] || 0, symbol['textDy'] || 0, getMarkerRotation(symbol, 'textRotation'),
        alignPoint, size.width, size.height);
}

const FIXED_EXTENT = new PointExtent();
export function getMarkerFixedExtent(out, symbol, resources, textDesc) {
    const extent = out || new PointExtent();
    if (Array.isArray(symbol)) {
        const symbols = symbol;
        for (let i = 0; i < symbols.length; i++) {
            getMarkerFixedExtent(extent, symbols[i], resources, textDesc[i]);
        }
        return extent;
    }
    if (isTextSymbol(symbol)) {
        extent._combine(getTextMarkerFixedExtent(FIXED_EXTENT, symbol, textDesc));
    }
    if (isImageSymbol(symbol)) {
        extent._combine(getImageMarkerFixedExtent(FIXED_EXTENT, symbol, resources));
    }
    if (isVectorSymbol(symbol)) {
        extent._combine(getVectorMarkerFixedExtent(FIXED_EXTENT, symbol));
    }
    if (isPathSymbol(symbol)) {
        extent._combine(getImageMarkerFixedExtent(FIXED_EXTENT, symbol));
    }
    return extent;
}


export function isTextSymbol(symbol) {
    if (!symbol) {
        return false;
    }
    if (!isNil(symbol['textName'])) {
        return true;
    }
    return false;
}


export function isImageSymbol(symbol) {
    if (!symbol) {
        return false;
    }
    if (!isNil(symbol['markerFile'])) {
        return true;
    }
    return false;
}

export function isVectorSymbol(symbol) {
    if (!symbol) {
        return false;
    }
    if (isNil(symbol['markerFile']) && !isNil(symbol['markerType']) && (symbol['markerType'] !== 'path')) {
        return true;
    }
    return false;
}

export function isPathSymbol(symbol) {
    if (!symbol) {
        return false;
    }
    if (isNil(symbol['markerFile']) && symbol['markerType'] === 'path') {
        return true;
    }
    return false;
}

export const DYNAMIC_SYMBOL_PROPS = [
    'markerWidth', 'markerHeight', 'markerHorizontalAlignment', 'markerVerticalAlignment', 'markerDx', 'markerDy',
    'textName',
    'textSize', 'textDx', 'textDy', 'textVerticalAlignment', 'textHorizontalAlignment', 'textRotation'
];

export const SIZE_SYMBOL_PROPS = [
    'textName', 'markerType', 'markerFile', 'textHaloRadius', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY', 'textWrapWidth'
];
