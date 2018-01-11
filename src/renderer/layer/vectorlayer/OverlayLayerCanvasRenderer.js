import { isArrayHasData, pushIn } from '../../../core/util';
import CanvasRenderer from '../CanvasRenderer';

/**
 * @classdesc
 * A parent renderer class for OverlayLayer to inherit by OverlayLayer's subclasses.
 * @protected
 * @memberOf renderer
 * @name OverlayLayerCanvasRenderer
 * @extends renderer.CanvasRenderer
 */
class OverlayLayerRenderer extends CanvasRenderer {

    // possible memory leaks:
    // 1. if geometries' symbols with external resources change frequently,
    // resources of old symbols will still be stored.
    // 2. removed geometries' resources won't be removed.
    checkResources() {
        let geometries = this._geosToCheck;
        if (!this._resourceChecked && !geometries) {
            geometries = this.layer._geoList;
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
                resources.push.apply(resources, res);
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

    render() {
        this.layer._sortGeometries();
        return super.render.apply(this, arguments);
    }

    _addGeoToCheckRes(res) {
        if (!res) {
            return;
        }
        if (!Array.isArray(res)) {
            res = [res];
        }
        if (!this._geosToCheck) {
            this._geosToCheck = [];
        }
        pushIn(this._geosToCheck, res);
    }

    onGeometryAdd(geometries) {
        this._addGeoToCheckRes(geometries);
        redraw(this);
    }

    onGeometryRemove() {
        redraw(this);
    }

    onGeometrySymbolChange(e) {
        this._addGeoToCheckRes(e.target);
        redraw(this);
    }

    onGeometryShapeChange() {
        redraw(this);
    }

    onGeometryPositionChange() {
        redraw(this);
    }

    onGeometryZIndexChange() {
        redraw(this);
    }

    onGeometryShow() {
        redraw(this);
    }

    onGeometryHide() {
        redraw(this);
    }

    onGeometryPropertiesChange() {
        redraw(this);
    }
}

function redraw(renderer) {
    if (renderer.layer.options['drawImmediate']) {
        renderer.render();
    }
    renderer.setToRedraw();
}

export default OverlayLayerRenderer;
