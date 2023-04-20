import { Coordinate, Extent, Point, VectorLayer } from "maptalks";
import { mat4 } from 'gl-matrix';
import Mask from "./Mask";

const maskLayerEvents = ['shapechange', 'symbolchange', 'heightrangechange', 'flatheightchange'];
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
            if (!this._maskList) {
                this._maskList = [];
            }
            if (Array.isArray(masks)) {
               masks.forEach(mask => {
                this._maskList.push(mask);
               })
            } else {
                this._maskList.push(masks);
            }
            this._maskList.forEach(mask => {
                mask['_bindLayer'](this);
            });
            this._updateExtent('shapechange');
            return this;
        }

        getMasks() {
            return this._maskList;
        }

        _updateExtent(type) {
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
            if (!this._projViewMatrix || type === 'shapechange') { //避免重复计算extent造成性能损失
                const { projViewMatrix, mapExtent } = this._getProjViewMatrixInOrtho(extent);
                this._projViewMatrix = projViewMatrix;
                this._mapExtent = mapExtent;
            }
            const extentPointMin = coordinateToWorld(map, new Coordinate(this._mapExtent.xmin, this._mapExtent.ymin));
            const extentPointMax = coordinateToWorld(map, new Coordinate(this._mapExtent.xmax, this._mapExtent.ymax));
            const extentInWorld = [extentPointMin[0], extentPointMin[1], extentPointMax[0], extentPointMax[1]];
            if (renderer) {
                renderer.setMask(extentInWorld, this._projViewMatrix, ratio, minHeight);
            } else {
                this.once('renderercreate', e => {
                    e.renderer.setMask(extentInWorld, this._projViewMatrix, ratio, minHeight);
                });
            }
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
            if (param['target'] instanceof Mask && maskLayerEvents.indexOf(type) > -1) {
                this._updateExtent(type);
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
            const identifyData = this.identifyAtPoint(point, options, true);
            const pickedPoint = identifyData.length && identifyData[0].point;
            if (pickedPoint) {
                const altitude = map.pointAtResToAltitude(pickedPoint[2], map.getGLRes());
                const coord = map.pointAtResToCoordinate(new Point(pickedPoint[0], pickedPoint[1]), map.getGLRes());
                const coordinate = new Coordinate(coord.x, coord.y, altitude);
                return this._hitMasks(coordinate);
            }
        }

        _hitMasks(coordinate) {
            const masks = this._maskList;
            if (!masks) {
                return null;
            }
            const map = this.getMap();
            const hits = [];
            if (!this._idetifyHelperLayer) {
                const id = this.getId();
                this._idetifyHelperLayer = new VectorLayer(`_${id}_identify_helperlayer`, { visible: false }).addTo(map);
            }
            for (let i = 0; i < masks.length; i++) {
                if (masks[i].containsPoint(coordinate, this._idetifyHelperLayer)) {
                    hits.push(masks[i]);
                }
            }
            return hits;
        }

        remove() {
            if (this._idetifyHelperLayer) {
                this._idetifyHelperLayer.remove();
            }
            if (this._maskList && this._maskList.length) {
                this._maskList.forEach(mask => {
                    mask.remove();
                });
            }
            super.remove();
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
