import {
    IS_NODE,
    isNil,
    isNumber,
    isString,
    isArrayHasData,
    isSVG,
    extractCssUrl,
    computeDegree
} from './util';
import { isGradient } from './util/style';
import { createEl } from './util/dom';
import Browser from './Browser';
import Point from '../geo/Point';
import { getFont, getAlignPoint } from './util/strings';
import { BBOX, BBOX_TEMP, getDefaultBBOX, pointsBBOX, resetBBOX, setBBOX, validateBBOX } from './util/bbox';
import Extent from '../geo/Extent';
import Size from '../geo/Size';
import CollisionIndex from './CollisionIndex';
import LRUCache from './util/LRUCache';

const charTextureLRUCache = new LRUCache(50000);
function getCharTexture(tempCtx: Ctx, style, char: string) {
    const font = tempCtx.font;
    const fillStyle = tempCtx.fillStyle;
    const strokeStyle = tempCtx.strokeStyle;
    const textHaloFill = style.textHaloFill || DEFAULT_STROKE_COLOR;
    const textHaloRadius = style.textHaloRadius || 0;
    let textHaloOpacity = style.textHaloOpacity;
    if (!isNumber(textHaloOpacity)) {
        textHaloOpacity = 1;
    }
    const key = `${font}_${fillStyle}_${textHaloFill}_${textHaloRadius}_${textHaloOpacity}_${char}`;
    let texture = charTextureLRUCache.get(key);
    if (!texture) {
        const drawHalo = textHaloOpacity !== 0 && textHaloRadius !== 0;
        const textSize = ((style.textSize || 14) * 1.2 + textHaloRadius) * 2;
        const canvas = Canvas.createCanvas(textSize, textSize);
        canvas.style.width = `${textSize / 2}px`;
        canvas.style.height = `${textSize / 2}px`;
        const x = textSize / 4, y = textSize / 4;
        const ctx = Canvas.getCanvas2DContext(canvas);
        ctx.scale(2, 2);

        ctx.font = font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (drawHalo) {
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = textHaloRadius * 2;
            ctx.globalAlpha = 1;
            ctx.globalAlpha *= textHaloOpacity;
            ctx.strokeText(char, x, y);
            ctx.globalAlpha = 1;
        }
        ctx.fillStyle = fillStyle;
        ctx.fillText(char, x, y);
        texture = canvas;
        charTextureLRUCache.add(key, texture);
    }
    return texture;

}

export type Ctx = CanvasRenderingContext2D;


type segmentType = {
    p1: Point,
    p2: Point,
    distance: number
}

type linechunkType = {
    points: Array<Point>,
    distance: number
}

type charItemType = {
    char: string,
    charSize: number,
    point: Point,
    bbox: BBOX
}

const DEFAULT_STROKE_COLOR = '#000';
const DEFAULT_FILL_COLOR = 'rgba(255,255,255,0)';
const DEFAULT_TEXT_COLOR = '#000';

let hitTesting = false;

let TEMP_CANVAS = null;

const RADIAN = Math.PI / 180;
const textOffsetY = 1;
const TEXT_BASELINE = 'top';

const textCharsCollisionIndex = new CollisionIndex();
const textPathsCollisionIndex = new CollisionIndex();

function getDefaultCharacterSet(): Record<string, string> {
    const charSet = {};
    for (let i = 32; i < 128; i++) {
        const char = String.fromCharCode(i)
        charSet[char] = char;
    }
    return charSet;
}

/**
 * 默认的字符
 */
const defaultChars = getDefaultCharacterSet();

/**
 * 文本是否全部是默认字符
 * @param chars
 * @returns 
 */
function textIsDefaultChars(chars: string[]) {
    for (let i = 0, len = chars.length; i < len; i++) {
        const char = chars[i];
        if (!defaultChars[char]) {
            return false;
        }
    }
    return true;
}

function reverseChars(chars: string[]) {
    if (chars.toReversed) {
        return chars.toReversed();
    }
    const newChars = [];
    for (let i = 0, len = chars.length - 1; i <= len; i++) {
        newChars[i] = chars[len - i];
    }
    return newChars;
}

/**
 * 字符的旋转角度
 * @param p1 
 * @param p2 
 * @param char 
 * @param direction 
 * @param isDefaultChars 
 * @returns 
 */
function getCharRotation(p1: Point, p2: Point, char: string, direction: string, isDefaultChars: boolean) {
    const x0 = p1.x, y0 = p1.y;
    const x1 = p2.x, y1 = p2.y;
    const dx = x1 - x0;
    const dy = y1 - y0;
    let rad = Math.atan2(dy, dx);
    let degree = rad / Math.PI * 180;
    // console.log(degree);
    if (direction === 'left') {
        degree += 180;
        rad = degree / 180 * Math.PI;
        return rad;
    }
    if (direction === 'down' && !isDefaultChars) {
        degree -= 90;
        rad = degree / 180 * Math.PI;
        return rad;
    }
    if (direction === 'up' && !isDefaultChars) {
        degree += 90;
        rad = degree / 180 * Math.PI;
        return rad;
    }
    return rad;
}

/**
 * 测量字符的大小
 * @param char 
 * @param fontSize 
 * @returns 
 */
function measureCharSize(char: string, fontSize: number) {
    let w = fontSize, h = fontSize;
    if (defaultChars[char]) {
        w = fontSize / 4;
        h = fontSize;
    }
    const d = Math.sqrt(w * w + h * h);
    return d;
}

/**
 * 计算文本的长度
 * @param textName 
 * @param fontSize 
 * @returns 
 */
function measureTextLength(textName: string, fontSize: number) {
    let textLen = 0;
    for (let i = 0, len = textName.length; i < len; i++) {
        const char = textName[i];
        textLen += measureCharSize(char, fontSize);
    }
    return textLen;
}

function getPercentPoint(segment: segmentType, dis: number) {
    const { distance, p1, p2 } = segment;
    const dx = p2.x - p1.x,
        dy = p2.y - p1.y,
        dh = (p2.z || 0) - (p1.z || 0);
    const percent = dis / distance;
    const x = p1.x + percent * dx;
    const y = p1.y + percent * dy;
    const z = (p1.z || 0) + percent * dh;
    return new Point(x, y, z);
}

/**
 * path 分割
 * https://github.com/deyihu/lineseg
 * @param points 
 * @param options 
 * @returns 
 */
function lineSeg(points: Array<Point>, options: any) {
    options = Object.assign({ segDistance: 1, isGeo: true }, options);
    const segDistance = Math.max(options.segDistance, 0.00000000000000001);
    const segments: Array<segmentType> = [];
    let totalLen = 0, idx = 0;
    for (let i = 0, len = points.length; i < len - 1; i++) {
        const p1 = points[i], p2 = points[i + 1];
        const dis = p2.distanceTo(p1);
        segments[idx] = {
            p1,
            distance: dis,
            p2
        }
        idx++;
        totalLen += dis;
    }
    if (totalLen <= segDistance) {
        return [{
            distance: totalLen,
            points
        }]
    }
    const len = segments.length;
    const first = segments[0];
    idx = 0;
    let currentPoint;
    let currentLen = 0;
    const lines = [];
    let tempLine = [first.p1];
    while (idx < len) {
        const { distance, p2 } = segments[idx];
        currentLen += distance;
        if (currentLen < segDistance) {
            tempLine.push(p2);
            idx++;
            continue;
        }
        if (currentLen === segDistance) {
            tempLine.push(p2);
            currentLen = 0;
            lines.push(tempLine);
            // next
            tempLine = [p2];
            idx++;
            continue;
        }
        if (currentLen > segDistance) {
            const offsetLen = segDistance - (currentLen - distance);
            currentPoint = getPercentPoint(segments[idx], offsetLen);
            tempLine.push(currentPoint);
            lines.push(tempLine);
            currentLen = 0;
            segments[idx].p1 = currentPoint;
            segments[idx].distance = distance - offsetLen;
            // next
            tempLine = [currentPoint];
        }
    }
    if (tempLine.length) {
        lines.push(tempLine);
    }
    const result: Array<linechunkType> = [];
    for (let i = 0, len = lines.length; i < len; i++) {
        const line = lines[i];
        result[i] = {
            points: line,
            distance: pathDistance(line)
        }
    }
    return result;
}

/**
 * 文本路径方向
 * @param path 
 * @returns 
 */
