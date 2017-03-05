import { isArrayHasData } from 'core/util';
import CanvasRenderer from 'renderer/layer/CanvasRenderer';

/**
 * @classdesc
 * A parent renderer class for OverlayLayer to inherit by OverlayLayer's subclasses.
 * @protected
 * @memberOf renderer
 * @name OverlayLayerCanvasRenderer
 * @extends renderer.CanvasRenderer
 */
class OverlayLayerRenderer extends CanvasRenderer {

    // geometries can be: true | [geometries] | null
    // true: check layer's all geometries if the checking is the first time.
    // [geometries] : the additional geometries needs to be checked.
    // null : no checking.
    //
    // possible memory leaks:
    // 1. if geometries' symbols with external resources change frequently,
    // resources of old symbols will still be stored.
    // 2. removed geometries' resources won't be removed.
    checkResources(geometries) {
        if (!this._resourceChecked && !Array.isArray(geometries)) {
            geometries = this.layer._geoList;
        }
        if (!isArrayHasData(geometries)) {
            return [];
        }
        var me = this,
            resources = [];
        var res;

        function checkGeo(geo) {
            res = geo._getExternalResources();
            if (!res.length) {
                return;
            }
            if (!me.resources) {
                resources = resources.concat(res);
            } else {
                for (let i = 0; i < res.length; i++) {
                    if (!me.resources.isResourceLoaded(res[i])) {
                        resources.push(res[i]);
                    }
                }
            }
        }

        for (let i = geometries.length - 1; i >= 0; i--) {
            checkGeo(geometries[i]);
        }
        this._resourceChecked = true;
        return resources;
    }

    onGeometryAdd(geometries) {
        this.render(geometries);
    }

    onGeometryRemove() {
        this.render();
    }

    onGeometrySymbolChange(e) {
        this.render([e.target]);
    }

    onGeometryShapeChange() {
        this.render();
    }

    onGeometryPositionChange() {
        this.render();
    }

    onGeometryZIndexChange() {
        this.render();
    }

    onGeometryShow() {
        this.render();
    }

    onGeometryHide() {
        this.render();
    }

    onGeometryPropertiesChange() {
        this.render();
    }
}

export default OverlayLayerRenderer;
