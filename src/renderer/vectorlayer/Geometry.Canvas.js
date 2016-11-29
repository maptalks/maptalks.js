//如果不支持canvas, 则不载入canvas的绘制逻辑
if (maptalks.Browser.canvas) {

    var ellipseReources = {
        _getPaintParams: function () {
            var map = this.getMap();
            var pcenter = this._getPrjCoordinates();
            var pt = map._prjToPoint(pcenter);
            var size = this._getRenderSize();
            return [pt, size['width'], size['height']];
        },

        _paintOn: maptalks.Canvas.ellipse
    };

    maptalks.Ellipse.include(ellipseReources);

    maptalks.Circle.include(ellipseReources);
    //----------------------------------------------------
    maptalks.Rectangle.include({
        _getPaintParams: function () {
            var map = this.getMap();
            var pt = map._prjToPoint(this._getPrjCoordinates());
            var size = this._getRenderSize();
            return [pt, size];
        },
        _paintOn: maptalks.Canvas.rectangle
    });
    //----------------------------------------------------
    maptalks.Sector.include({
        _getPaintParams: function () {
            var map = this.getMap();
            var pt = map._prjToPoint(this._getPrjCoordinates());
            var size = this._getRenderSize();
            return [pt, size['width'], [this.getStartAngle(), this.getEndAngle()]];
        },
        _paintOn: maptalks.Canvas.sector

    });
    //----------------------------------------------------

    maptalks.LineString.include({
        arrowStyles : {
            'classic' : [3, 4]
        },

        _getArrowPoints: function (prePoint, point, lineWidth, arrowStyle, tolerance) {
            if (!tolerance) {
                tolerance = 0;
            }
            var width = lineWidth * arrowStyle[0],
                height = lineWidth * arrowStyle[1] + tolerance,
                hw = width / 2 + tolerance;

            var normal = point.substract(prePoint)._unit();
            var p1 = point.add(normal.multi(height));
            normal._perp();
            var p0 = point.add(normal.multi(hw));
            normal._multi(-1);
            var p2 = point.add(normal.multi(hw));
            return [p0, p1, p2, p0];
        },

        _getPaintParams: function () {
            var prjVertexes = this._getPrjCoordinates();
            var points = this._getPath2DPoints(prjVertexes);
            return [points];
        },

        _paintOn:function (ctx, points, lineOpacity, fillOpacity, dasharray) {
            maptalks.Canvas.path(ctx, points, lineOpacity, null, dasharray);
            this._paintArrow(ctx, points, lineOpacity);
        },

        _getArrowPlacement: function () {
            return this.options['arrowPlacement'];
        },

        _getArrowStyle: function () {
            var arrowStyle = this.options['arrowStyle'];
            if (arrowStyle) {
                return maptalks.Util.isArray(arrowStyle) ? arrowStyle : this.arrowStyles[arrowStyle];
            }
            return null;
        },

        _getArrows: function (points, lineWidth, tolerance) {
            var arrowStyle = this._getArrowStyle();
            if (!arrowStyle || points.length < 2) {
                return null;
            }
            var isSplitted = points.length > 0 && maptalks.Util.isArray(points[0]);
            var segments = isSplitted ? points : [points];
            var placement = this._getArrowPlacement();
            var arrows = [];
            for (var i = segments.length - 1; i >= 0; i--) {
                if (placement === 'vertex-first' || placement === 'vertex-firstlast') {
                    arrows.push(this._getArrowPoints(segments[i][1], segments[i][0], lineWidth, arrowStyle, tolerance));
                }
                if (placement === 'vertex-last' || placement === 'vertex-firstlast') {
                    arrows.push(this._getArrowPoints(segments[i][segments[i].length - 2], segments[i][segments[i].length - 1], lineWidth, arrowStyle, tolerance));
                } else if (placement === 'point') {
                    for (var ii = 0, ll = segments[i].length - 1; ii < ll; ii++) {
                        arrows.push(this._getArrowPoints(segments[i][ii], segments[i][ii + 1], lineWidth, arrowStyle, tolerance));
                    }
                }
            }
            return arrows.length > 0 ? arrows : null;
        },

        _paintArrow: function (ctx, points, lineOpacity) {
            var lineWidth = this._getInternalSymbol()['lineWidth'];
            if (!lineWidth || lineWidth < 3) {
                lineWidth = 3;
            }
            var arrows = this._getArrows(points, lineWidth);
            if (!arrows) {
                return;
            }
            if (arrows) {
                if (ctx.setLineDash) {
                    //remove line dash effect if any
                    ctx.setLineDash([]);
                }
                for (var i = arrows.length - 1; i >= 0; i--) {
                    ctx.fillStyle = ctx.strokeStyle;
                    maptalks.Canvas.polygon(ctx, arrows[i], lineOpacity, lineOpacity);
                }
            }
        }
    });

    maptalks.Polygon.include({
        _getPaintParams: function () {
            var prjVertexes = this._getPrjCoordinates(),
                points = this._getPath2DPoints(prjVertexes),
                //splitted by anti-meridian
                isSplitted = points.length > 0 && maptalks.Util.isArray(points[0]);
            if (isSplitted) {
                points = [[points[0]], [points[1]]];
            }
            var prjHoles = this._getPrjHoles();
            var holePoints = [];
            if (maptalks.Util.isArrayHasData(prjHoles)) {
                var hole;
                for (var i = 0; i < prjHoles.length; i++) {
                    hole = this._getPath2DPoints(prjHoles[i]);
                    if (isSplitted) {
                        if (maptalks.Util.isArray(hole)) {
                            points[0].push(hole[0]);
                            points[1].push(hole[1]);
                        } else {
                            points[0].push(hole);
                        }
                    } else {
                        holePoints.push(hole);
                    }

                }
            }
            return [isSplitted ? points : [points].concat(holePoints)];
        },
        _paintOn: maptalks.Canvas.polygon
    });
}
