import {
    IS_NODE,
    isNil,
    isNumber,
    isString,
    isArrayHasData,
    isSVG,
    isCssUrl,
    extractCssUrl,
    computeDegree
} from './util';
import { isGradient } from './util/style';
import { createEl } from './util/dom';
import Browser from './Browser';
import Point from '../geo/Point';
import { getFont, getAlignPoint } from './util/strings';

const DEFAULT_STROKE_COLOR = '#000';
const DEFAULT_FILL_COLOR = 'rgba(255,255,255,0)';
const DEFAULT_TEXT_COLOR = '#000';

let hitTesting = false;

let TEMP_CANVAS = null;

const Canvas = {
    setHitTesting(testing) {
        hitTesting = testing;
    },

    createCanvas(width, height, canvasClass) {
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

    prepareCanvasFont(ctx, style) {
        ctx.textBaseline = 'top';
        ctx.font = getFont(style);
        let fill = style['textFill'];
        if (!fill) {
            fill = DEFAULT_TEXT_COLOR;
        }
        ctx.fillStyle = Canvas.getRgba(fill, style['textOpacity']);
    },

    /**
     * Set canvas's fill and stroke style
     * @param {CanvasRenderingContext2D} ctx
     * @param {Object} style
     * @param {Object} resources
     * @param {Boolean} testing  - paint for testing, ignore stroke and fill patterns
     */
    prepareCanvas(ctx, style, resources, testing) {
        if (!style) {
            return;
        }
        const strokeWidth = style['lineWidth'];
        if (!isNil(strokeWidth) && ctx.lineWidth !== strokeWidth) {
            ctx.lineWidth = strokeWidth;
        }
        const strokeColor = style['linePatternFile'] || style['lineColor'] || DEFAULT_STROKE_COLOR;
        if (testing) {
            ctx.strokeStyle = '#000';
        } else if (isImageUrl(strokeColor) && resources) {
            let patternOffset;
            if (style['linePatternDx'] || style['linePatternDy']) {
                patternOffset = [style['linePatternDx'], style['linePatternDy']];
            }
            Canvas._setStrokePattern(ctx, strokeColor, strokeWidth, patternOffset, resources);
            //line pattern will override stroke-dasharray
            style['lineDasharray'] = [];
        } else if (isGradient(strokeColor)) {
            if (style['lineGradientExtent']) {
                ctx.strokeStyle = Canvas._createGradient(ctx, strokeColor, style['lineGradientExtent']);
            } else {
                ctx.strokeStyle = DEFAULT_STROKE_COLOR;
            }
        } else /*if (ctx.strokeStyle !== strokeColor)*/ {
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
        const fill = style['polygonPatternFile'] || style['polygonFill'] || DEFAULT_FILL_COLOR;
        if (testing) {
            ctx.fillStyle = '#000';
        } else if (isImageUrl(fill) && resources) {
            const fillImgUrl = extractImageUrl(fill);
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
            ctx.fillStyle = fill;
        }
    },

    _createGradient(ctx, g, extent) {
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
            gradient = ctx.createRadialGradient.apply(ctx, places);
        }
        g['colorStops'].forEach(stop => {
            gradient.addColorStop.apply(gradient, stop);
        });
        return gradient;
    },

    _setStrokePattern(ctx, strokePattern, strokeWidth, linePatternOffset, resources) {
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

    clearRect(ctx, x1, y1, x2, y2) {
        ctx.canvas._drawn = false;
        ctx.clearRect(x1, y1, x2, y2);
    },

    fillCanvas(ctx, fillOpacity, x, y) {
        if (hitTesting) {
            fillOpacity = 1;
        }
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
    getRgba(color, op) {
        if (isNil(op)) {
            op = 1;
        }
        if (color[0] !== '#') {
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

    image(ctx, img, x, y, width, height) {
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

    text(ctx, text, pt, style, textDesc) {
        Canvas._textOnMultiRow(ctx, textDesc['rows'], style, pt, textDesc['size'], textDesc['rawSize']);
    },

    _textOnMultiRow(ctx, texts, style, point, splitTextSize, textSize) {
        const ptAlign = getAlignPoint(splitTextSize, style['textHorizontalAlignment'], style['textVerticalAlignment']),
            lineHeight = textSize['height'] + style['textLineSpacing'],
            basePoint = point.add(0, ptAlign.y),
            maxHeight = style['textMaxHeight'];
        let text, rowAlign, height = 0;
        for (let i = 0, len = texts.length; i < len; i++) {
            text = texts[i]['text'];
            rowAlign = getAlignPoint(texts[i]['size'], style['textHorizontalAlignment'], style['textVerticalAlignment']);
            Canvas._textOnLine(ctx, text, basePoint.add(rowAlign.x, i * lineHeight), style['textHaloRadius'], style['textHaloFill'], style['textHaloOpacity']);
            if (maxHeight > 0) {
                height += lineHeight;
                if (height + textSize['height'] >= maxHeight) {
                    break;
                }
            }
        }
    },

    _textOnLine(ctx, text, pt, textHaloRadius, textHaloFill, textHaloAlpha) {
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
            ctx.strokeStyle = textHaloFill;
            ctx.strokeText(text, Math.round(pt.x), Math.round(pt.y));
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

    fillText(ctx, text, point, rgba) {
        ctx.canvas._drawn = true;
        if (rgba) {
            ctx.fillStyle = rgba;
        }
        ctx.fillText(text, Math.round(point.x), Math.round(point.y));
    },

    _stroke(ctx, strokeOpacity, x, y) {
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

    _path(ctx, points, lineDashArray, lineOpacity, ignoreStrokePattern) {
        if (!isArrayHasData(points)) {
            return;
        }

        function fillWithPattern(p1, p2) {
            const degree = computeDegree(p1.x, p1.y, p2.x, p2.y);
            ctx.save();
            ctx.translate(p1.x, p1.y - ctx.lineWidth / 2 / Math.cos(degree));
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
                drawDashLine(ctx, point, nextPoint, lineDashArray, isPatternLine);
            }
        }
    },

    path(ctx, points, lineOpacity, fillOpacity, lineDashArray) {
        if (!isArrayHasData(points)) {
            return;
        }
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        Canvas._path(ctx, points, lineDashArray, lineOpacity);
        Canvas._stroke(ctx, lineOpacity);
    },

    _multiClip(ctx, points) {
        if (!points || points.length === 0) return;
        //not Handle holes
        points = points[0];
        for (let i = 0, len = points.length; i < len; i++) {
            const point = points[i];
            let x = point.x, y = point.y;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            if (i === len - 1) {
                x = points[0].x;
                y = points[0].y;
                ctx.lineTo(x, y);
            }
        }
    },

    polygon(ctx, points, lineOpacity, fillOpacity, lineDashArray, smoothness) {
        // if MultiClip
        if (ctx.isMultiClip) {
            Canvas._multiClip(ctx, points);
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
        if (points.length > 1 && !IS_NODE) {
            if (!TEMP_CANVAS) {
                TEMP_CANVAS = Canvas.createCanvas(1, 1);
            }
            ctx.canvas._drawn = false;
            TEMP_CANVAS.width = ctx.canvas.width;
            TEMP_CANVAS.height = ctx.canvas.height;
            ctx = TEMP_CANVAS.getContext('2d');
            copyProperties(ctx, savedCtx);
        }
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
            }
            ctx.restore();
        }
        for (i = 0, len = points.length; i < len; i++) {
            if (!isArrayHasData(points[i])) {
                continue;
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
        }
        if (points.length > 1 && !IS_NODE) {
            savedCtx.drawImage(TEMP_CANVAS, 0, 0);
            savedCtx.canvas._drawn = ctx.canvas._drawn;
            copyProperties(savedCtx, ctx);
        }
    },

    _ring(ctx, ring, lineDashArray, lineOpacity, ignorePattern) {
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

    paintSmoothLine(ctx, points, lineOpacity, smoothValue, close, tailIdx, tailRatio) {
        if (!points) {
            return;
        }
        if (points.length <= 2 || !smoothValue) {
            Canvas.path(ctx, points, lineOpacity);
            return;
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

            const qxa =  x1 * u0 * u0 + bx1 * 2 * t0 * u0 + bx2 * t0 * t0;
            const qxb =  x1 * u1 * u1 + bx1 * 2 * t1 * u1 + bx2 * t1 * t1;
            const qxc = bx1 * u0 * u0 + bx2 * 2 * t0 * u0 +  x2 * t0 * t0;
            const qxd = bx1 * u1 * u1 + bx2 * 2 * t1 * u1 +  x2 * t1 * t1;

            const qya =  y1 * u0 * u0 + by1 * 2 * t0 * u0 + by2 * t0 * t0;
            const qyb =  y1 * u1 * u1 + by1 * 2 * t1 * u1 + by2 * t1 * t1;
            const qyc = by1 * u0 * u0 + by2 * 2 * t0 * u0 +  y2 * t0 * t0;
            const qyd = by1 * u1 * u1 + by2 * 2 * t1 * u1 +  y2 * t1 * t1;

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

    /**
     * draw an arc from p1 to p2 with degree of (p1, center) and (p2, center)
     * @param  {Context} ctx    canvas context
     * @param  {Point} p1      point 1
     * @param  {Point} p2      point 2
     * @param  {Number} degree arc degree between p1 and p2
     */
    _arcBetween(ctx, p1, p2, degree) {
        const a = degree,
            dist = p1.distanceTo(p2),
            //radius of circle
            r = dist / 2 / Math.sin(a / 2);
        //angle between p1 and p2
        let p1p2 = Math.asin((p2.y - p1.y) / dist);
        if (p1.x > p2.x) {
            p1p2 = Math.PI - p1p2;
        }
        //angle between circle center and p2
        const cp2 = 90 * Math.PI / 180 - a / 2,
            da = p1p2 - cp2;

        const dx = Math.cos(da) * r,
            dy = Math.sin(da) * r,
            cx = p1.x + dx,
            cy = p1.y + dy;

        let startAngle = Math.asin((p2.y - cy) / r);
        if (cx > p2.x) {
            startAngle = Math.PI - startAngle;
        }
        const endAngle = startAngle + a;

        ctx.beginPath();
        ctx.arc(cx, cy, r, startAngle, endAngle);
        return [cx, cy];
    },

    _lineTo(ctx, p) {
        ctx.lineTo(p.x, p.y);
    },

    bezierCurveAndFill(ctx, points, lineOpacity, fillOpacity) {
        ctx.beginPath();
        const start = points[0];
        ctx.moveTo(start.x, start.y);
        const args = [ctx];
        args.push.apply(args, points.splice(1));
        Canvas._bezierCurveTo.apply(Canvas, args);
        Canvas.fillCanvas(ctx, fillOpacity);
        Canvas._stroke(ctx, lineOpacity);
    },

    _bezierCurveTo(ctx, p1, p2, p3) {
        ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    },


    //各种图形的绘制方法
    ellipse(ctx, pt, width, height, lineOpacity, fillOpacity) {
        function bezierEllipse(x, y, a, b) {
            const k = 0.5522848,
                ox = a * k,
                oy = b * k;
            ctx.moveTo(x - a, y);
            ctx.bezierCurveTo(x - a, y - oy, x - ox, y - b, x, y - b);
            ctx.bezierCurveTo(x + ox, y - b, x + a, y - oy, x + a, y);
            ctx.bezierCurveTo(x + a, y + oy, x + ox, y + b, x, y + b);
            ctx.bezierCurveTo(x - ox, y + b, x - a, y + oy, x - a, y);
            ctx.closePath();
        }
        ctx.beginPath();
        if (width === height) {
            ctx.arc(pt.x, pt.y, width, 0, 2 * Math.PI);
        } else if (ctx.ellipse) {
            ctx.ellipse(pt.x, pt.y, width, height, 0, 0, Math.PI / 180 * 360);
        } else {
            // IE
            bezierEllipse(pt.x, pt.y, width, height);
        }
        Canvas.fillCanvas(ctx, fillOpacity, pt.x - width, pt.y - height);
        Canvas._stroke(ctx, lineOpacity, pt.x - width, pt.y - height);
    },

    rectangle(ctx, pt, size, lineOpacity, fillOpacity) {
        // pt = pt._round();
        ctx.beginPath();
        ctx.rect(pt.x, pt.y, size['width'], size['height']);
        Canvas.fillCanvas(ctx, fillOpacity, pt.x, pt.y);
        Canvas._stroke(ctx, lineOpacity, pt.x, pt.y);
    },

    sector(ctx, pt, size, angles, lineOpacity, fillOpacity) {
        const rad = Math.PI / 180;
        const startAngle = angles[0],
            endAngle = angles[1];

        function sector(ctx, x, y, radius, startAngle, endAngle) {
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

    _isPattern(style) {
        return !isString(style) && !('addColorStop' in style);
    },

    drawCross(ctx, p, lineWidth, color) {
        ctx.canvas._drawn = true;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(p.x - 5, p.y);
        ctx.lineTo(p.x + 5, p.y);
        ctx.moveTo(p.x, p.y - 5);
        ctx.lineTo(p.x, p.y + 5);
        ctx.stroke();
    },

    copy(canvas, c) {
        const target = c || createEl('canvas');
        target.width = canvas.width;
        target.height = canvas.height;
        target.getContext('2d').drawImage(canvas, 0, 0);
        return target;
    }
};

export default Canvas;


/* istanbul ignore next */
function drawDashLine(ctx, startPoint, endPoint, dashArray) {
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
    const lt = function (a, b) {
        return a <= b;
    };
    const gt = function (a, b) {
        return a >= b;
    };
    const capmin = function (a, b) {
        return Math.min(a, b);
    };
    const capmax = function (a, b) {
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
function isImageUrl(url) {
    return url.length > prefix.length && url.substring(0, prefix.length) === prefix || isCssUrl(url);
}

function extractImageUrl(url) {
    if (url.substring(0, prefix.length) === prefix) {
        return url;
    }
    return extractCssUrl(url);
}

function copyProperties(ctx, savedCtx) {
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
}
