import { Coordinate, Extent } from "maptalks";
import { mat4 } from 'gl-matrix';
import Mask from "./Mask";
import { extend } from "../util/util";

const maskLayerEvents = ['shapechange', 'symbolchange', 'heightrangechange', 'flatheightchange'];
const COORD_EXTENT = new Coordinate(0, 0);
const EXTENT_MIN = [], EXTENT_MAX = [];

function updateExtent(type) {
    if (!this['_maskList']) {
        return;
    }
    const map = this.getMap();
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
    let xmin = Infinity, ymin = Infinity, xmax = -Infinity, ymax = -Infinity, maxheight = -Infinity, minheight = Infinity;
    for (let i = 0; i < this['_maskList'].length; i++) {
        const mask = this['_maskList'][i];
        if (!mask.isVisible()) {
            continue;
        }
        const extent = mask.getExtent();
        if (!extent) {
            return;
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
    if (!this['_projViewMatrix'] || type === 'shapechange') { //避免重复计算extent造成性能损失
        const { projViewMatrix, mapExtent } = getProjViewMatrixInOrtho.call(this, extent);
        this['_projViewMatrix'] = projViewMatrix;
        this['_mapExtent'] = mapExtent;
    }
    const mapExtent = this['_mapExtent'];
    const projViewMatrix = this['_projViewMatrix'];
    COORD_EXTENT.x = mapExtent.xmin;
    COORD_EXTENT.y = mapExtent.ymin;
    const extentPointMin = coordinateToWorld(EXTENT_MIN, COORD_EXTENT, map);
    COORD_EXTENT.x = mapExtent.xmax;
    COORD_EXTENT.y = mapExtent.ymax;
    const extentPointMax = coordinateToWorld(EXTENT_MAX, COORD_EXTENT, map);
    const extentInWorld = [extentPointMin[0], extentPointMin[1], extentPointMax[0], extentPointMax[1]];
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
            });
            updateExtent.call(this, 'shapechange');
            return this;
        }

        getMasks() {
            return this['_maskList'];
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
                return null;
            }
            const opts = extend({}, options);
            opts['excludeMasks'] = true; //此处调用identifyAtPoint时，不需要去identifyMask
            const identifyData = this.identifyAtPoint(point, opts);
            const coordinate = identifyData.length && identifyData[0].coordinate;
            if (coordinate) {
                return this['_hitMasks'](coordinate);
            }
            return null;
        }

        _hitMasks(coordinate) {
            const masks = this['_maskList'];
            if (!masks) {
                return null;
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