function textPathDirection(path: Array<charItemType>) {
    const len = path.length;
    const first = path[0].point, last = path[len - 1].point;
    const bbox = getDefaultBBOX();
    for (let i = 0, len = path.length; i < len; i++) {
        const point = path[i].point;
        pointsBBOX(point, bbox);
    }
    const [minx, miny, maxx, maxy] = bbox;
    const dx = maxx - minx, dy = maxy - miny;
    let ishorizontal = true;
    if (dy > dx) {
        ishorizontal = false;
    }
    if (ishorizontal) {
        if (first.x < last.x) {
            return 'right';
        }
        return 'left';
    } else {
        if (first.y < last.y) {
            return 'down';
        }
        return 'up'
    }
}

/**
 * 获取文本沿线路径的点
 * @param chunk 
 * @param chars 
 * @param fontSize 
 * @returns 
 */
function getTextPath(chunk: Array<Point>, chars: string[], fontSize: number, globalCollisonIndex: CollisionIndex) {
    const total = pathDistance(chunk);
    const result: Array<charItemType> = [];
    let tempLen = 0;
    let hasCollision = false;
    textCharsCollisionIndex.clear();
    let idx = 1;
    for (let i = 0, len = chars.length; i < len; i++) {
        const char = chars[i];
        const charSize = measureCharSize(char, fontSize);
        const d = charSize + tempLen;
        for (let j = idx, len1 = chunk.length; j < len1; j++) {
            const p1 = chunk[j - 1];
            const p2 = chunk[j];
            if (p2.distance < d) {
                continue;
            }
            idx = j;
            const dDistance = d - p1.distance;
            const percent = dDistance / (p2.distance - p1.distance);
            const dx = p2.x - p1.x, dy = p2.y - p1.y;
            const point = new Point(p1.x + dx * percent, p1.y + dy * percent);
            const { x, y } = point;
            let bufferSize = charSize / 3;
            const bbox = [x - bufferSize, y - bufferSize, x + bufferSize, y + bufferSize];
            //全局碰撞器里文本内部是否已经碰撞
            if (globalCollisonIndex && globalCollisonIndex.collides(bbox)) {
                hasCollision = true;
                break;
            }
            //文本内部是否已经碰撞
            if (textCharsCollisionIndex.collides(bbox)) {
                hasCollision = true;
                break;
            } else {
                textCharsCollisionIndex.insertBox(bbox);
            }
            bufferSize = charSize / 2;
            result.push({
                char,
                charSize,
                point,
                bbox: [x - bufferSize, y - bufferSize, x + bufferSize, y + bufferSize]
            });
            tempLen += charSize;
            break;
        }
        if (hasCollision) {
            break;
        }
    }
    if (hasCollision) {
        return [];
    }
    if (total < tempLen) {
        return [];
    }
    return result;
}



//推算 cubic 贝塞尔曲线片段的起终点和控制点坐标
//t0: 片段起始比例 0-1
//t1: 片段结束比例 0-1
//x1, y1, 曲线起点
//bx1, by1, bx2, by2，曲线控制点
//x2, y2  曲线终点
//结果是曲线片段的起点，2个控制点坐标和终点坐标
//https://stackoverflow.com/questions/878862/drawing-part-of-a-b%C3%A9zier-curve-by-reusing-a-basic-b%C3%A9zier-curve-function/879213#879213
function interpolate(t0, t1, x1, y1, bx1, by1, bx2, by2, x2, y2) {
    const u0 = 1.0 - t0;
    const u1 = 1.0 - t1;

    const qxa = x1 * u0 * u0 + bx1 * 2 * t0 * u0 + bx2 * t0 * t0;
    const qxb = x1 * u1 * u1 + bx1 * 2 * t1 * u1 + bx2 * t1 * t1;
    const qxc = bx1 * u0 * u0 + bx2 * 2 * t0 * u0 + x2 * t0 * t0;
    const qxd = bx1 * u1 * u1 + bx2 * 2 * t1 * u1 + x2 * t1 * t1;

    const qya = y1 * u0 * u0 + by1 * 2 * t0 * u0 + by2 * t0 * t0;
    const qyb = y1 * u1 * u1 + by1 * 2 * t1 * u1 + by2 * t1 * t1;
    const qyc = by1 * u0 * u0 + by2 * 2 * t0 * u0 + y2 * t0 * t0;
    const qyd = by1 * u1 * u1 + by2 * 2 * t1 * u1 + y2 * t1 * t1;

    // const xa = qxa * u0 + qxc * t0;
    const xb = qxa * u1 + qxc * t1;
    const xc = qxb * u0 + qxd * t0;
    const xd = qxb * u1 + qxd * t1;

    // const ya = qya * u0 + qyc * t0;
    const yb = qya * u1 + qyc * t1;
    const yc = qyb * u0 + qyd * t0;
    const yd = qyb * u1 + qyd * t1;

    return [xb, yb, xc, yc, xd, yd];
}

//from http://www.antigrain.com/research/bezier_interpolation/
function getCubicControlPoints(x0, y0, x1, y1, x2, y2, x3, y3, smoothValue, t) {
    // Assume we need to calculate the control
    // points between (x1,y1) and (x2,y2).
    // Then x0,y0 - the previous vertex,
    //      x3,y3 - the next one.
    const xc1 = (x0 + x1) / 2.0, yc1 = (y0 + y1) / 2.0;
    const xc2 = (x1 + x2) / 2.0, yc2 = (y1 + y2) / 2.0;
    const xc3 = (x2 + x3) / 2.0, yc3 = (y2 + y3) / 2.0;

    const len1 = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
    const len2 = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    const len3 = Math.sqrt((x3 - x2) * (x3 - x2) + (y3 - y2) * (y3 - y2));

    const k1 = len1 / (len1 + len2);
    const k2 = len2 / (len2 + len3);

    const xm1 = xc1 + (xc2 - xc1) * k1, ym1 = yc1 + (yc2 - yc1) * k1;

    const xm2 = xc2 + (xc3 - xc2) * k2, ym2 = yc2 + (yc3 - yc2) * k2;

    // Resulting control points. Here smoothValue is mentioned
    // above coefficient K whose value should be in range [0...1].
    const ctrl1X = xm1 + (xc2 - xm1) * smoothValue + x1 - xm1,
        ctrl1Y = ym1 + (yc2 - ym1) * smoothValue + y1 - ym1,

        ctrl2X = xm2 + (xc2 - xm2) * smoothValue + x2 - xm2,
        ctrl2Y = ym2 + (yc2 - ym2) * smoothValue + y2 - ym2;

    const ctrlPoints = [ctrl1X, ctrl1Y, ctrl2X, ctrl2Y];
    if (t < 1) {
        return interpolate(0, t, x1, y1, ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, x2, y2);
    } else {
        return ctrlPoints;
    }
}


function pathDistance(points: Array<Point>) {
    if (points.length < 2) {
        return 0;
    }
    let total = 0;
    points[0].distance = 0;
    for (let i = 1, len = points.length; i < len; i++) {
        const p1 = points[i - 1], p2 = points[i];
        const distance = p1.distanceTo(p2);
        p2.distance = distance + p1.distance;
        total += distance;
    }
    return total;
}

function getColorInMinStep(colorIn: any) {
    if (isNumber(colorIn.minStep)) {
        return colorIn.minStep;
    }
    const colors = colorIn.colors || [];
    const len = colors.length;
    const steps = [];
    for (let i = 0; i < len; i++) {
        steps[i] = colors[i][0];
    }
    steps.sort((a, b) => {
        return a - b;
    });
    let min = Infinity;
    for (let i = 1; i < len; i++) {
        const step1 = steps[i - 1], step2 = steps[i];
        const stepOffset = step2 - step1;
        min = Math.min(min, stepOffset);
    }
    colorIn.minStep = min;
    return min;

}

function getSegmentPercentPoint(p1: Point, p2: Point, percent: number) {
    const x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y;
    const dx = x2 - x1, dy = y2 - y1;
    return new Point(x1 + dx * percent, y1 + dy * percent);
}

