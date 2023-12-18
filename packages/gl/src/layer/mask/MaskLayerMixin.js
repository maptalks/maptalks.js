import { Coordinate, Extent } from "maptalks";
import { mat4 } from 'gl-matrix';
import Mask from "./Mask";
import { extend } from "../util/util";

const maskLayerEvents = ['shapechange', 'symbolchange', 'heightrangechange', 'flatheightchange'];
const COORD_EXTENT = new Coordinate(0, 0);
const EXTENT_MIN = [], EXTENT_MAX = [];
const TEMP_COORD0 = new Coordinate(0, 0), TEMP_COORD1 = new Coordinate(0, 0);

function updateExtent() {
    if (!this['_maskList']) {
        return;
    }
    const map = this.getMap();
    if (!map) {
        return;
    }
    const renderer = this.getRenderer();
    if (renderer && !this['_maskList'].length) {
        renderer['_clearMask']();
        return;
    }
    if (renderer && !hasVisibleMask.call(this)) {
        renderer['_deleteMaskUniforms']();
        renderer.setToRedraw();
        return;
    }
    const { extent, ratio, minHeight } = this.getMaskExtent();
    const { projViewMatrix, extentInWorld } = this.updateMask(extent);
    if (renderer) {
        renderer.setMask(extentInWorld, projViewMatrix, ratio, minHeight);
    } else {
        this.once('renderercreate', e => {
            e.renderer.setMask(extentInWorld, projViewMatrix, ratio, minHeight);
        });
    }
}

function clearMasks() {
    if (!this['_maskList']) {
        return this;
    }
    this['_maskList'].forEach(mask => {
        mask.remove();
    });
    this['_maskList'] = [];
    updateExtent.call(this);
    return this;
}

function normalizeHeight(minHeight, maxHeight) {
    const min = minHeight === Infinity ? 0 : minHeight;
    const max = maxHeight === -Infinity ? 0 : maxHeight;
    const range = Math.abs(max - min);
    if (range === 0) {
        return { ratio: 1, minHeight: 0};
    }
    const ratio = Math.pow(range, -1);
    return { ratio, minHeight: min };
}

function getProjViewMatrixInOrtho(extent) {
    const map = this.getMap();
    const preView = map.getView();
    const zoom = map.getFitZoom(extent);
    const center = extent.getCenter();
    map.setView({ center, zoom, pitch: 0, bearing: 0 });
    const mapExtent = map.getExtent();
    const pvMatrix = mat4.copy([], map.projViewMatrix);
    map.setView(preView);
    return { mapExtent, projViewMatrix: pvMatrix };
}

function hasVisibleMask() {
    for (let i = 0; i < this['_maskList'].length; i++) {
        if (this['_maskList'][i].isVisible()) {
            return true;
        }
    }
    return false;
}

