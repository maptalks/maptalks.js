/* eslint-disable @typescript-eslint/ban-ts-comment */
import { isNumber, isNil } from './common';
import { sign, getValueOrDefault } from './util';
import { getAlignPoint } from './strings';
import Point from '../../geo/Point';
import PointExtent from '../../geo/PointExtent';
import Size from '../../geo/Size';
import { type MarkerType } from './draw'
import { ResourceCache } from '../../renderer/layer/CanvasRenderer'

export const DEFAULT_MARKER_SYMBOLS = {
    markerWidth: 10,
    markerHeight: 10,
    markerLineWidth: 1
};

//-------------- methods for fixed extent of markers -------------
const TEMP_DXDYPOINT = new Point(0, 0);

/** p(0,0)
 *   \
 *    \
 *     \
 *      \
 *     dxdy
 */
function getDxDyRad(dxdy?: Point) {
    if (!dxdy) {
        return 0;
    }
    const { x, y } = dxdy;
    if (x === 0 && y === 0) {
        return 0;
    }
    if (x === 0 || !x) {
        if (y < 0) {
            return -Math.PI / 2;
        }
        if (y > 0) {
            return Math.PI / 2;
        }
    }
    const tan = y / x;
    if (y < 0 && x < 0) {
        return Math.atan(tan) - Math.PI;
    } else if (y > 0 && x < 0) {
        return Math.atan(tan) + Math.PI;
    }
    return Math.atan(tan);

}


function getImageRotateBBOX(width: number, height: number, rad: number) {
    /**
     * p1(0,0)
     * p2(0,height)
     * p3(width,height)
     * p4(width,0)
     *
     * p1 --------- p4
     * |            |
     * |            |
     * |            |
     * p2 --------- p3
     */
    const rad2 = Math.PI / 2 + rad;
    const rad3 = Math.PI / 4 + rad;
    const rad4 = rad;

    const r2 = height;
    const r3 = Math.sqrt(width * width + height * height);
    const r4 = width;


    const p1x = 0, p1y = 0;
    const p2x = Math.cos(rad2) * r2, p2y = Math.sin(rad2) * r2;
    const p3x = Math.cos(rad3) * r3, p3y = Math.sin(rad3) * r3;
    const p4x = Math.cos(rad4) * r4, p4y = Math.sin(rad4) * r4;
    const minx = Math.min(p2x, p3x, p4x, p1x);
    const miny = Math.min(p2y, p3y, p4y, p1y);
    const maxx = Math.max(p2x, p3x, p4x, p1x);
    const maxy = Math.max(p2y, p3y, p4y, p1y);
    return [minx, miny, maxx - minx, maxy - miny];
}

export function getMarkerRotationExtent(out: PointExtent, rad: number, width: number, height: number, dxdy: Point, alignPoint: Point) {
    const x = dxdy.x + alignPoint.x, y = dxdy.y + alignPoint.y;
    TEMP_DXDYPOINT.x = x;
    TEMP_DXDYPOINT.y = y;
    //dxdy rad
    const dxdyRad = getDxDyRad(TEMP_DXDYPOINT);
    //dxdy的半径
    const radius = Math.sqrt(x * x + y * y);
    //dydy 在 markerRaotation下的像素点新的位置
    /**
     *     p
     *     /\
     *    /  \
     *   /    \
     *  /      \
     * /        \
     * dxdy    rxry
     */
    const rx = Math.cos(rad + dxdyRad) * radius, ry = Math.sin(rad + dxdyRad) * radius;
    //p像素点平移到 rxry所在的像素点
    let minx = 0, miny = 0;
    minx += rx;
    miny += ry;
    //计算旋转图形后新的图形的BBOX
    const [offsetX, offsetY, w, h] = getImageRotateBBOX(width, height, rad);
    minx += offsetX;
    miny += offsetY;
    const maxx = minx + Math.max(width, w), maxy = miny + Math.max(height, h);
    out.set(minx, miny, maxx, maxy);
    return out;
}

function getVectorPadding(/*symbol*/) {
    return 0.5;
}

const DXDY = new Point(0, 0);
function getFixedExtent(out: PointExtent, dx: number, dy: number, rotation: number, alignPoint: Point, w: number, h: number) {
    const dxdy = DXDY.set(dx, dy);
    if (rotation) {
        return getMarkerRotationExtent(out, rotation, w, h, dxdy, alignPoint);
    }
    const result = out.set(dxdy.x, dxdy.y, dxdy.x + w, dxdy.y + h);
    result._add(alignPoint);
    if (rotation) {
        rotateExtent(result, rotation);
    }

    return result;
}

const SIZE: any = [];
export function getVectorMarkerFixedExtent(out: PointExtent, symbol: any, size?: [number, number]) {
    // const padding = getVectorPadding(symbol) * 2;
    size = size || calVectorMarkerSize(SIZE, symbol);
    if (size && (size[0] === 0 || size[1] === 0)) {
        emptyExtent(out);
        return out;
    }
    // if (padding) {
    //     size = size.map(d => d - padding);
    // }
    const alignPoint = getVectorMarkerAnchor(symbol, size[0], size[1]);
    return getFixedExtent(out, symbol['markerDx'] || 0, symbol['markerDy'] || 0,
        getMarkerRotation(symbol), alignPoint, size[0], size[1]);
}

export function getDefaultHAlign(markerType?: MarkerType) {
    if (markerType === 'rectangle') {
        return 'right';
    } else {
        return 'middle';
    }
}

export function getDefaultVAlign(markerType?: MarkerType) {
    if (markerType === 'bar' || markerType === 'pie' || markerType === 'pin') {
        return 'top';
    } else if (markerType === 'rectangle') {
        return 'bottom';
    } else {
        return 'middle';
    }
}