const Canvas = {
    getCanvas2DContext(canvas: HTMLCanvasElement) {
        return canvas.getContext('2d', { willReadFrequently: true });
    },
    setHitTesting(testing: boolean) {
        hitTesting = testing;
    },

    createCanvas(width: number, height: number, canvasClass?) {
        let canvas;
        if (!IS_NODE) {
            canvas = createEl('canvas');
            canvas.width = width;
            canvas.height = height;
        } else {
            //can be node-canvas or any other canvas mock
            canvas = new canvasClass(width, height);
        }
        return canvas;
    },

    prepareCanvasFont(ctx: Ctx, style) {
        if (ctx.textBaseline !== TEXT_BASELINE) {
            ctx.textBaseline = TEXT_BASELINE;
        }
        const font = getFont(style);
        if (ctx.font !== font) {
            ctx.font = font;
        }
        let fill = style['textFill'];
        if (!fill) {
            fill = DEFAULT_TEXT_COLOR;
        }
        const fillStyle = Canvas.getRgba(fill, style['textOpacity']);
        if (ctx.fillStyle !== fillStyle) {
            ctx.fillStyle = fillStyle;
        }
    },

    /**
     * Set canvas's fill and stroke style
     * @param {CanvasRenderingContext2D} ctx
     * @param {Object} style
     * @param {Object} resources
     * @param {Boolean} testing  - paint for testing, ignore stroke and fill patterns
     */
    prepareCanvas(ctx: Ctx, style, resources, testing?: boolean) {
        if (!style) {
            return;
        }
        const strokeWidth = style['lineWidth'];
        if (!isNil(strokeWidth) && ctx.lineWidth !== strokeWidth) {
            ctx.lineWidth = strokeWidth;
        }
        const strokePattern = style['linePatternFile'];
        let strokeColor = style['lineColor'] || DEFAULT_STROKE_COLOR;
        if (testing) {
            ctx.strokeStyle = '#000';
        } else if (strokePattern && resources) {
            let patternOffset;
            if (style['linePatternDx'] || style['linePatternDy']) {
                patternOffset = [style['linePatternDx'], style['linePatternDy']];
            }
            Canvas._setStrokePattern(ctx, strokePattern, strokeWidth, patternOffset, resources);
            //line pattern will override stroke-dasharray
            style['lineDasharray'] = [];
        } else if (isGradient(strokeColor)) {
            if (style['lineGradientExtent']) {
                ctx.strokeStyle = Canvas._createGradient(ctx, strokeColor, style['lineGradientExtent']);
            } else {
                ctx.strokeStyle = DEFAULT_STROKE_COLOR;
            }
        } else /*if (ctx.strokeStyle !== strokeColor)*/ {
            if (Array.isArray(strokeColor)) {
                strokeColor = Canvas.normalizeColorToRGBA(strokeColor);
            }
            ctx.strokeStyle = strokeColor;
        }
        if (style['lineJoin']) {
            ctx.lineJoin = style['lineJoin'];
        }
        if (style['lineCap']) {
            ctx.lineCap = style['lineCap'];
        }
        if (ctx.setLineDash && isArrayHasData(style['lineDasharray'])) {
            ctx.setLineDash(style['lineDasharray']);
        }
        const polygonPattern = style['polygonPatternFile'];
        let fill = style['polygonFill'] || DEFAULT_FILL_COLOR;
        if (testing) {
            ctx.fillStyle = '#000';
        } else if (polygonPattern && resources) {
            const fillImgUrl = extractImageUrl(polygonPattern);
            let fillTexture = resources.getImage([fillImgUrl, null, null]);
            if (!fillTexture) {
                //if the linestring has a arrow and a linePatternFile, polygonPatternFile will be set with the linePatternFile.
                fillTexture = resources.getImage([fillImgUrl + '-texture', null, strokeWidth]);
            }
            if (isSVG(fillImgUrl) && (fillTexture instanceof Image) && (Browser.edge || Browser.ie)) {
                //opacity of svg img painted on canvas is always 1, so we paint svg on a canvas at first.
                const w = fillTexture.width || 20,
                    h = fillTexture.height || 20;
                const canvas = Canvas.createCanvas(w, h);
                Canvas.image(canvas.getContext('2d'), fillTexture, 0, 0, w, h);
                fillTexture = canvas;
            }
            if (!fillTexture) {
                if (typeof console !== 'undefined') {
                    console.warn('img not found for', fillImgUrl);
                }
            } else {
                ctx.fillStyle = ctx.createPattern(fillTexture, 'repeat');
                if (style['polygonPatternDx'] || style['polygonPatternDy']) {
                    ctx.fillStyle['polygonPatternOffset'] = [style['polygonPatternDx'], style['polygonPatternDy']];
                }
            }

        } else if (isGradient(fill)) {
            if (style['polygonGradientExtent']) {
                ctx.fillStyle = Canvas._createGradient(ctx, fill, style['polygonGradientExtent']);
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0)';
            }
        } else /*if (ctx.fillStyle !== fill)*/ {
            if (Array.isArray(fill)) {
                fill = Canvas.normalizeColorToRGBA(fill);
            }
            ctx.fillStyle = fill;
        }
    },

    //@internal
    _createGradient(ctx: Ctx, g, extent: Extent) {
        let gradient = null,
            places = g['places'];
        const min = extent.getMin(),
            max = extent.getMax(),
            width = extent.getWidth(),
            height = extent.getHeight();
        if (!g['type'] || g['type'] === 'linear') {
            if (!places) {
                places = [min.x, min.y, max.x, min.y];
            } else {
                if (places.length !== 4) {
                    throw new Error('A linear gradient\'s places should have 4 numbers.');
                }
                places = [
                    min.x + places[0] * width, min.y + places[1] * height,
                    min.x + places[2] * width, min.y + places[3] * height
                ];
            }
            // eslint-disable-next-line prefer-spread
            gradient = ctx.createLinearGradient.apply(ctx, places);
        } else if (g['type'] === 'radial') {
            if (!places) {
                const c = extent.getCenter()._round();
                places = [c.x, c.y, Math.abs(c.x - min.x), c.x, c.y, 0];
            } else {
                if (places.length !== 6) {
                    throw new Error('A radial gradient\'s places should have 6 numbers.');
                }
                places = [
                    min.x + places[0] * width, min.y + places[1] * height, width * places[2],
                    min.x + places[3] * width, min.y + places[4] * height, width * places[5]
                ];
            }
            // eslint-disable-next-line prefer-spread
            gradient = ctx.createRadialGradient.apply(ctx, places);
        }
        g['colorStops'].forEach(stop => {
            // eslint-disable-next-line prefer-spread
            gradient.addColorStop.apply(gradient, stop);
        });
        return gradient;
    },

    //@internal
    _setStrokePattern(ctx: Ctx, strokePattern: string, strokeWidth: number, linePatternOffset: number, resources) {
        const imgUrl = extractImageUrl(strokePattern);
        let imageTexture;
        if (IS_NODE) {
            imageTexture = resources.getImage([imgUrl, null, strokeWidth]);
        } else {
            const key = imgUrl + '-texture-' + strokeWidth;
            imageTexture = resources.getImage(key);
            if (!imageTexture) {
                const imageRes = resources.getImage([imgUrl, null, null]);
                if (imageRes) {
                    let w;
                    if (!imageRes.width || !imageRes.height) {
                        w = strokeWidth;
                    } else {
                        w = Math.round(imageRes.width * strokeWidth / imageRes.height);
                    }
                    const patternCanvas = Canvas.createCanvas(w, strokeWidth, ctx.canvas.constructor);
                    Canvas.image(patternCanvas.getContext('2d'), imageRes, 0, 0, w, strokeWidth);
                    resources.addResource([key, null, strokeWidth], patternCanvas);
                    imageTexture = patternCanvas;
                }
            }
        }
        if (imageTexture) {
            ctx.strokeStyle = ctx.createPattern(imageTexture, 'repeat');
            ctx.strokeStyle['linePatternOffset'] = linePatternOffset;
        } else if (typeof console !== 'undefined') {
            console.warn('img not found for', imgUrl);
        }
    },

    clearRect(ctx: Ctx, x1: number, y1: number, x2: number, y2: number) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ctx.canvas._drawn = false;
        ctx.clearRect(x1, y1, x2, y2);
    },

    fillCanvas(ctx: Ctx, fillOpacity: number, x?: number, y?: number) {
        if (hitTesting) {
            fillOpacity = 1;
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ctx.canvas._drawn = true;
        if (fillOpacity === 0) {
            return;
        }
        const isPattern = Canvas._isPattern(ctx.fillStyle);

        const offset = ctx.fillStyle && ctx.fillStyle['polygonPatternOffset'];
        const dx = offset ? offset[0] : 0,
            dy = offset ? offset[1] : 0;

        if (isNil(fillOpacity)) {
            fillOpacity = 1;
        }
        let alpha;
        if (fillOpacity < 1) {
            alpha = ctx.globalAlpha;
            ctx.globalAlpha *= fillOpacity;
        }
        if (isPattern) {
            x = x || 0;
            y = y || 0;
            // x = round(x);
            // y = round(y);
            ctx.translate(x + dx, y + dy);
        }
        ctx.fill();
        if (isPattern) {
            ctx.translate(-x - dx, -y - dy);
        }
        if (fillOpacity < 1) {
            ctx.globalAlpha = alpha;
        }
    },

    // hexColorRe: /^#([0-9a-f]{6}|[0-9a-f]{3})$/i,

    // support #RRGGBB/#RGB now.
    // if color was like [red, orange...]/rgb(a)/hsl(a), op will not combined to result
    getRgba(color: any, op: number) {
        if (isNil(op)) {
            op = 1;
        }
        if (color[0] !== '#') {
            if (Array.isArray(color)) {
                color = Canvas.normalizeColorToRGBA(color, op);
            }
            return color;
        }
        let r, g, b;
        if (color.length === 7) {
            r = parseInt(color.substring(1, 3), 16);
            g = parseInt(color.substring(3, 5), 16);
            b = parseInt(color.substring(5, 7), 16);
        } else {
            r = parseInt(color.substring(1, 2), 16) * 17;
            g = parseInt(color.substring(2, 3), 16) * 17;
            b = parseInt(color.substring(3, 4), 16) * 17;
        }
        return 'rgba(' + r + ',' + g + ',' + b + ',' + op + ')';
    },

    normalizeColorToRGBA(fill: number[], opacity = 1) {
        return `rgba(${fill[0] * 255}, ${fill[1] * 255}, ${fill[2] * 255}, ${(fill.length === 4 ? fill[3] : 1) * opacity})`;
    },

    image(ctx: Ctx, img: CanvasImageSource, x: number, y: number, width?: number, height?: number) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ctx.canvas._drawn = true;
        try {
            if (isNumber(width) && isNumber(height)) {
                ctx.drawImage(img, x, y, width, height);
            } else {
                ctx.drawImage(img, x, y);
            }
        } catch (error) {
            if (console) {
                console.warn('error when drawing image on canvas:', error);
                console.warn(img);
            }
        }
    },

    text(ctx: Ctx, text, pt, style, textDesc) {
        return Canvas._textOnMultiRow(ctx, textDesc['rows'], style, pt, textDesc['size'], textDesc['rawSize']);
    },

    //@internal
    _textOnMultiRow(ctx: Ctx, texts: any[], style, point, splitTextSize: Size, textSize: Size) {
        const ptAlign = getAlignPoint(splitTextSize, style['textHorizontalAlignment'], style['textVerticalAlignment']),
            lineHeight = textSize['height'] + style['textLineSpacing'],
            basePoint = point.add(0, ptAlign.y),
            maxHeight = style['textMaxHeight'];
        let text, rowAlign, height = 0;
        resetBBOX(BBOX_TEMP);
        for (let i = 0, len = texts.length; i < len; i++) {
            text = texts[i]['text'];
            rowAlign = getAlignPoint(texts[i]['size'], style['textHorizontalAlignment'], style['textVerticalAlignment']);
            const point = basePoint.add(rowAlign.x, i * lineHeight);
            Canvas._textOnLine(ctx, text, point, style['textHaloRadius'], style['textHaloFill'], style['textHaloOpacity']);
            const textSize = texts[i].size;
            const minx = point.x, miny = point.y, maxx = minx + textSize.width, maxy = miny + textSize.height;
            setBBOX(BBOX_TEMP, minx, miny, maxx, maxy);
            if (maxHeight > 0) {
                height += lineHeight;
                if (height + textSize['height'] >= maxHeight) {
                    break;
                }
            }
        }
        return BBOX_TEMP;
    },

    //@internal
    _textOnLine(ctx: Ctx, text, pt, textHaloRadius: number, textHaloFill, textHaloAlpha: number) {
        if (hitTesting) {
            textHaloAlpha = 1;
        }
        const drawHalo = textHaloAlpha !== 0 && textHaloRadius !== 0;
        // pt = pt._round();
        ctx.textBaseline = 'top';
        let gco, fill;
        const shadowBlur = ctx.shadowBlur,
            shadowOffsetX = ctx.shadowOffsetX,
            shadowOffsetY = ctx.shadowOffsetY;
        if (drawHalo) {
            const alpha = ctx.globalAlpha;
            //http://stackoverflow.com/questions/14126298/create-text-outline-on-canvas-in-javascript
            //根据text-horizontal-alignment和text-vertical-alignment计算绘制起始点偏移量
            ctx.globalAlpha *= textHaloAlpha;

            ctx.miterLimit = 2;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.lineWidth = textHaloRadius * 2;
            if (Array.isArray(textHaloFill)) {
                textHaloFill = Canvas.normalizeColorToRGBA(textHaloFill);
            }
            ctx.strokeStyle = textHaloFill;
            ctx.strokeText(text, pt.x, pt.y + textOffsetY);
            ctx.miterLimit = 10; //default

            ctx.globalAlpha = alpha;

            gco = ctx.globalCompositeOperation;
            ctx.globalCompositeOperation = 'destination-out';
            fill = ctx.fillStyle;
            ctx.fillStyle = '#000';
        }

        if (shadowBlur && drawHalo) {
            ctx.shadowBlur = ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
        }
        Canvas.fillText(ctx, text, pt);
        if (gco) {
            ctx.globalCompositeOperation = gco;
            Canvas.fillText(ctx, text, pt, fill);
            if (shadowBlur) {
                ctx.shadowBlur = shadowBlur;
                ctx.shadowOffsetX = shadowOffsetX;
                ctx.shadowOffsetY = shadowOffsetY;
            }
        }
    },

    fillText(ctx, text, pt, rgba?) {
        ctx.canvas._drawn = true;
        if (rgba) {
            ctx.fillStyle = rgba;
        }
        ctx.fillText(text, pt.x, pt.y + textOffsetY);
    },

    textAlongLine(ctx: Ctx, text: string, paths: Array<Array<Point>>, style, textDesc, globalCollisonIndex: CollisionIndex): BBOX {
        if (!text) {
            return;
        }

        const fontSize = style.textSize || 14;
        const textSpacing = style.textSpacing || 0;

        const textLen = measureTextLength(text, fontSize);
        if (textSpacing < textLen) {
            return;
        }
        if (!Array.isArray(paths[0])) {
            paths = [paths] as unknown as Array<Array<Point>>;
        }
        const textBaseline = ctx.textBaseline;
        const textAlign = ctx.textAlign;
        const strokeStyle = ctx.strokeStyle;
        const globalAlpha = ctx.globalAlpha;
        const lineWidth = ctx.lineWidth;

        const textAlongDebug = style.textAlongDebug;
        let textHaloFill = style.textHaloFill || DEFAULT_STROKE_COLOR;
        const textHaloRadius = style.textHaloRadius || 0;
        let textHaloOpacity = style.textHaloOpacity;
        if (!isNumber(textHaloOpacity)) {
            textHaloOpacity = 1;
        }
        const drawHalo = textHaloOpacity !== 0 && textHaloRadius !== 0;

        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        if (drawHalo) {
            if (Array.isArray(textHaloFill)) {
                textHaloFill = Canvas.normalizeColorToRGBA(textHaloFill);
            }
            ctx.strokeStyle = textHaloFill;
            ctx.lineWidth = textHaloRadius * 2;
        }
        textPathsCollisionIndex.clear();
        const charsBBOX = getDefaultBBOX();
        const charArray = text.split('');
        const isDefaultChars = textIsDefaultChars(charArray);
        paths.forEach(path => {
            const pathLen = pathDistance(path);
            if (pathLen < textLen) {
                return;
            }
            const lines = lineSeg(path, { segDistance: textSpacing });
            if (!lines || !lines.length) {
                return;
            }
            for (let m = 0, len1 = lines.length; m < len1; m++) {
                const chunk = lines[m];
                const chunkDistance = chunk.distance;
                if (chunkDistance < textLen) {
                    continue;
                }
                const points = chunk.points;
                //for debug
                if (textAlongDebug) {
                    const fillStyle = ctx.fillStyle;
                    ctx.fillStyle = 'red';
                    const { x, y } = points[0];
                    ctx.beginPath();
                    ctx.fillRect(x - 2, y - 2, 4, 4);
                    ctx.fillStyle = fillStyle;
                }
                let chars = charArray;
                let items = getTextPath(points, chars, fontSize, globalCollisonIndex);
                if (!items.length) {
                    continue;
                }

                const direction = textPathDirection(items);
                if (direction === 'left') {
                    //反向文本顺序
                    chars = reverseChars(chars);
                    items = getTextPath(points, chars, fontSize, globalCollisonIndex);
                }
                if (direction === 'up' && !isDefaultChars) {
                    //反向文本顺序
                    chars = reverseChars(chars);
                    items = getTextPath(points, chars, fontSize, globalCollisonIndex);
                }
                let hasCollision = false;
                for (let i = 0, len = items.length; i < len; i++) {
                    const { bbox } = items[i];
                    //当前pahts绘制时是否已经碰撞
                    if (textPathsCollisionIndex.collides(bbox)) {
                        hasCollision = true;
                        break;
                    }
                    //全局碰撞器里是否已经碰撞了,全局碰撞器可能来自地图或者图层
                    if (globalCollisonIndex && globalCollisonIndex.collides(bbox)) {
                        hasCollision = true;
                        break;
                    }
                }
                //没有通过碰撞检测
                if (hasCollision) {
                    continue;
                }
                for (let i = 0, len = items.length; i < len; i++) {
                    let p1, p2;
                    if (i === 0) {
                        p1 = items[i].point;
                        p2 = items[1].point;
                    } else if (i === len - 1) {
                        p1 = items[len - 2].point;
                        p2 = items[len - 1].point;
                    } else {
                        p1 = items[i - 1].point;
                        p2 = items[i].point;
                    }
                    const char = chars[i];
                    const { point, bbox } = items[i];
                    textPathsCollisionIndex.insertBox(bbox);
                    globalCollisonIndex && globalCollisonIndex.insertBox(bbox);
                    const { x, y } = point;
                    const rad = getCharRotation(p1, p2, char, direction, isDefaultChars);
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(rad);
                    const texture = getCharTexture(ctx, style, char);
                    const { width, height } = texture;
                    ctx.drawImage(texture, -width / 4, -height / 4, width / 2, height / 2);
                    // //描边 why? canvas text performance is poor
                    // if (drawHalo) {
                    //     const alpha = ctx.globalAlpha;
                    //     ctx.globalAlpha = 1;
                    //     ctx.globalAlpha *= textHaloOpacity;
                    //     ctx.strokeText(char, 0, 0);
                    //     ctx.globalAlpha = alpha;
                    // }
                    // ctx.fillText(char, 0, 0);
                    ctx.restore();
                    //合并所有的字符的包围盒
                    setBBOX(charsBBOX, bbox);
                    //for debug
                    if (textAlongDebug) {
                        const strokeStyle = ctx.strokeStyle;
                        const lineWidth = ctx.lineWidth;
                        ctx.strokeStyle = 'red';
                        ctx.lineWidth = 0.5;
                        const [minx, miny, maxx, maxy] = bbox;
                        ctx.beginPath();
                        ctx.rect(minx, miny, maxx - minx, maxy - miny);
                        ctx.stroke();
                        ctx.lineWidth = lineWidth;
                        ctx.strokeStyle = strokeStyle;
                    }
                }
            }
        });
        //restore canvas states
        ctx.textBaseline = textBaseline;
        ctx.textAlign = textAlign;
        ctx.strokeStyle = strokeStyle;
        ctx.globalAlpha = globalAlpha;
        ctx.lineWidth = lineWidth;
        if (!validateBBOX(charsBBOX)) {
            return;
        }
        return charsBBOX;
    },

    //@internal
    _stroke(ctx, strokeOpacity, x?, y?) {
        if (hitTesting) {
            strokeOpacity = 1;
        }
        ctx.canvas._drawn = true;
        if (strokeOpacity === 0) {
            return;
        }
        const offset = ctx.strokeStyle && ctx.strokeStyle['linePatternOffset'];
        const dx = offset ? offset[0] : 0,
            dy = offset ? offset[1] : 0;

        const isPattern = Canvas._isPattern(ctx.strokeStyle) && (!isNil(x) && !isNil(y) || !isNil(dx) && !isNil(dy));

        if (isNil(strokeOpacity)) {
            strokeOpacity = 1;
        }
        let alpha;
        if (strokeOpacity < 1) {
            alpha = ctx.globalAlpha;
            ctx.globalAlpha *= strokeOpacity;
        }
        if (isPattern) {
            x = x || 0;
            y = y || 0;
            // x = round(x);
            // y = round(y);
            ctx.translate(x + dx, y + dy);
        }
        ctx.stroke();
        if (isPattern) {
            ctx.translate(-x - dx, -y - dy);
        }
        if (strokeOpacity < 1) {
            ctx.globalAlpha = alpha;
        }
    },

    /**
     * mock gradient path
     * 利用颜色插值来模拟渐变的Path
     * @param ctx 
     * @param points 
     * @param lineDashArray 
     * @param lineOpacity 
     * @param isRing 
     * @returns 
     */
    _gradientPath(ctx: CanvasRenderingContext2D, points, lineDashArray, lineOpacity, isRing = false) {
        if (!isNumber(lineOpacity)) {
            lineOpacity = 1;
        }
        if (hitTesting) {
            lineOpacity = 1;
        }
        if (lineOpacity === 0 || ctx.lineWidth === 0) {
            return;
        }
        const alpha = ctx.globalAlpha;
        ctx.globalAlpha *= lineOpacity;
        const colorIn = ctx.lineColorIn;
        //颜色插值的最小步数
        const minStep = getColorInMinStep(colorIn);
        const distance = pathDistance(points);
        let step = 0;
        let preColor, color;
        let preX, preY, currentX, currentY, nextPoint;

        const [r, g, b, a] = colorIn.getColor(0);
        preColor = `rgba(${r}, ${g}, ${b}, ${a})`;

        const firstPoint = points[0];
        preX = firstPoint.x;
        preY = firstPoint.y;
        //check polygon ring
        if (isRing) {
            const len = points.length;
            const lastPoint = points[len - 1];
            if (!firstPoint.equals(lastPoint)) {
                points.push(firstPoint);
            }
        }

        const dashArrayEnable = lineDashArray && Array.isArray(lineDashArray) && lineDashArray.length > 1;

        const drawSegment = () => {
            //绘制底色,来掩盖多个segment绘制接头的锯齿
            if (!dashArrayEnable && nextPoint) {
                ctx.strokeStyle = color;
                ctx.beginPath();
                ctx.moveTo(preX, preY);
                ctx.lineTo(currentX, currentY);
                ctx.lineTo(nextPoint.x, nextPoint.y);
                ctx.stroke();
            }
            const grad = ctx.createLinearGradient(preX, preY, currentX, currentY);
            grad.addColorStop(0, preColor);
            grad.addColorStop(1, color);
            ctx.strokeStyle = grad;
            ctx.beginPath();
            ctx.moveTo(preX, preY);
            ctx.lineTo(currentX, currentY);
            ctx.stroke();
            preColor = color;
            preX = currentX;
            preY = currentY;
        }

        for (let i = 1, len = points.length; i < len; i++) {
            const prePoint = points[i - 1], currentPoint = points[i];
            nextPoint = points[i + 1];
            const x = currentPoint.x, y = currentPoint.y;
            const dis = currentPoint.distanceTo(prePoint);
            const percent = dis / distance;

            //segment的步数小于minStep
            if (percent <= minStep) {
                const [r, g, b, a] = colorIn.getColor(step + percent);
                color = `rgba(${r}, ${g}, ${b}, ${a})`;
                currentX = x;
                currentY = y;
                drawSegment();
            } else {
                //拆分segment
                const segments = Math.ceil(percent / minStep);
                nextPoint = currentPoint;
                for (let n = 1; n <= segments; n++) {
                    const tempStep = Math.min((n * minStep), percent);
                    const [r, g, b, a] = colorIn.getColor(step + tempStep);
                    color = `rgba(${r}, ${g}, ${b}, ${a})`;
                    if (color === preColor) {
                        continue;
                    }
                    const point = getSegmentPercentPoint(prePoint, currentPoint, tempStep / percent);
                    currentX = point.x;
                    currentY = point.y;
                    drawSegment();
                }
            }
            step += percent;
        }
        ctx.globalAlpha = alpha;
    },


    //@internal
    _path(ctx, points, lineDashArray?, lineOpacity?, ignoreStrokePattern?) {
        if (!isArrayHasData(points)) {
            return;
        }

        function fillWithPattern(p1, p2) {
            const degree = computeDegree(p1.x, p1.y, p2.x, p2.y);
            ctx.save();
            // const cosd = Math.cos(degree);
            // if (Math.abs(cosd) < 1E-7) {
            //     //a vertical line
            //     ctx.translate(p1.x - ctx.lineWidth / 2, p1.y);
            // } else {
            //     ctx.translate(p1.x, p1.y - ctx.lineWidth / 2 / cosd);
            // }
            ctx.rotate(degree);
            Canvas._stroke(ctx, lineOpacity);
            ctx.restore();
        }

        const isDashed = isArrayHasData(lineDashArray);
        const isPatternLine = (ignoreStrokePattern === true ? false : Canvas._isPattern(ctx.strokeStyle));
        let point, prePoint, nextPoint;
        for (let i = 0, len = points.length; i < len; i++) {
            point = points[i];
            if (!isDashed || ctx.setLineDash) { //IE9+
                ctx.lineTo(point.x, point.y);
                if (isPatternLine && i > 0) {
                    prePoint = points[i - 1];
                    fillWithPattern(prePoint, point);
                    ctx.beginPath();
                    ctx.moveTo(point.x, point.y);
                }
            } else if (isDashed) {
                if (i === len - 1) {
                    break;
                }
                nextPoint = points[i + 1];
                // drawDashLine(ctx, point, nextPoint, lineDashArray, isPatternLine);
                drawDashLine(ctx, point, nextPoint, lineDashArray);
            }
        }
    },

    path(ctx: CanvasRenderingContext2D, points, lineOpacity, fillOpacity?, lineDashArray?) {
        if (!isArrayHasData(points)) {
            return;
        }

        if (ctx.lineColorIn) {
            this._gradientPath(ctx, points, lineDashArray, lineOpacity);
        } else {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            Canvas._path(ctx, points, lineDashArray, lineOpacity);
        }
        Canvas._stroke(ctx, lineOpacity);
    },

    //@internal
    _multiClip(ctx, points) {
        if (!points || points.length === 0) return;
        points.forEach(pts => {
            for (let i = 0, len = pts.length; i < len; i++) {
                const point = pts[i];
                let x = point.x, y = point.y;
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                if (i === len - 1) {
                    x = pts[0].x;
                    y = pts[0].y;
                    ctx.lineTo(x, y);
                }
            }
        });
    },

    polygon(ctx, points, lineOpacity, fillOpacity, lineDashArray?, smoothness?) {
        // if MultiPolygon clip
        if (ctx.isMultiClip) {
            Canvas._multiClip(ctx, points);
            return;
        }
        //polygon clip
        if (ctx.isClip) {
            // if points[0] is array ,the polygon has hole,ignore holes
            Canvas._multiClip(ctx, Array.isArray(points[0]) ? points : [points]);
            return;
        }
        if (!isArrayHasData(points)) {
            return;
        }

        const isPatternLine = Canvas._isPattern(ctx.strokeStyle),
            fillFirst = (isArrayHasData(lineDashArray) && !ctx.setLineDash) || isPatternLine && !smoothness;
        if (!isArrayHasData(points[0])) {
            points = [points];
        }
        const savedCtx = ctx;
        const dpr = ctx.dpr || 1;
        const needScale = dpr !== 1;
        if (points.length > 1 && !IS_NODE) {
            if (!TEMP_CANVAS) {
                TEMP_CANVAS = Canvas.createCanvas(1, 1);
            }
            ctx.canvas._drawn = false;
            TEMP_CANVAS.width = ctx.canvas.width;
            TEMP_CANVAS.height = ctx.canvas.height;
            ctx = TEMP_CANVAS.getContext('2d');
            //reset lineDashArray
            setLineDash(ctx, []);
            setLineDash(ctx, lineDashArray);
            copyProperties(ctx, savedCtx);
            if (needScale) {
                ctx.scale(dpr, dpr);
            }

        }
        const lineColorIn = ctx.lineColorIn;
        const lineWidth = ctx.lineWidth;
        // function fillPolygon(points, i, op) {
        //     Canvas.fillCanvas(ctx, op, points[i][0].x, points[i][0].y);
        // }
        let op, i, len;
        if (fillFirst) {
            //因为canvas只填充moveto,lineto,lineto的空间, 而dashline的moveto不再构成封闭空间, 所以重新绘制图形轮廓用于填充
            ctx.save();
            for (i = 0, len = points.length; i < len; i++) {
                if (!isArrayHasData(points[i])) {
                    continue;
                }
                //渐变时忽略不在绘制storke
                if (lineColorIn) {
                    ctx.lineWidth = 0.1;
                }
                Canvas._ring(ctx, points[i], null, 0, true);
                op = fillOpacity;
                if (i > 0) {
                    ctx.globalCompositeOperation = 'destination-out';
                    op = 1;
                }
                Canvas.fillCanvas(ctx, op, points[i][0].x, points[i][0].y);
                if (i > 0) {
                    ctx.globalCompositeOperation = 'source-over';
                } else if (len > 1) {
                    // make sure 'destination-out'
                    ctx.fillStyle = '#fff';
                }
                Canvas._stroke(ctx, 0);
                ctx.lineWidth = lineWidth;
                if (lineColorIn) {
                    Canvas._gradientPath(ctx, points, null, 0, true);
                }
            }
            ctx.restore();
        }
        const fillStyle = ctx.fillStyle;
        for (i = 0, len = points.length; i < len; i++) {
            if (!isArrayHasData(points[i])) {
                continue;
            }
            if (lineColorIn) {
                ctx.lineWidth = 0.1;
            }
            if (smoothness) {
                Canvas.paintSmoothLine(ctx, points[i], lineOpacity, smoothness, true);
                ctx.closePath();
            } else {
                Canvas._ring(ctx, points[i], lineDashArray, lineOpacity);
            }

            if (!fillFirst) {
                op = fillOpacity;
                if (i > 0) {
                    ctx.globalCompositeOperation = 'destination-out';
                    op = 1;
                }
                Canvas.fillCanvas(ctx, op, points[i][0].x, points[i][0].y);
                if (i > 0) {
                    //return to default compositeOperation to display strokes.
                    ctx.globalCompositeOperation = 'source-over';
                } else if (len > 1) {
                    // make sure 'destination-out'
                    ctx.fillStyle = '#fff';
                }
            }
            Canvas._stroke(ctx, lineOpacity);
            ctx.lineWidth = lineWidth;
            if (lineColorIn) {
                Canvas._gradientPath(ctx, points[i], lineDashArray, lineOpacity, true);
            }
        }
        //还原fillStyle
        if (ctx.fillStyle !== fillStyle) {
            ctx.fillStyle = fillStyle;
        }
        if (points.length > 1 && !IS_NODE) {
            if (needScale) {
                const rScale = 1 / dpr;
                savedCtx.scale(rScale, rScale);
            }
            savedCtx.drawImage(TEMP_CANVAS, 0, 0);
            if (needScale) {
                savedCtx.scale(dpr, dpr);
            }
            savedCtx.canvas._drawn = ctx.canvas._drawn;
            copyProperties(savedCtx, ctx);
        }
    },

    //@internal
    _ring(ctx, ring, lineDashArray, lineOpacity, ignorePattern?) {
        const isPattern = Canvas._isPattern(ctx.strokeStyle);
        if (!ignorePattern && isPattern && !ring[0].equals(ring[ring.length - 1])) {
            ring = ring.concat([ring[0]]);
        }
        ctx.beginPath();
        ctx.moveTo(ring[0].x, ring[0].y);
        Canvas._path(ctx, ring, lineDashArray, lineOpacity, ignorePattern);
        if (!isPattern) {
            ctx.closePath();
        }
    },
    //备份老的方法
    paintSmoothLine_bak(ctx, points, lineOpacity, smoothValue, close, tailIdx?, tailRatio?) {
        if (!points) {
            return;
        }
        if (points.length <= 2 || !smoothValue) {
            Canvas.path(ctx, points, lineOpacity);
            return;
        }

        let count = points.length;
        let l = close ? count : count - 1;

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        if (tailRatio !== undefined) l -= Math.max(l - tailIdx - 1, 0);
        let preCtrlPoints;
        for (let i = 0; i < l; i++) {
            const x1 = points[i].x, y1 = points[i].y;

            let x0, y0, x2, y2, x3, y3;
            if (i - 1 < 0) {
                if (!close) {
                    x0 = points[i + 1].x;
                    y0 = points[i + 1].y;
                } else {
                    x0 = points[l - 1].x;
                    y0 = points[l - 1].y;
                }
            } else {
                x0 = points[i - 1].x;
                y0 = points[i - 1].y;
            }
            if (i + 1 < count) {
                x2 = points[i + 1].x;
                y2 = points[i + 1].y;
            } else {
                x2 = points[i + 1 - count].x;
                y2 = points[i + 1 - count].y;
            }
            if (i + 2 < count) {
                x3 = points[i + 2].x;
                y3 = points[i + 2].y;
            } else if (!close) {
                x3 = points[i].x;
                y3 = points[i].y;
            } else {
                x3 = points[i + 2 - count].x;
                y3 = points[i + 2 - count].y;
            }

            const ctrlPoints = getCubicControlPoints(x0, y0, x1, y1, x2, y2, x3, y3, smoothValue, i === l - 1 ? tailRatio : 1);
            if (i === l - 1 && tailRatio >= 0 && tailRatio < 1) {
                ctx.bezierCurveTo(ctrlPoints[0], ctrlPoints[1], ctrlPoints[2], ctrlPoints[3], ctrlPoints[4], ctrlPoints[5]);
                points.splice(l - 1, count - (l - 1) - 1);
                const lastPoint = new Point(ctrlPoints[4], ctrlPoints[5]);
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                lastPoint.prevCtrlPoint = new Point(ctrlPoints[2], ctrlPoints[3]);
                points.push(lastPoint);
                count = points.length;
            } else {
                ctx.bezierCurveTo(ctrlPoints[0], ctrlPoints[1], ctrlPoints[2], ctrlPoints[3], x2, y2);
            }
            points[i].nextCtrlPoint = ctrlPoints.slice(0, 2);
            points[i].prevCtrlPoint = preCtrlPoints ? preCtrlPoints.slice(2) : null;
            preCtrlPoints = ctrlPoints;
        }
        if (!close && points[1].prevCtrlPoint) {
            points[0].nextCtrlPoint = points[1].prevCtrlPoint;
            delete points[0].prevCtrlPoint;
        }
        if (!points[count - 1].prevCtrlPoint) {
            points[count - 1].prevCtrlPoint = points[count - 2].nextCtrlPoint;
        }
        Canvas._stroke(ctx, lineOpacity);
    },
    paintSmoothLine(ctx: CanvasRenderingContext2D, points: Array<Point>, lineOpacity: number, smoothValue: boolean, close: boolean, tailIdx?: number, tailRatio?: number) {
        if (!points) {
            return;
        }
        if (points.length <= 2 || !smoothValue) {
            Canvas.path(ctx, points, lineOpacity);
            return;
        }
        let count = points.length;
        let l = close ? count : count - 1;

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        if (tailRatio !== undefined) l -= Math.max(l - tailIdx - 1, 0);
        let preX: number, preY: number;
        for (let i = 0; i < l; i++) {
            const x1 = points[i].x, y1 = points[i].y;

            let x0, y0, x2, y2, x3, y3;
            if (i - 1 < 0) {
                if (!close) {
                    x0 = points[i + 1].x;
                    y0 = points[i + 1].y;
                } else {
                    x0 = points[l - 1].x;
                    y0 = points[l - 1].y;
                }
            } else {
                x0 = points[i - 1].x;
                y0 = points[i - 1].y;
            }
            if (i + 1 < count) {
                x2 = points[i + 1].x;
                y2 = points[i + 1].y;
            } else {
                x2 = points[i + 1 - count].x;
                y2 = points[i + 1 - count].y;
            }
            if (i + 2 < count) {
                x3 = points[i + 2].x;
                y3 = points[i + 2].y;
            } else if (!close) {
                x3 = points[i].x;
                y3 = points[i].y;
            } else {
                x3 = points[i + 2 - count].x;
                y3 = points[i + 2 - count].y;
            }

            const point = points[i];
            const ctrlPoints = getCubicControlPoints(x0, y0, x1, y1, x2, y2, x3, y3, smoothValue, i === l - 1 ? tailRatio : 1);
            if (i === l - 1 && tailRatio >= 0 && tailRatio < 1) {
                ctx.bezierCurveTo(ctrlPoints[0], ctrlPoints[1], ctrlPoints[2], ctrlPoints[3], ctrlPoints[4], ctrlPoints[5]);
                points.splice(l - 1, count - (l - 1) - 1);
                const lastPoint = new Point(ctrlPoints[4], ctrlPoints[5]);
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                // lastPoint.prevCtrlPoint = new Point(ctrlPoints[2], ctrlPoints[3]);
                points.push(lastPoint);
                count = points.length;
            } else {
                ctx.bezierCurveTo(ctrlPoints[0], ctrlPoints[1], ctrlPoints[2], ctrlPoints[3], x2, y2);
            }
            if (i === 0) {
                //第一个点添加一个Point作为箭头方向使用
                // p0--arrowNextPoint------------p1;
                point.arrowNextPoint = point.arrowNextPoint || new Point(0, 0);
                preX = ctrlPoints[2];
                preY = ctrlPoints[3];
                point.arrowNextPoint.x = preX;
                point.arrowNextPoint.y = preY;
            } else {
                //其他的点，添加一个前置节点作为箭头方向使用
                // p0--------arrowPrePoint--p1;
                point.arrowPrePoint = point.arrowPrePoint || new Point(0, 0);
                point.arrowPrePoint.x = preX;
                point.arrowPrePoint.y = preY;
                preX = ctrlPoints[2];
                preY = ctrlPoints[3];
                if (i === l - 1 && points[i + 1]) {
                    //最后一个节点添加一个前置节点作为箭头方向使用
                    points[i + 1].arrowPrePoint = points[i + 1].arrowPrePoint || new Point(0, 0);
                    points[i + 1].arrowPrePoint.x = ctrlPoints[0];
                    points[i + 1].arrowPrePoint.y = ctrlPoints[1];
                }
            }
        }
        Canvas._stroke(ctx, lineOpacity);
    },

    /**
     * draw an arc from p1 to p2 with degree of (p1, center) and (p2, center)
     * @param  {Context} ctx    canvas context
     * @param  {Point} p1      point 1
     * @param  {Point} p2      point 2
     * @param  {Number} degree arc degree between p1 and p2
     */
    //@internal
    _arcBetween(ctx: CanvasRenderingContext2D, p1: Point, p2: Point, degree: number) {
        //degree可能是负角度
        const a = Math.abs(degree),
            dist = p1.distanceTo(p2),
            //radius of circle
            r = Math.abs(dist / 2 / Math.sin(a / 2));
        //angle between p1 and p2
        let p1p2 = Math.asin((p2.y - p1.y) / dist);
        if (p1.x > p2.x) {
            p1p2 = Math.PI - p1p2;
        }
        //angle between circle center and p2
        const cp2 = 90 * RADIAN - a / 2,
            da = p1p2 - cp2;

        const dx = Math.cos(da) * r,
            dy = Math.sin(da) * r;
        let cx = p1.x + dx,
            cy = p1.y + dy;

        let startAngle = Math.asin((p2.y - cy) / r);
        if (cx > p2.x) {
            startAngle = Math.PI - startAngle;
        }
        let endAngle = startAngle + a;
        //负角度
        if (degree < 0) {
            //旋转整个弧线PI
            startAngle += Math.PI;
            endAngle += Math.PI;
            //translate center 平移中线点,以p1,p2的中心点向相反方向取新的中心点
            const middleX = (p1.x + p2.x) / 2, middleY = (p1.y + p2.y) / 2;
            const dx = cx - middleX, dy = cy - middleY;
            cx = middleX - dx;
            cy = middleY - dy;
        }

        ctx.beginPath();
        ctx.arc(cx, cy, r, startAngle, endAngle);
        //cal arrow achor
        //不在使用控制点,使用箭头专用ArrowPoint,在开始角度和结束角度附件取个点
        const aAngle = (endAngle - startAngle) / 100;
        const x1 = Math.cos(startAngle + aAngle) * r + cx;
        const y1 = Math.sin(startAngle + aAngle) * r + cy;
        const x2 = Math.cos(endAngle - aAngle) * r + cx;
        const y2 = Math.sin(endAngle - aAngle) * r + cy;
        /**
         *
         * P1-arrowNextPoint------------------arrowNextPoint-P2
         *
         */
        p1.arrowNextPoint = p1.arrowNextPoint || new Point(0, 0);
        p2.arrowPrePoint = p2.arrowPrePoint || new Point(0, 0);
        if (degree < 0) {
            p1.arrowNextPoint.x = x1;
            p1.arrowNextPoint.y = y1;
            p2.arrowPrePoint.x = x2;
            p2.arrowPrePoint.y = y2;
        } else {
            p1.arrowNextPoint.x = x2;
            p1.arrowNextPoint.y = y2;
            p2.arrowPrePoint.x = x1;
            p2.arrowPrePoint.y = y1;
        }
        return [cx, cy];
    },

    //@internal
    _lineTo(ctx: CanvasRenderingContext2D, p) {
        ctx.lineTo(p.x, p.y);
    },

    bezierCurveAndFill(ctx: CanvasRenderingContext2D, points, lineOpacity, fillOpacity) {
        ctx.beginPath();
        const start = points[0];
        ctx.moveTo(start.x, start.y);
        const args = [ctx];
        // eslint-disable-next-line prefer-spread
        args.push.apply(args, points.splice(1));
        // eslint-disable-next-line prefer-spread
        Canvas._bezierCurveTo.apply(Canvas, args);
        Canvas.fillCanvas(ctx, fillOpacity);
        Canvas._stroke(ctx, lineOpacity);
    },

    //@internal
    _bezierCurveTo(ctx: CanvasRenderingContext2D, p1, p2, p3) {
        ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    },


    //各种图形的绘制方法
    ellipse(ctx: CanvasRenderingContext2D, pt, width, heightTop, heightBottom, lineOpacity, fillOpacity) {
        function bezierEllipse(x, y, a, b, b1) {
            const k = 0.5522848,
                ox = a * k,
                oy = b * k,
                oy1 = b1 * k;
            ctx.moveTo(x - a, y);
            ctx.bezierCurveTo(x - a, y - oy, x - ox, y - b, x, y - b);
            ctx.bezierCurveTo(x + ox, y - b, x + a, y - oy, x + a, y);
            ctx.bezierCurveTo(x + a, y + oy1, x + ox, y + b1, x, y + b1);
            ctx.bezierCurveTo(x - ox, y + b1, x - a, y + oy1, x - a, y);
            ctx.closePath();
        }
        ctx.beginPath();
        if (width === heightTop && width === heightBottom) {
            ctx.arc(pt.x, pt.y, width, 0, 2 * Math.PI);
        } else if (ctx.ellipse) {
            if (heightTop !== heightBottom) {
                // the order is clockwise
                ctx.ellipse(pt.x, pt.y, width, heightTop, 0, RADIAN * 180, RADIAN * 360, false);
                ctx.ellipse(pt.x, pt.y, width, heightBottom, 0, 0, RADIAN * 180, false);
            } else {
                ctx.ellipse(pt.x, pt.y, width, heightTop, 0, 0, RADIAN * 360, false);
            }
        } else {
            // IE
            bezierEllipse(pt.x, pt.y, width, heightTop, heightBottom);
        }
        Canvas.fillCanvas(ctx, fillOpacity, pt.x - width, pt.y - heightTop);
        Canvas._stroke(ctx, lineOpacity, pt.x - width, pt.y - heightTop);
    },

    rectangle(ctx: CanvasRenderingContext2D, pt, size, lineOpacity, fillOpacity) {
        // pt = pt._round();
        const { x, y } = pt;
        ctx.beginPath();
        ctx.rect(x, y, size['width'], size['height']);
        Canvas.fillCanvas(ctx, fillOpacity, x, y);
        Canvas._stroke(ctx, lineOpacity, x, y);
    },

    sector(ctx: CanvasRenderingContext2D, pt, size, angles, lineOpacity, fillOpacity) {
        const rad = RADIAN;
        const startAngle = angles[0],
            endAngle = angles[1];

        function sector(ctx: CanvasRenderingContext2D, x, y, radius, startAngle, endAngle) {
            const sDeg = rad * -endAngle;
            const eDeg = rad * -startAngle;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.arc(x, y, radius, sDeg, eDeg);
            ctx.lineTo(x, y);
            Canvas.fillCanvas(ctx, fillOpacity, x - radius, y - radius);
            Canvas._stroke(ctx, lineOpacity, x - radius, y - radius);
        }
        sector(ctx, pt.x, pt.y, size, startAngle, endAngle);
    },

    //@internal
    _isPattern(style: any) {
        return !isString(style) && !('addColorStop' in style);
    },

    drawCross(ctx: CanvasRenderingContext2D, x: number, y: number, lineWidth: number, color: string | CanvasGradient | CanvasPattern) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ctx.canvas._drawn = true;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(x - 5, y);
        ctx.lineTo(x + 5, y);
        ctx.moveTo(x, y - 5);
        ctx.lineTo(x, y + 5);
        ctx.stroke();
    },

    copy(canvas: HTMLCanvasElement, c?: HTMLCanvasElement): HTMLCanvasElement {
        const target: any = c || createEl('canvas');
        target.width = canvas.width;
        target.height = canvas.height;
        target.getContext('2d').drawImage(canvas, 0, 0);
        return target;
    },

    // pixel render
    pixelRect(ctx: CanvasRenderingContext2D, point: number[], lineOpacity: number, fillOpacity: number) {
        const lineWidth = ctx.lineWidth;
        const alpha = ctx.globalAlpha;
        let isStroke = false;
        if (lineWidth > 0 && lineOpacity > 0) {
            isStroke = true;
            if (lineOpacity < 1) {
                ctx.globalAlpha *= lineOpacity;
            }
        } else if (fillOpacity > 0) {
            if (fillOpacity < 1) {
                ctx.globalAlpha *= fillOpacity;
            }
        } else {
            return;
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ctx.canvas._drawn = true;
        if (isStroke) {
            ctx.strokeRect(point[0], point[1], 1, 1);
        } else {
            ctx.fillRect(point[0], point[1], 1, 1);
        }
        if (ctx.globalAlpha !== alpha) {
            ctx.globalAlpha = alpha;
        }
    }
};

