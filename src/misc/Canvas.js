Z.Canvas = {

    createCanvas:function (width, height, canvasClass) {
        var canvas;
        if (!Z.node) {
            canvas = Z.DomUtil.createEl('canvas');
            canvas.width = width;
            canvas.height = height;
        } else {
            //can be node-canvas or any other canvas mock
            canvas = new canvasClass(width, height);
        }
        return canvas;
    },

    setDefaultCanvasSetting:function (ctx) {
        ctx.lineWidth = 1;
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';
        ctx.strokeStyle = 'rgba(0,0,0,1)';//'rgba(71,76,248,1)';//this.getRgba('#474cf8',1);
        ctx.fillStyle = 'rgba(255,255,255,0)';//this.getRgba('#ffffff',0);
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

    prepareCanvasFont:function (ctx, style) {
        ctx.font = Z.symbolizer.TextMarkerSymbolizer.getFont(style);
        var fill = style['textFill'];
        if (!fill) { fill = Z.Symbolizer.DEFAULT_TEXT_COLOR; }
        ctx.fillStyle = this.getRgba(fill, style['textOpacity']);
    },

    prepareCanvas:function (ctx, style, resources) {
        if (!style) {
            return;
        }
        var strokeWidth = style['lineWidth'];
        if (!Z.Util.isNil(strokeWidth) && ctx.lineWidth !== strokeWidth) {
            ctx.lineWidth = strokeWidth;
        }
        var strokeColor = style['lineColor'] || style['linePatternFile'] || Z.Symbolizer.DEFAULT_STROKE_COLOR;
        if (Z.Util.isCssUrl(strokeColor) && resources) {
            Z.Canvas._setStrokePattern(ctx, strokeColor, strokeWidth, resources);
            //line pattern will override stroke-dasharray
            style['lineDasharray'] = [];
        } else if (Z.Util.isGradient(strokeColor)) {
            if (style['lineGradientExtent']) {
                ctx.strokeStyle = Z.Canvas._createGradient(ctx, strokeColor, style['lineGradientExtent']);
            } else {
                ctx.strokeStyle = 'rgba(0,0,0,1)';
            }
        } else {
            var color = Z.Canvas.getRgba(strokeColor, 1);
            if (ctx.strokeStyle !== color) {
                ctx.strokeStyle = color;
            }
        }
        if (style['lineJoin'] && ctx.lineJoin !== style['lineJoin']) {
            ctx.lineJoin = style['lineJoin'];
        }
        if (style['lineCap'] && ctx.lineCap !== style['lineCap']) {
            ctx.lineCap = style['lineCap'];
        }
        if (ctx.setLineDash && Z.Util.isArrayHasData(style['lineDasharray'])) {
            ctx.setLineDash(style['lineDasharray']);
        }
        var fill = style['polygonFill'] || style['polygonPatternFile'] || Z.Symbolizer.DEFAULT_FILL_COLOR;
        if (Z.Util.isCssUrl(fill)) {
            var fillImgUrl = Z.Util.extractCssUrl(fill);
            var fillTexture = resources.getImage([fillImgUrl, null, null]);
            if (!fillTexture) {
                //if the linestring has a arrow and a linePatternFile, polygonPatternFile will be set with the linePatternFile.
                fillTexture = resources.getImage([fillImgUrl + '-texture', null, strokeWidth]);
            }
            if (Z.Util.isSVG(fillImgUrl) && (fillTexture instanceof Image) && (Z.Browser.edge || Z.Browser.ie)) {
                //opacity of svg img painted on canvas is always 1, so we paint svg on a canvas at first.
                var w = fillTexture.width || 20,
                    h = fillTexture.height || 20;
                var canvas = Z.Canvas.createCanvas(w, h);
                Z.Canvas.image(canvas.getContext('2d'), fillTexture, 0, 0, w, h);
                fillTexture = canvas;
            }
            ctx.fillStyle = ctx.createPattern(fillTexture, 'repeat');
        } else if (Z.Util.isGradient(fill)) {
            if (style['polygonGradientExtent']) {
                ctx.fillStyle = Z.Canvas._createGradient(ctx, fill, style['polygonGradientExtent']);
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0)';
            }
        } else {
            var fillColor = this.getRgba(fill, 1);
            if (ctx.fillStyle !== fillColor) {
                ctx.fillStyle = fillColor;
            }
        }
    },

    _createGradient: function (ctx, g, extent) {
        var gradient = null, places = g['places'],
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
                places = [c.x, c.y, c.x - min.x, c.x, c.y, 0];
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
        g['colorStops'].forEach(function (stop) {
            gradient.addColorStop.apply(gradient, stop);
        });
        return gradient;
        /*{
           type : 'linear/radial',
           places : [],
           colorStops : [
              [0, 'red'],
              [0.5, 'blue'],
              [1, 'green']
           ]
        }*/
    },

    _setStrokePattern: function (ctx, strokePattern, strokeWidth, resources) {
        var imgUrl = Z.Util.extractCssUrl(strokePattern);
        var imageTexture;
        if (Z.node) {
            imageTexture = resources.getImage([imgUrl, null, strokeWidth]);
        } else {
            imageTexture = resources.getImage([imgUrl + '-texture', null, strokeWidth]);
            if (!imageTexture) {
                var imageRes = resources.getImage([imgUrl, null, strokeWidth]);
                if (imageRes) {
                    var w;
                    if (!imageRes.width || !imageRes.height) {
                        w = strokeWidth;
                    } else {
                        w = Z.Util.round(imageRes.width * strokeWidth / imageRes.height);
                    }
                    var patternCanvas = this.createCanvas(w, strokeWidth, ctx.canvas.constructor);
                    Z.Canvas.image(patternCanvas.getContext('2d'), imageRes, 0, 0, w, strokeWidth);
                    resources.addResource([imgUrl + '-texture', null, strokeWidth], patternCanvas);
                    imageTexture = patternCanvas;
                }
            }
        }
        if (imageTexture) {
            ctx.strokeStyle = ctx.createPattern(imageTexture, 'repeat');
        }
    },

    clearRect:function (ctx, x1, y1, x2, y2) {
        ctx.clearRect(x1, y1, x2, y2);
    },

    fillCanvas:function (ctx, fillOpacity, x, y) {
        var isPattern = Z.Canvas._isPattern(ctx.fillStyle);
        if (Z.Util.isNil(fillOpacity)) {
            fillOpacity = 1;
        }
        var alpha;
        if (fillOpacity < 1) {
            alpha = ctx.globalAlpha;
            ctx.globalAlpha *= fillOpacity;
        }
        if (isPattern) {
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
    getRgba:function (color, op) {
        if (Z.Util.isNil(op)) {
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

    image:function (ctx, img, x, y, width, height) {
        x = Z.Util.round(x);
        y = Z.Util.round(y);
        try {
            if (Z.Util.isNumber(width) && Z.Util.isNumber(height)) {
                ctx.drawImage(img, x, y, Z.Util.round(width), Z.Util.round(height));
            } else {
                ctx.drawImage(img, x, y);
            }
        } catch (error) {
            console.warn('error when drawing image on canvas:', error);
        }

    },

    text:function (ctx, text, pt, style, textDesc) {
        // pt = pt.add(new Z.Point(style['textDx'], style['textDy']));
        this._textOnMultiRow(ctx, textDesc['rows'], style, pt, textDesc['size'], textDesc['rawSize']);
    },

    _textOnMultiRow: function (ctx, texts, style, point, splitTextSize, textSize) {
        var ptAlign = Z.StringUtil.getAlignPoint(splitTextSize, style['textHorizontalAlignment'], style['textVerticalAlignment']);
        var lineHeight = textSize['height'] + style['textLineSpacing'];
        var basePoint = point.add(0, ptAlign.y);
        var text, rowAlign;
        for (var i = 0, len = texts.length; i < len; i++) {
            text = texts[i]['text'];
            rowAlign = Z.StringUtil.getAlignPoint(texts[i]['size'], style['textHorizontalAlignment'], style['textVerticalAlignment']);
            Z.Canvas._textOnLine(ctx, text, basePoint.add(rowAlign.x, i * lineHeight), style['textHaloRadius'], style['textHaloFill']);
        }
    },

    _textOnLine: function (ctx, text, pt, textHaloRadius, textHaloFill) {
        //http://stackoverflow.com/questions/14126298/create-text-outline-on-canvas-in-javascript
        //根据text-horizontal-alignment和text-vertical-alignment计算绘制起始点偏移量
        pt = pt._round();
        ctx.textBaseline = 'top';
        if (textHaloRadius) {
            ctx.miterLimit = 2;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            var lineWidth = (textHaloRadius * 2 - 1);
            ctx.lineWidth = Z.Util.round(lineWidth);
            ctx.strokeStyle = Z.Canvas.getRgba(textHaloFill, 1);
            ctx.strokeText(text, pt.x, pt.y);
            ctx.lineWidth = 1;
            ctx.miterLimit = 10; //default
        }

        ctx.fillText(text, pt.x, pt.y);
    },

    fillText:function (ctx, text, point, rgba) {
        ctx.fillStyle = rgba;
        ctx.fillText(text, point.x, point.y);
    },

    _stroke:function (ctx, strokeOpacity, x, y) {
        var isPattern = Z.Canvas._isPattern(ctx.strokeStyle) && !Z.Util.isNil(x) && !Z.Util.isNil(y);
        if (Z.Util.isNil(strokeOpacity)) {
            strokeOpacity = 1;
        }
        var alpha;
        if (strokeOpacity < 1) {
            alpha = ctx.globalAlpha;
            ctx.globalAlpha *= strokeOpacity;
        }
        if (isPattern) {
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

    _path:function (ctx, points, lineDashArray, lineOpacity, ignoreStrokePattern) {
        function fillWithPattern(p1, p2) {
            var degree = Z.Util.computeDegree(p1, p2);
            ctx.save();
            ctx.translate(p1.x, p1.y - ctx.lineWidth / 2 / Math.cos(degree));
            ctx.rotate(degree);
            Z.Canvas._stroke(ctx, lineOpacity);
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
            var fromX = startPoint.x, fromY = startPoint.y,
                toX = endPoint.x, toY = endPoint.y;
            var pattern = dashArray;
            var lt = function (a, b) { return a <= b; };
            var gt = function (a, b) { return a >= b; };
            var capmin = function (a, b) { return Math.min(a, b); };
            var capmax = function (a, b) { return Math.max(a, b); };

            var checkX = {thereYet: gt, cap: capmin};
            var checkY = {thereYet: gt, cap: capmin};

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
            var idx = 0, dash = true;
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
        if (!Z.Util.isArrayHasData(points)) { return; }

        var isDashed = Z.Util.isArrayHasData(lineDashArray);
        var isPatternLine = (ignoreStrokePattern === true ? false : Z.Canvas._isPattern(ctx.strokeStyle));
        var point, prePoint, nextPoint;
        for (var i = 0, len = points.length; i < len; i++) {
            point = points[i]._round();
            if (!isDashed || ctx.setLineDash) { //IE9+
                if (i === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
                if (isPatternLine && i > 0) {
                    prePoint = points[i - 1]._round();
                    fillWithPattern(prePoint, point);
                    ctx.beginPath();
                    ctx.moveTo(point.x, point.y);
                }
            } else if (isDashed) {
                if (i === len - 1) {
                    break;
                }
                nextPoint = points[i + 1]._round();
                drawDashLine(point, nextPoint, lineDashArray, isPatternLine);
            }
        }
    },

    path:function (ctx, points, lineOpacity, fillOpacity, lineDashArray) {
        ctx.beginPath();
        Z.Canvas._path(ctx, points, lineDashArray, lineOpacity);
        Z.Canvas._stroke(ctx, lineOpacity);
    },

    polygon:function (ctx, points, lineOpacity, fillOpacity, lineDashArray) {
        function fillPolygon(points, i, op) {
            Z.Canvas.fillCanvas(ctx, op, points[i][0].x, points[i][0].y);
        }
        var isPatternLine = Z.Canvas._isPattern(ctx.strokeStyle),
            fillFirst = (Z.Util.isArrayHasData(lineDashArray) && !ctx.setLineDash) || isPatternLine;
        if (!Z.Util.isArrayHasData(points[0])) {
            points = [points];
        }
        var op, i, len;
        if (fillFirst) {
            //因为canvas只填充moveto,lineto,lineto的空间, 而dashline的moveto不再构成封闭空间, 所以重新绘制图形轮廓用于填充
            ctx.save();
            for (i = 0, len = points.length; i < len; i++) {
                Z.Canvas._ring(ctx, points[i], null, 0, true);
                op = fillOpacity;
                if (i > 0) {
                    ctx.globalCompositeOperation = 'destination-out';
                    op = 1;
                }
                fillPolygon(points, i, op);
                if (i > 0) {
                    ctx.globalCompositeOperation = 'source-over';
                }
                Z.Canvas._stroke(ctx, 0);
            }
            ctx.restore();
        }
        for (i = 0, len = points.length; i < len; i++) {

            Z.Canvas._ring(ctx, points[i], lineDashArray, lineOpacity);

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
                }
            }
            Z.Canvas._stroke(ctx, lineOpacity);
        }

    },

    _ring:function (ctx, ring, lineDashArray, lineOpacity, ignoreStrokePattern) {
        var isPatternLine = (ignoreStrokePattern === true ? false : Z.Canvas._isPattern(ctx.strokeStyle));
        if (isPatternLine && !ring[0].equals(ring[ring.length - 1])) {
            ring = ring.concat([ring[0]]);
        }
        ctx.beginPath();
        Z.Canvas._path(ctx, ring, lineDashArray, lineOpacity, ignoreStrokePattern);
        if (!isPatternLine) {
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
    _arcBetween : function (ctx, p1, p2, degree) {
        var a = degree * Math.PI / 180,
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
        ctx.arc(Z.Util.round(cx), Z.Util.round(cy), Z.Util.round(r), startAngle, endAngle);
    },

    _lineTo:function (ctx, p) {
        ctx.lineTo(p.x, p.y);
    },

    bezierCurveAndFill:function (ctx, points, lineOpacity, fillOpacity) {
        ctx.beginPath();
        var start = points[0]._round();
        ctx.moveTo(start.x, start.y);
        Z.Canvas._bezierCurveTo.apply(Z.Canvas, [ctx].concat(points.splice(1)));
        Z.Canvas.fillCanvas(ctx, fillOpacity);
        Z.Canvas._stroke(ctx, lineOpacity);
    },

    _bezierCurveTo:function (ctx, p1, p2, p3) {
        p1 = p1._round();
        p2 = p2._round();
        p3 = p3._round();
        ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    },

    _quadraticCurveTo:function (ctx, p1, p2) {
        p1 = p1._round();
        p2 = p2._round();
        ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
    },

    //各种图形的绘制方法
    ellipse:function (ctx, pt, width, height, lineOpacity, fillOpacity) {
        function bezierEllipse(x, y, a, b) {
            var k = 0.5522848,
                ox = a * k, // 水平控制点偏移量
                oy = b * k; // 垂直控制点偏移量
            ctx.beginPath();
           //从椭圆的左端点开始顺时针绘制四条三次贝塞尔曲线
            ctx.moveTo(x - a, y);
            Z.Canvas._bezierCurveTo(ctx, new Z.Point(x - a, y - oy), new Z.Point(x - ox, y - b), new Z.Point(x, y - b));
            Z.Canvas._bezierCurveTo(ctx, new Z.Point(x + ox, y - b), new Z.Point(x + a, y - oy), new Z.Point(x + a, y));
            Z.Canvas._bezierCurveTo(ctx, new Z.Point(x + a, y + oy), new Z.Point(x + ox, y + b), new Z.Point(x, y + b));
            Z.Canvas._bezierCurveTo(ctx, new Z.Point(x - ox, y + b), new Z.Point(x - a, y + oy), new Z.Point(x - a, y));
            ctx.closePath();
            Z.Canvas.fillCanvas(ctx, fillOpacity, pt.x - width, pt.y - height);
            Z.Canvas._stroke(ctx, lineOpacity, pt.x - width, pt.y - height);
        }
        pt = pt._round();
        if (width === height) {
            //如果高宽相同,则直接绘制圆形, 提高效率
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, Z.Util.round(width), 0, 2 * Math.PI);
            Z.Canvas.fillCanvas(ctx, fillOpacity, pt.x - width, pt.y - height);
            Z.Canvas._stroke(ctx, lineOpacity, pt.x - width, pt.y - height);
        } else {
            bezierEllipse(pt.x, pt.y, width, height);
        }

    },

    rectangle:function (ctx, pt, size, lineOpacity, fillOpacity) {
        pt = pt._round();
        ctx.beginPath();
        ctx.rect(pt.x, pt.y,
            Z.Util.round(size['width']), Z.Util.round(size['height']));
        Z.Canvas.fillCanvas(ctx, fillOpacity, pt.x, pt.y);
        Z.Canvas._stroke(ctx, lineOpacity, pt.x, pt.y);
    },

    sector:function (ctx, pt, size, angles, lineOpacity, fillOpacity) {
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
            Z.Canvas.fillCanvas(ctx, fillOpacity, x - radius, y - radius);
            Z.Canvas._stroke(ctx, lineOpacity, x - radius, y - radius);
        }
        pt = pt._round();
        sector(ctx, pt.x, pt.y, size, startAngle, endAngle);
    },

    _isPattern : function (style) {
        return !Z.Util.isString(style) && !('addColorStop' in style);
    }
};
