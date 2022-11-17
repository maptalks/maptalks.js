import { Coordinate, Extent } from "maptalks";
import { mat4 } from 'gl-matrix';
import { normalizeColor } from '../util/util.js';

const maskModeMap = {
    'clip-inside': 0.1, 'clip-outside': 0.2, 'flat-inside': 0.3, 'flat-outside': 0.4, 'color': 0.5
};
export default function (Base) {
    return class extends Base {
        setMask(masks) {
            if (!masks) {
                this._clearMask();
                return;
            }
            const renderer = this.getRenderer();
            const map = this.getMap();
            const maskObjects = [];
            let xmin = Infinity, ymin = Infinity, xmax = -Infinity, ymax = -Infinity, maxheight = -Infinity, minheight = Infinity;
            for (let idx = 0; idx < masks.length; idx++) {
                const mask = masks[idx];
                const polygons = mask.polygons;
                for (let i = 0; i < polygons.length; i++) {
                    const polygon = polygons[i];
                    const worldPositions = polygon.getCoordinates()[0].map(coord => {
                        return coordinateToWorld(map, coord);
                    });
                    const symbol = polygon.getSymbol();
                    const { polygonFill, polygonOpacity } = symbol;
                    const maskColor = normalizeColor([], polygonFill);
                    maskColor[3] = polygonOpacity || 0.6;
                    const maskObject = {
                        maskColor,
                        position: worldPositions,
                        maskMode: this._getMaskMode(mask.mode),
                        flatHeight: this._altitudeToPoint(mask.flatHeight) || 0,
                        heightRange: mask.heightRange ? [this._altitudeToPoint(mask.heightRange[0]), this._altitudeToPoint(mask.heightRange[1])] : [0, 0]
                    };
                    maskObjects.push(maskObject);
                    const extent = polygon.getExtent();
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
                    if (maskObject.heightRange[0] < minheight) {
                        minheight = maskObject.heightRange[0];
                    }
                    if (maskObject.heightRange[1] > maxheight) {
                        maxheight = maskObject.heightRange[1];
                    }
                    if (maskObject.flatHeight < minheight) {
                        minheight = maskObject.flatHeight;
                    }
                    if (maskObject.flatHeight > maxheight) {
                        maxheight = maskObject.flatHeight;
                    }
                }
            }
            const { ratio, minHeight } = this._normalizeHeight(maskObjects, minheight, maxheight);
            const extent = new Extent(xmin, ymin, xmax, ymax);
            const { projViewMatrix, mapExtent } = this._getProjViewMatrixInOrtho(extent);
            const extentPointMin = coordinateToWorld(map, new Coordinate(mapExtent.xmin, mapExtent.ymin));
            const extentPointMax = coordinateToWorld(map, new Coordinate(mapExtent.xmax, mapExtent.ymax));
            const extentInWorld = [extentPointMin[0], extentPointMin[1], extentPointMax[0], extentPointMax[1]];
            if (renderer) {
                renderer.setMask(maskObjects, extentInWorld, projViewMatrix, ratio, minHeight);
            } else {
                this.once('renderercreate', e => {
                    e.renderer.setMask(maskObjects, extentInWorld, projViewMatrix, ratio, minHeight);
                });
            }
        }
    
        _clearMask() {
            const renderer = this.getRenderer();
            if (renderer) {
                renderer.clearMask();
            } else {
                this.once('renderercreate', e => {
                    e.renderer.clearMask();
                });
            }
        }
    
        _normalizeHeight(maskObjects, minHeight, maxheight) {
            const min = minHeight;
            const max = maxheight;
            const range = Math.abs(max - min);
            if (range === 0) {
                return { ratio: 1, minHeight: 0};
            }
            const ratio = Math.pow(range, -1);
            for (let i = 0; i < maskObjects.length; i++) {
                maskObjects[i].flatHeight = (maskObjects[i].flatHeight - min) * ratio;
                maskObjects[i].heightRange[0] = (maskObjects[i].heightRange[0] - min) * ratio;
                maskObjects[i].heightRange[1] = (maskObjects[i].heightRange[1] - min) * ratio;
            }
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
    
        _getMaskMode(mode) {
            if (!maskModeMap[mode]) {
                throw new Error('invalid mask mode type!');
            }
            return maskModeMap[mode];
        }

        _altitudeToPoint(altitude = 0) {
            const map = this.getMap();
            const res = map.getGLRes();
            return map.altitudeToPoint(altitude, res);
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