export default Canvas;


/* istanbul ignore next */
function drawDashLine(ctx: CanvasRenderingContext2D, startPoint: any, endPoint: any, dashArray: any[]) {
    //https://davidowens.wordpress.com/2010/09/07/html-5-canvas-and-dashed-lines/
    //
    // Our growth rate for our line can be one of the following:
    //   (+,+), (+,-), (-,+), (-,-)
    // Because of this, our algorithm needs to understand if the x-coord and
    // y-coord should be getting smaller or larger and properly cap the values
    // based on (x,y).
    const fromX = startPoint.x,
        fromY = startPoint.y,
        toX = endPoint.x,
        toY = endPoint.y;
    const pattern = dashArray;
    const lt = function (a: number, b: number) {
        return a <= b;
    };
    const gt = function (a: number, b: number) {
        return a >= b;
    };
    const capmin = function (a: number, b: number) {
        return Math.min(a, b);
    };
    const capmax = function (a: number, b: number) {
        return Math.max(a, b);
    };

    const checkX = {
        thereYet: gt,
        cap: capmin
    };
    const checkY = {
        thereYet: gt,
        cap: capmin
    };

    if (fromY - toY > 0) {
        checkY.thereYet = lt;
        checkY.cap = capmax;
    }
    if (fromX - toX > 0) {
        checkX.thereYet = lt;
        checkX.cap = capmax;
    }

    ctx.moveTo(fromX, fromY);
    let offsetX = fromX;
    let offsetY = fromY;
    let idx = 0,
        dash = true;
    let ang, len;
    while (!(checkX.thereYet(offsetX, toX) && checkY.thereYet(offsetY, toY))) {
        ang = Math.atan2(toY - fromY, toX - fromX);
        len = pattern[idx];

        offsetX = checkX.cap(toX, offsetX + (Math.cos(ang) * len));
        offsetY = checkY.cap(toY, offsetY + (Math.sin(ang) * len));

        if (dash) {
            ctx.lineTo(offsetX, offsetY);
        } else {
            ctx.moveTo(offsetX, offsetY);
        }

        idx = (idx + 1) % pattern.length;
        dash = !dash;
    }
}