const TEMP_SIZE = new Size(0, 0);
export function getVectorMarkerAnchor(symbol: any, w: number, h: number) {
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

export function calVectorMarkerSize(out: [number, number], symbol: any) {
    const padding = getVectorPadding();
    const width = getValueOrDefault(symbol['markerWidth'], DEFAULT_MARKER_SYMBOLS.markerWidth);
    const height = getValueOrDefault(symbol['markerHeight'], DEFAULT_MARKER_SYMBOLS.markerHeight);
    if (width === 0 || height === 0) {
        out[0] = 0;
        out[1] = 0;
        return out;
    }
    const lineWidth = getValueOrDefault(symbol['markerLineWidth'], DEFAULT_MARKER_SYMBOLS.markerLineWidth),
        shadow = 2 * ((symbol['shadowBlur'] || 0) + Math.max(Math.abs(symbol['shadowOffsetX'] || 0) + Math.abs(symbol['shadowOffsetY'] || 0))), // add some tolerance for shadowOffsetX/Y
        w = Math.round(width + lineWidth + shadow + padding * 2),
        h = Math.round(height + lineWidth + shadow + padding * 2);
    out[0] = w;
    out[1] = h;
    return out;
}

const ROTATE_EXTENT = new PointExtent();
function rotateExtent(fixedExtent: PointExtent, angle: number) {
    const { xmin, ymin, xmax, ymax } = fixedExtent;
    ROTATE_EXTENT.set(xmin, ymin, xmax, ymax);
    return ROTATE_EXTENT.convertTo(p => p._rotate(angle), fixedExtent);
}

export function getMarkerRotation(symbol:any, prop = 'markerRotation') {
    const r = symbol[prop];
    if (!isNumber(r)) {
        return 0;
    }
    //to radian
    return -r * Math.PI / 180;
}

export function getImageMarkerFixedExtent(out: PointExtent, symbol: any, resources?: ResourceCache) {
    const url = symbol['markerFile'],
        img = resources ? resources.getImage(url) : null;
    const width = symbol['markerWidth'] || (img ? img.width : 0),
        height = symbol['markerHeight'] || (img ? img.height : 0);
    TEMP_SIZE.width = width;
    TEMP_SIZE.height = height;
    if (symbol['markerWidth'] === 0 || symbol['markerHeight'] === 0) {
        emptyExtent(out);
        return out;
    }
    const alignPoint = getAlignPoint(TEMP_SIZE, symbol['markerHorizontalAlignment'] || 'middle', symbol['markerVerticalAlignment'] || 'top');
    return getFixedExtent(out, symbol['markerDx'] || 0, symbol['markerDy'] || 0,
        getMarkerRotation(symbol), alignPoint, width, height);
}


export function getTextMarkerFixedExtent(out: PointExtent, symbol: any, textDesc: any) {
    const size = textDesc['size'];
    if (size && (size.width === 0 || size.height === 0)) {
        emptyExtent(out);
        return out;
    }
    const alignPoint = getAlignPoint(size, symbol['textHorizontalAlignment'], symbol['textVerticalAlignment']);
    // if (symbol['textHaloRadius']) {
    //     const r = symbol['textHaloRadius'];
    //     size = size.add(r * 2, r * 2);
    // }
    const textHaloRadius = (symbol.textHaloRadius || 0);
    const extent = getFixedExtent(out, symbol['textDx'] || 0, symbol['textDy'] || 0, getMarkerRotation(symbol, 'textRotation'),
        alignPoint, size.width, size.height);
    extent.xmin -= textHaloRadius;
    extent.xmax += textHaloRadius;
    extent.ymin -= textHaloRadius;
    extent.ymax += textHaloRadius;
    return extent;
}

const FIXED_EXTENT = new PointExtent();
export function getMarkerFixedExtent(out: PointExtent, symbol: any, resources: ResourceCache, textDesc: any) {

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


export function isTextSymbol(symbol: any) {
    if (!symbol) {
        return false;
    }
    if (!isNil(symbol['textName'])) {
        return true;
    }
    return false;
}


export function isImageSymbol(symbol: any) {
    if (!symbol) {
        return false;
    }
    if (!isNil(symbol['markerFile'])) {
        return true;
    }
    return false;
}

export function isVectorSymbol(symbol: any) {
    if (!symbol) {
        return false;
    }
    if (isNil(symbol['markerFile']) && !isNil(symbol['markerType']) && (symbol['markerType'] !== 'path')) {
        return true;
    }
    return false;
}

export function isPathSymbol(symbol: any) {
    if (!symbol) {
        return false;
    }
    if (isNil(symbol['markerFile']) && symbol['markerType'] === 'path') {
        return true;
    }
    return false;
}

export const DYNAMIC_SYMBOL_PROPS = [
    'markerWidth', 'markerHeight', 'markerHorizontalAlignment', 'markerVerticalAlignment', 'markerDx', 'markerDy', 'markerRotation',
    'textName',
    'textSize', 'textDx', 'textDy', 'textVerticalAlignment', 'textHorizontalAlignment', 'textRotation', 'textWrapWidth'
];

export const SIZE_SYMBOL_PROPS = [
    'textName', 'markerType', 'markerFile', 'textHaloRadius', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY', 'textWrapWidth'
];

export function emptyExtent(extent: PointExtent) {
    if (!extent) {
        return;
    }
    extent.xmin = Infinity;
    extent.ymin = Infinity;
    extent.xmax = -Infinity;
    extent.ymax = -Infinity;
}
