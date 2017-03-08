import {
    isNode,
    isNil,
    isNumber,
    isString,
    isArrayHasData,
    isSVG,
    isCssUrl,
    extractCssUrl,
    round,
    computeDegree
} from 'core/util';
import { isGradient } from 'core/util/style';
import { createEl } from 'core/util/dom';
import Browser from 'core/Browser';
import { getFont, getAlignPoint } from 'core/util/strings';

const DEFAULT_STROKE_COLOR = '#000';
const DEFAULT_FILL_COLOR = 'rgba(255,255,255,0)';
const DEFAULT_TEXT_COLOR = '#000';

const Canvas = {
    createCanvas(width, height, canvasClass) {
        var canvas;
        if (!isNode) {
            canvas = createEl('canvas');
            canvas.width = width;
            canvas.height = height;
        } else {
            //can be node-canvas or any other canvas mock
            canvas = new canvasClass(width, height);
        }
        return canvas;
    },

    setDefaultCanvasSetting(ctx) {
        ctx.lineWidth = 1;
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.fillStyle = 'rgba(255,255,255,0)';
        ctx.textAlign = 'start';
        ctx.textBaseline = 'top';
        var fontSize = 11;
        ctx.font = fontSize + 'px monospace';
        ctx.shadowBlur = null;
        ctx.shadowColor = null;
        if (ctx.setLineDash) {
            ctx.setLineDash([]);
        }
        ctx.globalAlpha = 1;
    },

    prepareCanvasFont(ctx, style) {
        ctx.textBaseline = 'top';
        ctx.font = getFont(style);
        var fill = style['textFill'];
        if (!fill) {
            fill = DEFAULT_TEXT_COLOR;
        }
        ctx.fillStyle = Canvas.getRgba(fill, style['textOpacity']);
    },

    prepareCanvas(ctx, style, resources) {
        if (!style) {
            return;
        }
        var strokeWidth = style['lineWidth'];
        if (!isNil(strokeWidth) && ctx.lineWidth !== strokeWidth) {
            ctx.lineWidth = strokeWidth;
        }
        var strokeColor = style['linePatternFile'] || style['lineColor'] || DEFAULT_STROKE_COLOR;
        if (isCssUrl(strokeColor) && resources) {
            Canvas._setStrokePattern(ctx, strokeColor, strokeWidth, resources);
            //line pattern will override stroke-dasharray
            style['lineDasharray'] = [];
        } else if (isGradient(strokeColor)) {
            if (style['lineGradientExtent']) {
                ctx.strokeStyle = Canvas._createGradient(ctx, strokeColor, style['lineGradientExtent']);
            } else {
                ctx.strokeStyle = 'rgba(0,0,0,1)';
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
        var fill = style['polygonPatternFile'] || style['polygonFill'] || DEFAULT_FILL_COLOR;
        if (isCssUrl(fill)) {
            var fillImgUrl = extractCssUrl(fill);
            var fillTexture = resources.getImage([fillImgUrl, null, null]);
            if (!fillTexture) {
                //if the linestring has a arrow and a linePatternFile, polygonPatternFile will be set with the linePatternFile.
                fillTexture = resources.getImage([fillImgUrl + '-texture', null, strokeWidth]);
            }
            if (isSVG(fillImgUrl) && (fillTexture instanceof Image) && (Browser.edge || Browser.ie)) {
                //opacity of svg img painted on canvas is always 1, so we paint svg on a canvas at first.
                var w = fillTexture.width || 20,
                    h = fillTexture.height || 20;
                var canvas = Canvas.createCanvas(w, h);
                Canvas.image(canvas.getContext('2d'), fillTexture, 0, 0, w, h);
                fillTexture = canvas;
            }
            if (!fillTexture) {
                if (!Browser.phantomjs && console) {
                    console.warn('img not found for', fillImgUrl);
                }
            } else {
                ctx.fillStyle = ctx.createPattern(fillTexture, 'repeat');
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
        var gradient = null,
            places = g['places'],
            min = extent.getMin(),
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
                var c = extent.getCenter()._round();
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

    _setStrokePattern(ctx, strokePattern, strokeWidth, resources) {
        var imgUrl = extractCssUrl(strokePattern);
        var imageTexture;
        if (isNode) {
            imageTexture = resources.getImage([imgUrl, null, strokeWidth]);
        } else {
            var key = imgUrl + '-texture-' + strokeWidth;
            imageTexture = resources.getImage(key);
            if (!imageTexture) {
                var imageRes = resources.getImage([imgUrl, null, null]);
                if (imageRes) {
                    var w;
                    if (!imageRes.width || !imageRes.height) {
                        w = strokeWidth;
                    } else {
                        w = round(imageRes.width * strokeWidth / imageRes.height);
                    }
                    var patternCanvas = Canvas.createCanvas(w, strokeWidth, ctx.canvas.constructor);
                    Canvas.image(patternCanvas.getContext('2d'), imageRes, 0, 0, w, strokeWidth);
                    resources.addResource([key, null, strokeWidth], patternCanvas);
                    imageTexture = patternCanvas;
                }
            }
        }
        if (imageTexture) {
            ctx.strokeStyle = ctx.createPattern(imageTexture, 'repeat');
        } else if (!Browser.phantomjs && console) {
            console.warn('img not found for', imgUrl);
        }
    },

    clearRect(ctx, x1, y1, x2, y2) {
        ctx.clearRect(x1, y1, x2, y2);
    },

    fillCanvas(ctx, fillOpacity, x, y) {
        if (fillOpacity === 0) {
            return;
        }
        var isPattern = Canvas._isPattern(ctx.fillStyle);
        if (isNil(fillOpacity)) {
            fillOpacity = 1;
        }
        var alpha;
        if (fillOpacity < 1) {
            alpha = ctx.globalAlpha;
            ctx.globalAlpha *= fillOpacity;
        }
        if (isPattern) {
            // x = round(x);
            // y = round(y);
            ctx.translate(x, y);
        }
        ctx.fill();
        if (isPattern) {
            ctx.translate(-x, -y);
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
        var r, g, b;
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
        // x = round(x);
        // y = round(y);
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
        // pt = pt.add(new Point(style['textDx'], style['textDy']));
        Canvas._textOnMultiRow(ctx, textDesc['rows'], style, pt, textDesc['size'], textDesc['rawSize']);
    },

    _textOnMultiRow(ctx, texts, style, point, splitTextSize, textSize) {
        var ptAlign = getAlignPoint(splitTextSize, style['textHorizontalAlignment'], style['textVerticalAlignment']);
        var lineHeight = textSize['height'] + style['textLineSpacing'];
        var basePoint = point.add(0, ptAlign.y);
        var text, rowAlign;
        for (var i = 0, len = texts.length; i < len; i++) {
            text = texts[i]['text'];
            rowAlign = getAlignPoint(texts[i]['size'], style['textHorizontalAlignment'], style['textVerticalAlignment']);
            Canvas._textOnLine(ctx, text, basePoint.add(rowAlign.x, i * lineHeight), style['textHaloRadius'], style['textHaloFill'], style['textHaloOpacity']);
        }
    },

    _textOnLine(ctx, text, pt, textHaloRadius, textHaloFill, textHaloOp) {
        // pt = pt._round();
        ctx.textBaseline = 'top';
        if (textHaloOp !== 0 && textHaloRadius !== 0) {
            //http://stackoverflow.com/questions/14126298/create-text-outline-on-canvas-in-javascript
            //根据text-horizontal-alignment和text-vertical-alignment计算绘制起始点偏移量
            if (textHaloOp) {
                var alpha = ctx.globalAlpha;
                ctx.globalAlpha *= textHaloOp;
            }

            if (textHaloRadius) {
                ctx.miterLimit = 2;
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                ctx.lineWidth = (textHaloRadius * 2 - 1);
                ctx.strokeStyle = textHaloFill;
                ctx.strokeText(text, pt.x, pt.y);
                ctx.lineWidth = 1;
                ctx.miterLimit = 10; //default
            }

            if (textHaloOp) {
                ctx.globalAlpha = alpha;
            }
        }
        ctx.fillText(text, pt.x, pt.y);
    },

    fillText(ctx, text, point, rgba) {
        if (rgba) {
            ctx.fillStyle = rgba;
        }
        ctx.fillText(text, point.x, point.y);
    },

    _stroke(ctx, strokeOpacity, x, y) {
        var isPattern = Canvas._isPattern(ctx.strokeStyle) && !isNil(x) && !isNil(y);
        if (isNil(strokeOpacity)) {
            strokeOpacity = 1;
        }
        var alpha;
        if (strokeOpacity < 1) {
            alpha = ctx.globalAlpha;
            ctx.globalAlpha *= strokeOpacity;
        }
        if (isPattern) {
            // x = round(x);
            // y = round(y);
            ctx.translate(x, y);
        }
        ctx.stroke();
        if (isPattern) {
            ctx.translate(-x, -y);
        }
        if (strokeOpacity < 1) {
            ctx.globalAlpha = alpha;
        }
    },

    _path(ctx, points, lineDashArray, lineOpacity, ignoreStrokePattern) {
        function fillWithPattern(p1, p2) {
            var degree = computeDegree(p1, p2);
            ctx.save();
            ctx.translate(p1.x, p1.y - ctx.lineWidth / 2 / Math.cos(degree));
            ctx.rotate(degree);
            Canvas._stroke(ctx, lineOpacity);
            ctx.restore();
        }

        function drawDashLine(startPoint, endPoint, dashArray) {
            //https://davidowens.wordpress.com/2010/09/07/html-5-canvas-and-dashed-lines/
            //
            // Our growth rate for our line can be one of the following:
            //   (+,+), (+,-), (-,+), (-,-)
            // Because of this, our algorithm needs to understand if the x-coord and
            // y-coord should be getting smaller or larger and properly cap the values
            // based on (x,y).
            var fromX = startPoint.x,
                fromY = startPoint.y,
                toX = endPoint.x,
                toY = endPoint.y;
            var pattern = dashArray;
            var lt = function (a, b) {
                return a <= b;
            };
            var gt = function (a, b) {
                return a >= b;
            };
            var capmin = function (a, b) {
                return Math.min(a, b);
            };
            var capmax = function (a, b) {
                return Math.max(a, b);
            };

            var checkX = {
                thereYet: gt,
                cap: capmin
            };
            var checkY = {
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
            var offsetX = fromX;
            var offsetY = fromY;
            var idx = 0,
                dash = true;
            var ang, len;
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
        if (!isArrayHasData(points)) {
            return;
        }

        var isDashed = isArrayHasData(lineDashArray);
        var isPatternLine = (ignoreStrokePattern === true ? false : Canvas._isPattern(ctx.strokeStyle));
        var point, prePoint, nextPoint;
        for (var i = 0, len = points.length; i < len; i++) {
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
                drawDashLine(point, nextPoint, lineDashArray, isPatternLine);
            }
        }
    },

    path(ctx, points, lineOpacity, fillOpacity, lineDashArray) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        Canvas._path(ctx, points, lineDashArray, lineOpacity);
        Canvas._stroke(ctx, lineOpacity);
    },

    polygon(ctx, points, lineOpacity, fillOpacity, lineDashArray) {
        function fillPolygon(points, i, op) {
            Canvas.fillCanvas(ctx, op, points[i][0].x, points[i][0].y);
        }
        var isPatternLine = Canvas._isPattern(ctx.strokeStyle),
            fillFirst = (isArrayHasData(lineDashArray) && !ctx.setLineDash) || isPatternLine;
        if (!isArrayHasData(points[0])) {
            points = [points];
        }
        var op, i, len;
        if (fillFirst) {
            //因为canvas只填充moveto,lineto,lineto的空间, 而dashline的moveto不再构成封闭空间, 所以重新绘制图形轮廓用于填充
            ctx.save();
            for (i = 0, len = points.length; i < len; i++) {
                Canvas._ring(ctx, points[i], null, 0, true);
                op = fillOpacity;
                if (i > 0) {
                    ctx.globalCompositeOperation = 'destination-out';
                    op = 1;
                }
                fillPolygon(points, i, op);
                if (i > 0) {
                    ctx.globalCompositeOperation = 'source-over';
                } else {
                    ctx.fillStyle = '#fff';
                }
                Canvas._stroke(ctx, 0);
            }
            ctx.restore();
        }
        for (i = 0, len = points.length; i < len; i++) {

            Canvas._ring(ctx, points[i], lineDashArray, lineOpacity);

            if (!fillFirst) {
                op = fillOpacity;
                if (i > 0) {
                    ctx.globalCompositeOperation = 'destination-out';
                    op = 1;
                }
                fillPolygon(points, i, op);
                if (i > 0) {
                    //return to default compositeOperation to display strokes.
                    ctx.globalCompositeOperation = 'source-over';
                } else {
                    ctx.fillStyle = '#fff';
                }
            }
            Canvas._stroke(ctx, lineOpacity);
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

    /**
     * draw an arc from p1 to p2 with degree of (p1, center) and (p2, center)
     * @param  {Context} ctx    canvas context
     * @param  {Point} p1      point 1
     * @param  {Point} p2      point 2
     * @param  {Number} degree arc degree between p1 and p2
     */
    _arcBetween(ctx, p1, p2, degree) {
        var a = degree,
            dist = p1.distanceTo(p2),
            //radius of circle
            r = dist / 2 / Math.sin(a / 2);
        //angle between p1 and p2
        var p1p2 = Math.asin((p2.y - p1.y) / dist);
        if (p1.x > p2.x) {
            p1p2 = Math.PI - p1p2;
        }
        //angle between circle center and p2
        var cp2 = 90 * Math.PI / 180 - a / 2,
            da = p1p2 - cp2;

        var dx = Math.cos(da) * r,
            dy = Math.sin(da) * r,
            cx = p1.x + dx,
            cy = p1.y + dy;

        var startAngle = Math.asin((p2.y - cy) / r);
        if (cx > p2.x) {
            startAngle = Math.PI - startAngle;
        }
        var endAngle = startAngle + a;

        ctx.beginPath();
        ctx.arc(cx, cy, r, startAngle, endAngle);
    },

    _lineTo(ctx, p) {
        ctx.lineTo(p.x, p.y);
    },

    bezierCurveAndFill(ctx, points, lineOpacity, fillOpacity) {
        ctx.beginPath();
        var start = points[0];
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
            var k = 0.5522848,
                ox = a * k, // 水平控制点偏移量
                oy = b * k; // 垂直控制点偏移量
            ctx.beginPath();
            //从椭圆的左端点开始顺时针绘制四条三次贝塞尔曲线
            ctx.moveTo(x - a, y);
            ctx.bezierCurveTo(x - a, y - oy, x - ox, y - b, x, y - b);
            ctx.bezierCurveTo(x + ox, y - b, x + a, y - oy, x + a, y);
            ctx.bezierCurveTo(x + a, y + oy, x + ox, y + b, x, y + b);
            ctx.bezierCurveTo(x - ox, y + b, x - a, y + oy, x - a, y);
            ctx.closePath();
            Canvas.fillCanvas(ctx, fillOpacity, pt.x - width, pt.y - height);
            Canvas._stroke(ctx, lineOpacity, pt.x - width, pt.y - height);
        }
        // pt = pt._round();
        if (width === height) {
            //如果高宽相同,则直接绘制圆形, 提高效率
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, width, 0, 2 * Math.PI);
            Canvas.fillCanvas(ctx, fillOpacity, pt.x - width, pt.y - height);
            Canvas._stroke(ctx, lineOpacity, pt.x - width, pt.y - height);
        } else {
            bezierEllipse(pt.x, pt.y, width, height);
        }

    },

    rectangle(ctx, pt, size, lineOpacity, fillOpacity) {
        // pt = pt._round();
        ctx.beginPath();
        ctx.rect(pt.x, pt.y, size['width'], size['height']);
        Canvas.fillCanvas(ctx, fillOpacity, pt.x, pt.y);
        Canvas._stroke(ctx, lineOpacity, pt.x, pt.y);
    },

    sector(ctx, pt, size, angles, lineOpacity, fillOpacity) {
        var startAngle = angles[0],
            endAngle = angles[1];

        function sector(ctx, x, y, radius, startAngle, endAngle) {
            var rad = Math.PI / 180;
            var sDeg = rad * -endAngle;
            var eDeg = rad * -startAngle;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.arc(x, y, radius, sDeg, eDeg);
            ctx.lineTo(x, y);
            Canvas.fillCanvas(ctx, fillOpacity, x - radius, y - radius);
            Canvas._stroke(ctx, lineOpacity, x - radius, y - radius);
        }
        // pt = pt._round();
        sector(ctx, pt.x, pt.y, size, startAngle, endAngle);
    },

    _isPattern(style) {
        return !isString(style) && !('addColorStop' in style);
    },

    // reference:
    // http://stackoverflow.com/questions/7054272/how-to-draw-smooth-curve-through-n-points-using-javascript-html5-canvas
    quadraticCurve(ctx, points) {
        if (!points || points.length <= 2) {
            return;
        }
        var xc = (points[0].x + points[1].x) / 2,
            yc = (points[0].y + points[1].y) / 2;
        ctx.lineTo(xc, yc);
        var ctrlPts = Canvas._getQuadCurvePoints(points);
        var i, len = ctrlPts.length;
        for (i = 0; i < len; i += 4) {
            ctx.quadraticCurveTo(ctrlPts[i], ctrlPts[i + 1], ctrlPts[i + 2], ctrlPts[i + 3]);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    },

    _getQuadCurvePoints(points) {
        var ctrlPts = [];
        var i, len = points.length;
        var xc, yc;
        for (i = 1; i < len - 1; i++) {
            xc = (points[i].x + points[i + 1].x) / 2;
            yc = (points[i].y + points[i + 1].y) / 2;
            ctrlPts.push(points[i].x, points[i].y, xc, yc);
        }
        return ctrlPts;
    },

    drawCross(ctx, p, lineWidth, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(p.x - 5, p.y);
        ctx.lineTo(p.x + 5, p.y);
        ctx.moveTo(p.x, p.y - 5);
        ctx.lineTo(p.x, p.y + 5);
        ctx.stroke();
    }
};

export default Canvas;
