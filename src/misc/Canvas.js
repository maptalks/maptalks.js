Z.Canvas = {
    createCanvas:function(width, height, canvasClass) {
        var canvas;
        if (!Z.runningInNode) {
            canvas = Z.DomUtil.createEl('canvas');
            canvas.width = width;
            canvas.height = height;
        } else {
            //can be node-canvas or any other canvas mock
            canvas = new canvasClass(width, height);
        }
        return canvas;
    },

    setDefaultCanvasSetting:function(ctx) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(71,76,248,1)';//this.getRgba('#474cf8',1);
        ctx.fillStyle = 'rgba(255,255,255,0)';//this.getRgba('#ffffff',0);
        ctx.textAlign='start';
        ctx.textBaseline='hanging';
        var fontSize = 11;
        ctx.font=fontSize+'px monospace';
        ctx.shadowBlur = null;
        ctx.shadowColor = null;
        if (ctx.setLineDash) {
            ctx.setLineDash([]);
        }
        ctx.globalAlpha = 1;
    },

    prepareCanvasFont:function(ctx, style) {
        var font = Z.symbolizer.TextMarkerSymbolizer.getFont(style);
        ctx.font = font;
        var fill=style['textFill'];
        if (!fill) {return;}
        var fillOpacity = style['textOpacity'];
        ctx.fillStyle =this.getRgba(fill, fillOpacity);
    },

    // TODO: no prepare, set style just before stroke/fill
    prepareCanvas:function(ctx, strokeSymbol, fillSymbol, resources){
        if (strokeSymbol) {
            var strokeWidth = strokeSymbol['stroke-width'];
            if (!Z.Util.isNil(strokeWidth)) {
                ctx.lineWidth = strokeWidth;
            }
            var strokeColor = strokeSymbol['stroke'];
             if (strokeColor)  {
                 if (Z.Util.isCssUrl(strokeColor)) {
                    var imgUrl = Z.Util.extractCssUrl(strokeColor);
                    var imageTexture = resources.getImage(imgUrl);
                    if (imageTexture) {
                        if (imageTexture instanceof Image) {
                            var w = Z.Util.round(imageTexture.width*strokeWidth/imageTexture.height);
                            var patternCanvas = this.createCanvas(w,strokeWidth,ctx.canvas.constructor);
                            var patternCtx = patternCanvas.getContext('2d');
                            patternCtx.drawImage(imageTexture,0,0,w,strokeWidth);
                            resources.addResource(imgUrl,patternCanvas);
                            imageTexture = patternCanvas;
                        }
                        //line pattern will override stroke-dasharray
                        strokeSymbol['stroke-dasharray'] = [];
                        ctx.strokeStyle = ctx.createPattern(imageTexture, 'repeat');
                    }
                 } else {
                    ctx.strokeStyle = Z.Canvas.getRgba(strokeColor,1);
                 }
             }
             //低版本ie不支持该属性
             if (ctx.setLineDash) {
                 var strokeDash=(strokeSymbol['stroke-dasharray']);
                 if (Z.Util.isArrayHasData(strokeDash)) {
                    ctx.setLineDash(strokeDash);
                 }
             }
         }
         if (fillSymbol) {
            var fill=fillSymbol['fill'];
            if (!fill) {
                return;
            }
            if (Z.Util.isCssUrl(fill)) {
                var imgUrl = Z.Util.extractCssUrl(fill);
                var imageTexture = resources.getImage(imgUrl);
                ctx.fillStyle = ctx.createPattern(imageTexture, 'repeat');
            } else {
                ctx.fillStyle =this.getRgba(fill, 1);
            }
         }
    },

    clearRect:function(ctx,x1,y1,x2,y2) {
        ctx.clearRect(x1, y1, x2, y2);
    },

    fillCanvas:function(ctx, fillOpacity){
        if (Z.Util.isNil(fillOpacity)) {
           fillOpacity = 1
        }
        var alpha = ctx.globalAlpha;

        ctx.globalAlpha *= fillOpacity;
        ctx.fill();
        ctx.globalAlpha = alpha;
    },

    // hexColorRe: /^#([0-9a-f]{6}|[0-9a-f]{3})$/i,

    // support #RRGGBB/#RGB now.
    // if color was like [red, orange...]/rgb(a)/hsl(a), op will not combined to result
    getRgba:function(color, op) {
        if (Z.Util.isNil(op)) {
            op = 1;
        }
        if ('#' !== color.substring(0,1)) {
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
        return "rgba("+r+","+g+","+b+","+op+")";
    },

    resetContextState:function(ctx) {
        // ctx['maptalks-img-smoothing-disabled'] = false;
    },

    image:function(ctx, pt, img, width, height) {
        pt = pt.round();
        var x=pt.x,y=pt.y;
        // Z.Canvas.disableImageSmoothing(ctx);
        if (Z.Util.isNumber(width) && Z.Util.isNumber(height)) {
            ctx.drawImage(img,x,y,width,height);
        } else {
            ctx.drawImage(img,x,y);
        }
    },

    text:function(ctx, text, pt, style, textDesc) {
        // pt = pt.add(new Z.Point(style['textDx'], style['textDy']));
        this._textOnMultiRow(ctx, textDesc['rows'], style, pt, textDesc['size'], textDesc['rawSize']);
    },

    _textOnMultiRow: function(ctx, texts, style, point, splitTextSize, textSize) {
        var ptAlign = Z.StringUtil.getAlignPoint(splitTextSize,style['textHorizontalAlignment'],style['textVerticalAlignment']);
        var lineHeight = textSize['height']+style['textLineSpacing'];
        var basePoint = point.add(new Z.Point(0, ptAlign.y));
        for(var i=0,len=texts.length;i<len;i++) {
            var text = texts[i]['text'];
            var rowAlign = Z.StringUtil.getAlignPoint(texts[i]['size'],style['textHorizontalAlignment'],style['textVerticalAlignment']);
            Z.Canvas._textOnLine(ctx, text, basePoint.add(new Z.Point(rowAlign.x, i*lineHeight)), style['textHaloRadius'], style['textHaloFill']);
        }
    },

    _textOnLine: function(ctx, text, pt, textHaloRadius, textHaloFill) {
        //http://stackoverflow.com/questions/14126298/create-text-outline-on-canvas-in-javascript
        //根据text-horizontal-alignment和text-vertical-alignment计算绘制起始点偏移量
        pt = pt.add(new Z.Point(0,3)).round();
        var x = pt.x, y=pt.y;
        if (textHaloRadius) {
            ctx.miterLimit = 2;
            ctx.lineJoin = 'circle';
            var lineWidth=(textHaloRadius*2-1);
            ctx.lineWidth = Z.Util.round(lineWidth);
            ctx.strokeStyle =Z.Canvas.getRgba(textHaloFill, 1);
            ctx.strokeText(text, x, y);
            ctx.lineWidth = 1;
            ctx.miterLimit = 10; //default
        }

        ctx.fillText(text, x, y);
    },

    fillText:function(ctx, text, point, rgba) {
        ctx.fillStyle = rgba;
        ctx.fillText(text, point.x, point.y);
    },


    shield: function (ctx, point, img, text, textDesc, style) {
        if (img) {
            var width = img.width,
                height = img.height,
                imgPos = point.substract(new Z.Point(width/2, height/2));
            Z.Canvas.image(ctx, imgPos, img, width, height);
        }
        Z.Canvas.text(ctx, text, point, style, textDesc);
    },

    _stroke:function(ctx, strokeOpacity) {
        if (Z.Util.isNil(strokeOpacity)) {
            strokeOpacity = 1;
        }
        var alpha = ctx.globalAlpha;
        ctx.globalAlpha *= strokeOpacity;
        ctx.stroke();
        ctx.globalAlpha = alpha;
    },

    _path:function(ctx, points, lineDashArray, lineOpacity) {
        function fillWithPattern(p1, p2) {
            var dx = p1.x - p2.x;
            var dy = p1.y - p2.y;
            var degree = Math.atan2(dy,dx);
            ctx.save();
            ctx.translate(p1.x, p1.y-ctx.lineWidth/2/Math.cos(degree));
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
              var fromX = startPoint.x,fromY = startPoint.y,
                toX = endPoint.x,toY = endPoint.y;
              var pattern = dashArray;
              var lt = function (a, b) { return a <= b; };
              var gt = function (a, b) { return a >= b; };
              var capmin = function (a, b) { return Math.min(a, b); };
              var capmax = function (a, b) { return Math.max(a, b); };

              var checkX = { thereYet: gt, cap: capmin };
              var checkY = { thereYet: gt, cap: capmin };

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
              while (!(checkX.thereYet(offsetX, toX) && checkY.thereYet(offsetY, toY))) {
                var ang = Math.atan2(toY - fromY, toX - fromX);
                var len = pattern[idx];

                offsetX = checkX.cap(toX, offsetX + (Math.cos(ang) * len));
                offsetY = checkY.cap(toY, offsetY + (Math.sin(ang) * len));

                if (dash) {ctx.lineTo(offsetX, offsetY);}
                else {ctx.moveTo(offsetX, offsetY);}

                idx = (idx + 1) % pattern.length;
                dash = !dash;
              }
        }
        if (!Z.Util.isArrayHasData(points)) {return;}

        var isDashed = Z.Util.isArrayHasData(lineDashArray);
        var isPatternLine = !Z.Util.isString(ctx.strokeStyle);
        for (var i=0, len=points.length; i<len;i++) {
            var point = points[i].round();
            if (!isDashed || ctx.setLineDash) {//ie9以上浏览器
                if (i === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x,point.y);
                }
                if (isPatternLine && i > 0) {
                    var prePoint = points[i-1].round();
                    fillWithPattern(prePoint, point);
                    ctx.beginPath();
                    ctx.moveTo(point.x,point.y);
                }
            } else {
                if (isDashed) {
                    if(i === len-1) {
                        break;
                    }
                    var nextPoint = points[i+1].round();
                    drawDashLine(point, nextPoint, lineDashArray, isPatternLine);

                }
            }
         }
    },

    path:function(ctx, points, lineOpacity, fillOpacity, lineDashArray) {
        ctx.beginPath();
        Z.Canvas._path(ctx,points, lineDashArray, lineOpacity);
        Z.Canvas._stroke(ctx, lineOpacity);
    },

    polygon:function(ctx, points, lineOpacity, fillOpacity, lineDashArray) {
        var isPatternLine = !Z.Util.isString(ctx.strokeStyle);
        var fillFirst = (Z.Util.isArrayHasData(lineDashArray) && !ctx.setLineDash) || isPatternLine;
        if (!Z.Util.isArrayHasData(points[0])) {
            points = [points];
        }

        if (fillFirst) {
            //因为canvas只填充moveto,lineto,lineto的空间, 而dashline的moveto不再构成封闭空间, 所以重新绘制图形轮廓用于填充
            ctx.save();
            for (var i = 0; i < points.length; i++) {
                Z.Canvas._ring(ctx, points[i], null, 0);
               if (!fillFirst) {
                    var o = fillOpacity;
                    if (i > 0) {
                        ctx.globalCompositeOperation = "destination-out";
                        o = 1;
                    }
                    Z.Canvas.fillCanvas(ctx, o);
                }
                if (i > 0) {
                    ctx.globalCompositeOperation = "source-over";
                }
                Z.Canvas._stroke(ctx, 0);
            }
            ctx.restore();
        }
        for (var i = 0; i < points.length; i++) {

            Z.Canvas._ring(ctx, points[i], lineDashArray, lineOpacity);

            if (!fillFirst) {
                var o = fillOpacity;
                if (i > 0) {
                    ctx.globalCompositeOperation = "destination-out";
                    o = 1;
                }
                Z.Canvas.fillCanvas(ctx, o);
            }
            if (i > 0) {
                //return to default compositeOperation to display strokes.
                ctx.globalCompositeOperation = "source-over";
            }
            Z.Canvas._stroke(ctx, lineOpacity);
        }

    },

    _ring:function(ctx, ring, lineDashArray, lineOpacity) {
        ctx.beginPath();
        Z.Canvas._path(ctx,ring, lineDashArray, lineOpacity);
        ctx.closePath();
    },

    /**
     * draw a arc from p1 to p2 with degree of (p1, center) and (p2, center)
     * @param  {Context} ctx    canvas context
     * @param  {Point} p1      point 1
     * @param  {Point} p2      point 2
     * @param  {Number} degree arc degree between p1 and p2
     */
    _arcBetween : function(ctx, p1, p2, degree) {
        var a = degree * Math.PI/180;
        var dist = p1.distanceTo(p2),
            //radius of circle
            r = dist/2/Math.sin(a/2);
        //angle between p1 and p2
        var a_p1p2 = Math.asin((p2.y-p1.y)/dist);
        if (p1.x > p2.x) {
            a_p1p2 = Math.PI - a_p1p2;
        }
        //angle between circle center and p2
        var a_cp2 = 90*Math.PI/180 - a/2;

        var da = a_p1p2 - a_cp2;

        var dx = Math.cos(da)*r,
            dy = Math.sin(da)*r;

        var cx, cy;
        cy = p1.y + dy,
        cx = p1.x + dx;

        var startAngle = Math.asin((p2.y-cy)/r);
        if (cx > p2.x) {
            startAngle = Math.PI - startAngle;
        }
        var endAngle = startAngle+a;

        ctx.beginPath();
        ctx.arc(Z.Util.round(cx), Z.Util.round(cy), Z.Util.round(r), startAngle, endAngle);
    },

    _lineTo:function(ctx, p) {
        ctx.lineTo(p.x, p.y);
    },

    bezierCurveAndFill:function(ctx, points, lineOpacity, fillOpacity, lineDashArray) {
        ctx.beginPath(points);
        var start = points[0].round();
        ctx.moveTo(start.x,start.y);
        Z.Canvas._bezierCurveTo.apply(Z.Canvas, [ctx].concat(points.splice(1)));
        Z.Canvas.fillCanvas(ctx, fillOpacity);
        Z.Canvas._stroke(ctx, lineOpacity);
    },

    _bezierCurveTo:function(ctx, p1, p2, p3) {
        p1 = p1.round();
        p2 = p2.round();
        p3 = p3.round();
        ctx.bezierCurveTo(p1.x,p1.y,p2.x,p2.y,p3.x,p3.y);
    },

    _quadraticCurveTo:function(ctx, p1, p2) {
        p1 = p1.round();
        p2 = p2.round();
        ctx.quadraticCurveTo(p1.x,p1.y,p2.x,p2.y);
    },

    //各种图形的绘制方法
    ellipse:function (ctx, pt, size, lineOpacity, fillOpacity) {
        //TODO canvas scale后会产生错误?
        function bezierEllipse( x, y, a, b)
        {
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
           Z.Canvas.fillCanvas(ctx, fillOpacity);
           Z.Canvas._stroke(ctx, lineOpacity);
        }
        pt = pt.round();
        if (size['width'] === size['height']) {
            //如果高宽相同,则直接绘制圆形, 提高效率
            ctx.beginPath();
            ctx.arc(pt.x,pt.y,Z.Util.round(size['width']),0,2*Math.PI);
            Z.Canvas.fillCanvas(ctx, fillOpacity);
            Z.Canvas._stroke(ctx, lineOpacity);
        } else {
            bezierEllipse(pt.x,pt.y,size["width"],size["height"]);
        }

    },

    rectangle:function(ctx, pt, size, lineOpacity, fillOpacity) {
        pt = pt.round();
        ctx.beginPath();
        ctx.rect(pt.x, pt.y,
            Z.Util.round(size['width']),Z.Util.round(size['height']));
        Z.Canvas.fillCanvas(ctx, fillOpacity);
        Z.Canvas._stroke(ctx, lineOpacity);
    },

    sector:function(ctx, pt, size, angles, lineOpacity, fillOpacity) {
        var startAngle = angles[0],
            endAngle = angles[1];
        function sector(ctx, x, y, radius, startAngle, endAngle) {
            var rad = Math.PI / 180;
            var sDeg = rad*-endAngle;
            var eDeg = rad*-startAngle;
            ctx.beginPath();
            ctx.moveTo(x,y);
            ctx.arc(x, y, radius,sDeg, eDeg);
            ctx.lineTo(x,y);
            Z.Canvas.fillCanvas(ctx, fillOpacity);
            Z.Canvas._stroke(ctx, lineOpacity);
        }
        pt = pt.round();
        sector(ctx,pt.x,pt.y,size,startAngle,endAngle);
    }
};