const prefix = 'data:image/';

function extractImageUrl(url: string) {
    if (url.substring(0, prefix.length) === prefix) {
        return url;
    }
    return extractCssUrl(url);
}

function copyProperties(ctx: CanvasRenderingContext2D, savedCtx) {
    ctx.filter = savedCtx.filter;
    ctx.fillStyle = savedCtx.fillStyle;
    ctx.globalAlpha = savedCtx.globalAlpha;
    ctx.lineCap = savedCtx.lineCap;
    ctx.lineDashOffset = savedCtx.lineDashOffset;
    ctx.lineJoin = savedCtx.lineJoin;
    ctx.lineWidth = savedCtx.lineWidth;
    ctx.shadowBlur = savedCtx.shadowBlur;
    ctx.shadowColor = savedCtx.shadowColor;
    ctx.shadowOffsetX = savedCtx.shadowOffsetX;
    ctx.shadowOffsetY = savedCtx.shadowOffsetY;
    ctx.strokeStyle = savedCtx.strokeStyle;
    ctx.lineColorIn = savedCtx.lineColorIn;
}

function setLineDash(ctx: CanvasRenderingContext2D, lineDashArray: number[]) {
    if (!lineDashArray || !ctx.setLineDash || !Array.isArray(lineDashArray)) {
        return;
    }
    ctx.setLineDash(lineDashArray);

}
