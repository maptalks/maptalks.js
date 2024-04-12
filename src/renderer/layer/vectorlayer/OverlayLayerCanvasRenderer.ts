import { isArrayHasData, pushIn } from '../../../core/util';
import { type Geometry } from '../../../geometry';
import CanvasRenderer from '../CanvasRenderer';
import { Geometries } from '../../../geometry';
import Extent from '../../../geo/Extent';

interface MapStateCacheType {
    resolution: number;
    pitch: number;
    bearing: number;
    glScale: number;
    glRes: number;
    _2DExtent: Extent;
    glExtent: Extent;
    containerExtent: Extent;
    offset: number;
}

/**
 * OverlayLayer 的父呈现器类，供 OverlayLayer 的子类继承。
 *
 * @english
 *
 * A parent renderer class for OverlayLayer to inherit by OverlayLayer's subclasses.
 * @protected
 * @memberOf renderer
 * @name OverlayLayerCanvasRenderer
 * @extends renderer.CanvasRenderer
 */
class OverlayLayerRenderer extends CanvasRenderer {
    _geosToCheck: Geometries[];
    _resourceChecked: boolean;
    clearImageData?(): void;
    _lastGeosToDraw: Geometry[];
    mapStateCache: MapStateCacheType;

    /**
     * @english
     * possible memory leaks:
     * 1. if geometries' symbols with external resources change frequently,
     * resources of old symbols will still be stored.
     * 2. removed geometries' resources won't be removed.
     */
    checkResources() {
        const geometries = this._geosToCheck || [];
        if (!this._resourceChecked && this.layer._geoList) {
            pushIn(geometries, this.layer._geoList);
        }
        if (!isArrayHasData(geometries)) {
            return [];
        }
        const resources = [];
        const cache = {};

        for (let i = geometries.length - 1; i >= 0; i--) {
            const geo = geometries[i];
            const res = geo._getExternalResources();
            if (!res.length) {
                continue;
            }
            if (!this.resources) {
                // @tip 解构会有一定的性能影响，对于少量数据是否可以忽略
                resources.push(...res);
            } else {
                for (let i = 0; i < res.length; i++) {
                    const url = res[i][0];
                    if (!this.resources.isResourceLoaded(res[i]) && !cache[url]) {
                        resources.push(res[i]);
                        cache[url] = 1;
                    }
                }
            }
        }
        this._resourceChecked = true;
        delete this._geosToCheck;
        return resources;
    }

    render(...args: any[]): void {
        this.layer._sortGeometries();
        return super.render.apply(this, args);
    }

    _addGeoToCheckRes(res: Geometries | Geometries[]) {
        if (!res) {
            return;
        }
        if (!Array.isArray(res)) {
            res = [res];
        }
        if (!this._geosToCheck) {
            this._geosToCheck = [];
        }
        pushIn<any>(this._geosToCheck, res);
    }

    onGeometryAdd(geometries: Geometries | Geometries[]) {
        this._addGeoToCheckRes(geometries);
        redraw(this);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onGeometryRemove(params: any) {
        redraw(this);
    }

    onGeometrySymbolChange(e: { target: Geometries; }) {
        this._addGeoToCheckRes(e.target);
        redraw(this);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onGeometryShapeChange(params: any) {
        redraw(this);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onGeometryPositionChange(params: any) {
        redraw(this);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onGeometryZIndexChange(params: any) {
        redraw(this);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onGeometryShow(params: any) {
        redraw(this);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onGeometryHide(params: any) {
        redraw(this);
    }

    onGeometryPropertiesChange(_: any) {
        redraw(this);
    }
}

function redraw(renderer: OverlayLayerRenderer): void {
    if (renderer.layer.options['drawImmediate']) {
        renderer.render();
    }
    renderer.setToRedraw();
}

export default OverlayLayerRenderer;