export default function (Base) {
    return class extends Base {

        removeMask(masks) {
            if (!this['_maskList']) {
                return this;
            }
            if (!masks) {
                clearMasks.call(this);
                return this;
            }
            const maskList = Array.isArray(masks) ? masks : [masks];
            for (let i = 0; i < maskList.length; i++) {
                const mask = maskList[i];
                const index = this['_maskList'].indexOf(mask);
                if (index > -1) {
                    this['_maskList'].splice(index, 1);
                }
            }
            updateExtent.call(this);
            return this;
        }

        setMask(masks) {
            this.removeMask();
            if (!this['_maskList']) {
                this['_maskList'] = [];
            }
            if (Array.isArray(masks)) {
                masks.forEach(mask => {
                    this['_maskList'].push(mask);
                });
            } else {
                this['_maskList'].push(masks);
            }
            this['_maskList'].forEach(mask => {
                mask['_bindLayer'](this);
                if (mask._updateCoordinates) {
                    mask._updateCoordinates();
                }
            });
            updateExtent.call(this, 'shapechange');
            return this;
        }

        onAdd() {
            super.onAdd();
            updateExtent.call(this, 'shapechange');
        }

        getMasks() {
            return this['_maskList'] || [];
        }

        _onGeometryEvent(param) {
            if (!param || !param['target']) {
                return;
            }
            const type = param['type'];
            if (type === 'shapechange' && param['target'] instanceof Mask) {
                param['target']._updateShape();
            }
            if (param['target'] instanceof Mask && maskLayerEvents.indexOf(type) > -1) {
                updateExtent.call(this, type);
            }
            if (super['_onGeometryEvent']) {
                super['_onGeometryEvent'](param);
            }
        }

        identifyMask(point, options) {
            const map = this.getMap();
            if (!map) {
                return [];
            }
            if (!this['_maskList'] || !this['_maskList'].length) {
                return [];
            }
            const opts = extend({}, options);
            opts['excludeMasks'] = true; //此处调用identifyAtPoint时，不需要去identifyMask
            const identifyData = this.identifyAtPoint(point, opts);
            const coordinate = identifyData.length && identifyData[0].coordinate;
            if (coordinate) {
                return this['_hitMasks'](coordinate);
            }
            return [];
        }

        _hitMasks(coordinate) {
            const masks = this['_maskList'];
            if (!masks) {
                return [];
            }
            const hits = [];
            for (let i = 0; i < masks.length; i++) {
                const maskMode = masks[i].getMode();
                if (masks[i].containsPoint(coordinate) && (maskMode === 'color' || maskMode === 'video')) {
                    hits.push(masks[i]);
                }
            }
            return hits;
        }

        remove() {
            if (this['_maskList'] && this['_maskList'].length) {
                this['_maskList'].forEach(mask => {
                    mask.remove();
                });
            }
            super.remove();
        }

        updateMask(extent) {
            const map = this.getMap();
            const { projViewMatrix, mapExtent } = getProjViewMatrixInOrtho.call(this, extent);
            COORD_EXTENT.x = mapExtent.xmin;
            COORD_EXTENT.y = mapExtent.ymin;
            const extentPointMin = coordinateToWorld(EXTENT_MIN, COORD_EXTENT, map);
            COORD_EXTENT.x = mapExtent.xmax;
            COORD_EXTENT.y = mapExtent.ymax;
            const extentPointMax = coordinateToWorld(EXTENT_MAX, COORD_EXTENT, map);
            const extentInWorld = [extentPointMin[0], extentPointMin[1], extentPointMax[0], extentPointMax[1]];
            return { projViewMatrix, extentInWorld };
        }

        getMaskExtent() {
            let xmin = Infinity, ymin = Infinity, xmax = -Infinity, ymax = -Infinity, maxheight = -Infinity, minheight = Infinity;
            for (let i = 0; i < this['_maskList'].length; i++) {
                const mask = this['_maskList'][i];
                if (!mask.isVisible()) {
                    continue;
                }
                const extent = mask.getExtent();
                if (!extent || !this._inMapExtent(extent)) {
                    continue;
                }
                if (extent.xmin < xmin) {
                    xmin = extent.xmin;
                }
                if (extent.ymin < ymin) {
                    ymin = extent.ymin;
                }
                if (extent.xmax > xmax) {
                    xmax = extent.xmax;
                }
                if (extent.ymax > ymax) {
                    ymax = extent.ymax;
                }
                if (mask._getHeightRange) {
                    const heightRange = mask._getHeightRange();
                    if (heightRange[0] < minheight) {
                        minheight = heightRange[0];
                    }
                    if (heightRange[1] > maxheight) {
                        maxheight = heightRange[1];
                    }
                }
            }
            const { ratio, minHeight } = normalizeHeight(minheight, maxheight);
            const extent = new Extent(xmin, ymin, xmax, ymax);
            return { extent, ratio, minHeight };
        }

        _inMapExtent(extent) {
            const map = this.getMap();
            const glRes = map.getGLRes();
            TEMP_COORD0.set(extent.xmin, extent.ymin);
            TEMP_COORD1.set(extent.xmin, extent.ymin);
            const pointMin = map.coordinateToPointAtRes(TEMP_COORD0, glRes);
            const pointMax = map.coordinateToPointAtRes(TEMP_COORD1, glRes);
            const maskExtent = new Extent(pointMin.x, pointMin.y, pointMax.x, pointMax.y);
            const mapExtent = map['_get2DExtentAtRes'](glRes);
            return mapExtent.intersects(maskExtent);
        }
    };
}

function coordinateToWorld(out, coordinate, map, z = 0) {
    if (!map || !(coordinate instanceof Coordinate)) {
        return null;
    }
    const p = map.coordinateToPointAtRes(coordinate, map.getGLRes());
    out[0] = p.x;
    out[1] = p.y;
    out[2] = z;
    return out;
}
