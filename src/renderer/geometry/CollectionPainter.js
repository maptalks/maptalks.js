import Class from '../../core/Class';
import PointExtent from '../../geo/PointExtent';
import { getDefaultBBOX, resetBBOX, setBBOX, validateBBOX } from '../../core/util/bbox';

const TEMP_EXTENT = new PointExtent();

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
    constructor(geometry, isMask) {
        super();
        this.geometry = geometry;
        this.isMask = isMask;
        this.bbox = getDefaultBBOX();
        this._drawTime = 0;
    }

    _setDrawTime(time) {
        this._drawTime = time;
        this._eachPainter((painter) => {
            painter._setDrawTime(time);
        });
        return this;
    }

    getRenderBBOX() {
        const layer = this.getLayer();
        if (layer && layer._drawTime !== this._drawTime) {
            return null;
        }
        resetBBOX(this.bbox);
        this._eachPainter((painter) => {
            const bbox = painter.getRenderBBOX();
            if (!validateBBOX(bbox)) {
                return;
            }
            setBBOX(this.bbox, bbox);
        });
        if (validateBBOX(this.bbox)) {
            return this.bbox;
        }
        return null;
    }


    _eachPainter(fn) {
        const geometries = this.geometry.getGeometries();
        let painter;
        for (let i = 0, len = geometries.length; i < len; i++) {
            painter = this.isMask ? geometries[i]._getMaskPainter() : geometries[i]._getPainter();
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

    getLayer() {
        return this.geometry && this.geometry.getLayer();
    }


    paint(extent) {
        if (!this.geometry) {
            return;
        }
        this._eachPainter(painter => {
            painter.paint(extent);
        });
    }

    get2DExtent(resources, out) {
        if (out) {
            out.set(null, null, null, null);
        }
        // const extent = out || new PointExtent();
        // const geometries = this.geometry.getGeometries();
        // for (let i = 0, len = geometries.length; i < len; i++) {
        //     extent._combine(geometries[i].get2DExtent());
        // }
        // return extent;
        let extent = out || new PointExtent();
        this._eachPainter(painter => {
            extent = extent._combine(painter.get2DExtent(resources, TEMP_EXTENT));
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
