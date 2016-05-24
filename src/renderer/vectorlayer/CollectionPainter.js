/**
 * @classdesc
 * Painter for collection type geometries
 * @class
 * @protected
 * @param {maptalks.GeometryCollection} geometry - geometry to paint
 */
Z.CollectionPainter = Z.Class.extend(/** @lends maptalks.CollectionPainter.prototype */{
    initialize:function (geometry) {
        this.geometry = geometry;
    },

    _eachPainter:function (fn) {
        var geometries = this.geometry.getGeometries();
        var painter;
        for (var i = 0, len = geometries.length; i < len; i++) {
            painter = geometries[i]._getPainter();
            if (!painter) {
                continue;
            }
            if (painter) {
                if (fn.call(this, painter) === false) {
                    break;
                }
            }
        }
    },

    paint:function (matrix) {
        if (!this.geometry) {
            return;
        }
        // var symbol = this.geometry.getSymbol();
        //将collection的symbol放到末尾,覆盖painter原有的symbol
        // Array.prototype.push.call(arguments, symbol);
        // var args = arguments;
        this._eachPainter(function (painter) {
            painter.paint(matrix);
        });
    },

    getPixelExtent:function () {
        var  extent = new Z.PointExtent();
        this._eachPainter(function (painter) {
            extent = extent.combine(painter.getPixelExtent());
        });
        return extent;
    },

    remove:function () {
        var args = arguments;
        this._eachPainter(function (painter) {
            painter.remove.apply(painter, args);
        });
    },

    setZIndex:function () {
        var args = arguments;
        this._eachPainter(function (painter) {
            painter.setZIndex.apply(painter, args);
        });
    },

    show:function () {
        var args = arguments;
        this._eachPainter(function (painter) {
            painter.show.apply(painter, args);
        });
    },

    hide:function () {
        var args = arguments;
        this._eachPainter(function (painter) {
            painter.hide.apply(painter, args);
        });
    },

    onZoomEnd:function () {
        var args = arguments;
        this._eachPainter(function (painter) {
            painter.onZoomEnd.apply(painter, args);
        });
    },

    repaint:function () {
        var args = arguments;
        this._eachPainter(function (painter) {
            painter.repaint.apply(painter, args);
        });
    },

    refreshSymbol:function () {
        var args = arguments;
        this._eachPainter(function (painter) {
            painter.refreshSymbol.apply(painter, args);
        });
    },

    hasPointSymbolizer:function () {
        var result = false;
        this._eachPainter(function (painter) {
            if (painter.hasPointSymbolizer()) {
                result = true;
                return false;
            }
            return true;
        });
        return result;
    }
});
