import Class from '../../core/Class';
import PointExtent from '../../geo/PointExtent';

/**
 * @classdesc
 * Painter for collection type geometries
 * @class
 * @private
 */
export default class CollectionPainter extends Class {
    /**
     * @param {GeometryCollection} geometry - geometry to paint
     */
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

    paint(extent) {
        if (!this.geometry) {
            return;
        }
        this._eachPainter(painter => {
            painter.paint(extent);
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

    hasPoint() {
        let result = false;
        this._eachPainter(painter => {
            if (painter.hasPoint()) {
                result = true;
                return false;
            }
            return true;
        });
        return result;
    }

    getMinAltitude() {
        let first = true;
        let result = 0;
        this._eachPainter(painter => {
            const alt = painter.getMinAltitude();
            if (first || alt < result) {
                first = false;
                result = alt;
            }
        });
        return result;
    }

    getMaxAltitude() {
        let result = 0;
        this._eachPainter(painter => {
            const alt = painter.getMaxAltitude();
            if (alt > result) {
                result = alt;
            }
        });
        return result;
    }

}
