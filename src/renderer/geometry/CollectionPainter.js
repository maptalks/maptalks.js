import Class from 'core/Class';
import PointExtent from 'geo/PointExtent';

/**
 * @classdesc
 * Painter for collection type geometries
 * @class
 * @protected
 * @param {GeometryCollection} geometry - geometry to paint
 */
export default class CollectionPainter extends Class {
    constructor(geometry) {
        super();
        this.geometry = geometry;
    }

    _eachPainter(fn) {
        const geometries = this.geometry.getGeometries();
        let painter;
        for (let i = 0, len = geometries.length; i < len; i++) {
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
        this._eachPainter(painter => {
            painter.paint();
        });
    }

    get2DExtent(resources) {
        let extent = new PointExtent();
        this._eachPainter(painter => {
            extent = extent.combine(painter.get2DExtent(resources));
        });
        return extent;
    }

    getContainerExtent() {
        let extent = new PointExtent();
        this._eachPainter(painter => {
            extent = extent.combine(painter.getContainerExtent());
        });
        return extent;
    }

    remove() {
        const args = arguments;
        this._eachPainter(painter => {
            painter.remove.apply(painter, args);
        });
    }

    setZIndex() {
        const args = arguments;
        this._eachPainter(painter => {
            painter.setZIndex.apply(painter, args);
        });
    }

    show() {
        const args = arguments;
        this._eachPainter(painter => {
            painter.show.apply(painter, args);
        });
    }

    hide() {
        const args = arguments;
        this._eachPainter(painter => {
            painter.hide.apply(painter, args);
        });
    }

    repaint() {
        const args = arguments;
        this._eachPainter(painter => {
            painter.repaint.apply(painter, args);
        });
    }

    refreshSymbol() {
        const args = arguments;
        this._eachPainter(painter => {
            painter.refreshSymbol.apply(painter, args);
        });
    }

    hasPointSymbolizer() {
        let result = false;
        this._eachPainter(painter => {
            if (painter.hasPointSymbolizer()) {
                result = true;
                return false;
            }
            return true;
        });
        return result;
    }

}
