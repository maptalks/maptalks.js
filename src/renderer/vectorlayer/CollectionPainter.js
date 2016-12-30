import Class from 'core/Class';
import PointExtent from 'geo/PointExtent';

/**
 * @classdesc
 * Painter for collection type geometries
 * @class
 * @protected
 * @param {GeometryCollection} geometry - geometry to paint
 */
export class CollectionPainter extends Class {
    constructor(geometry) {
        super();
        this.geometry = geometry;
    }

    _eachPainter(fn) {
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
    }

    paint() {
        if (!this.geometry) {
            return;
        }
        this._eachPainter(function (painter) {
            painter.paint();
        });
    }

    get2DExtent(resources) {
        var extent = new PointExtent();
        this._eachPainter(function (painter) {
            extent = extent.combine(painter.get2DExtent(resources));
        });
        return extent;
    }

    remove() {
        var args = arguments;
        this._eachPainter(function (painter) {
            painter.remove.apply(painter, args);
        });
    }

    setZIndex() {
        var args = arguments;
        this._eachPainter(function (painter) {
            painter.setZIndex.apply(painter, args);
        });
    }

    show() {
        var args = arguments;
        this._eachPainter(function (painter) {
            painter.show.apply(painter, args);
        });
    }

    hide() {
        var args = arguments;
        this._eachPainter(function (painter) {
            painter.hide.apply(painter, args);
        });
    }

    onZoomEnd() {
        var args = arguments;
        this._eachPainter(function (painter) {
            painter.onZoomEnd.apply(painter, args);
        });
    }

    repaint() {
        var args = arguments;
        this._eachPainter(function (painter) {
            painter.repaint.apply(painter, args);
        });
    }

    refreshSymbol() {
        var args = arguments;
        this._eachPainter(function (painter) {
            painter.refreshSymbol.apply(painter, args);
        });
    }

    hasPointSymbolizer() {
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

    removeZoomCache() {
        var args = arguments;
        this._eachPainter(function (painter) {
            painter.removeZoomCache.apply(painter, args);
        });
    }
}
