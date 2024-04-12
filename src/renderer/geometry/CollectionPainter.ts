import Class from '../../core/Class';
import PointExtent from '../../geo/PointExtent';
import { BBOX, getDefaultBBOX, resetBBOX, setBBOX, validateBBOX } from '../../core/util/bbox';
import Painter from './Painter';
import Extent from '../../geo/Extent';
import { ResourceCache } from '../layer/CanvasRenderer';
import { Geometries } from '../../geometry'

const TEMP_EXTENT = new PointExtent();

/**
 * @classdesc
 * Painter for collection type geometries
 * @class
 * @private
 */
export default class CollectionPainter extends Class {
    _drawTime: number;

    bbox: BBOX;
    geometry: Geometries;
    isMask: boolean;
    /**
     * @param geometry - geometry to paint
     * @param isMask
     */
    constructor(geometry: Geometries, isMask?: boolean) {
        super();
        this.geometry = geometry;
        this.isMask = isMask;
        this.bbox = getDefaultBBOX();
        this._drawTime = 0;
    }

    _setDrawTime(time: number) {
        this._drawTime = time;
        this._eachPainter((painter: Painter) => {
            painter._setDrawTime(time);
        });
        return this;
    }

    getRenderBBOX(): BBOX {
        const layer = this.getLayer();
        if (layer && layer._drawTime !== this._drawTime) {
            return null;
        }
        resetBBOX(this.bbox);
        this._eachPainter((painter: Painter) => {
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

    _eachPainter(fn: (p: Painter) => void) {
        const geometries = this.geometry.getGeometries();
        let painter: Painter;
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

    paint(extent: Extent) {
        if (!this.geometry) {
            return;
        }
        this._eachPainter((painter: Painter) => {
            painter.paint(extent);
        });
    }

    get2DExtent(resources?: ResourceCache, out?: Extent) {
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
        this._eachPainter((painter: Painter) => {
            painter.remove();
        });
    }

    setZIndex(index: number) {
        this._eachPainter(painter => {
            painter.setZIndex(index);
        });
    }

    show() {
        this._eachPainter(painter => {
            painter.show();
        });
    }

    hide() {
        this._eachPainter(painter => {
            painter.hide();
        });
    }

    repaint() {
        this._eachPainter(painter => {
            painter.repaint();
        });
    }

    refreshSymbol() {
        this._eachPainter(painter => {
            painter.refreshSymbol();
        });
    }

    hasPoint(): boolean {
        let result = false;
        this._eachPainter((painter: Painter) => {
            if (painter.hasPoint()) {
                result = true;
                return false;
            }
            return true;
        });
        return result;
    }

    getMinAltitude(): number {
        let first = true;
        let result = 0;
        this._eachPainter((painter: Painter) => {
            const alt = painter.getMinAltitude();
            if (first || alt < result) {
                first = false;
                result = alt;
            }
        });
        return result;
    }

    getMaxAltitude(): number {
        let result = 0;
        this._eachPainter((painter: Painter) => {
            const alt = painter.getMaxAltitude();
            if (alt > result) {
                result = alt;
            }
        });
        return result;
    }
}
