import { Coordinate, Extent } from "maptalks";
import { mat4 } from 'gl-matrix';
import Mask from "./Mask";

export default function (Base) {
    return class extends Base {

        removeMask(masks) {
            if (!this._maskList) {
                return this;
            }
            if (!masks) {
                this._clearMasks();
                return this;
            }
            const maskList = Array.isArray(masks) ? masks : [masks];
            for (let i = 0; i < maskList.length; i++) {
                const mask = maskList[i];
                const index = this._maskList.indexOf(mask);
                if (index > -1) {
                    this._maskList.splice(index, 1);
                }
            }
            this._updateExtent();
            return this;
        }

        setMask(masks) {
            this.removeMask();
            if (Array.isArray(masks)) {
                this._maskList = masks
            } else {
                this._maskList = [masks];
            }
            this._maskList.forEach(mask => {
                mask['_bindLayer'](this);
            });
            this._updateExtent();
            return this;
        }

        getMasks() {
            return this._maskList;
        }

        _clearMasks() {
            if (!this._maskList) {
                return this;
            }
            this._maskList.forEach(mask => {
                mask.remove();
            });
            this._maskList = [];
            this._updateExtent();
            return this;
        }

        _updateExtent() {
            if (!this._maskList) {
                return;
            }
            const map = this.getMap();
            const renderer = this.getRenderer();
            if (renderer && !this._maskList.length) {
                renderer._clearMask();
                return;
            }
            if (renderer && !this._hasVisibleMask()) {
                renderer._deleteMaskUniforms();
                renderer.setToRedraw();
                return;
            }
            let xmin = Infinity, ymin = Infinity, xmax = -Infinity, ymax = -Infinity, maxheight = -Infinity, minheight = Infinity;
            for (let i = 0; i < this._maskList.length; i++) {
                const mask = this._maskList[i];
                if (!mask.isVisible()) {
                    continue;
                }
                const extent = mask.getExtent();
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
            const { ratio, minHeight } = this._normalizeHeight(minheight, maxheight);
            const extent = new Extent(xmin, ymin, xmax, ymax);
            const { projViewMatrix, mapExtent } = this._getProjViewMatrixInOrtho(extent);
            const extentPointMin = coordinateToWorld(map, new Coordinate(mapExtent.xmin, mapExtent.ymin));
            const extentPointMax = coordinateToWorld(map, new Coordinate(mapExtent.xmax, mapExtent.ymax));
            const extentInWorld = [extentPointMin[0], extentPointMin[1], extentPointMax[0], extentPointMax[1]];
            if (renderer) {
                renderer.setMask(extentInWorld, projViewMatrix, ratio, minHeight);
            } else {
                this.once('renderercreate', e => {
                    e.renderer.setMask(extentInWorld, projViewMatrix, ratio, minHeight);
                });
            }
        }

        _normalizeHeight(minHeight, maxHeight) {
            const min = minHeight === Infinity ? 0 : minHeight;
            const max = maxHeight === -Infinity ? 0 : maxHeight;
            const range = Math.abs(max - min);
            if (range === 0) {
                return { ratio: 1, minHeight: 0};
            }
            const ratio = Math.pow(range, -1);
            return { ratio, minHeight: min };
        }
    
        _getProjViewMatrixInOrtho(extent) {
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

        _hasVisibleMask() {
            for (let i = 0; i < this._maskList.length; i++) {
                if (this._maskList[i].isVisible()) {
                    return true;
                }
            }
            return false;
        }

        _onGeometryEvent(param) {
            if (!param || !param['target']) {
                return;
            }
            const type = param['type'];
            if (type === 'shapechange' && param['target'] instanceof Mask) {
                param['target']._updateShape();
            }
            if (param['target'] instanceof Mask) {
                this._updateExtent();
            }
            if (super['_onGeometryEvent']) {
                super['_onGeometryEvent'](param);
            }
        }
    };
}

function coordinateToWorld(map, coordinate, z = 0) {
    if (!map || !(coordinate instanceof Coordinate)) {
        return null;
    }
    const p = map.coordinateToPointAtRes(coordinate, map.getGLRes());
    return [p.x, p.y, z];
}
