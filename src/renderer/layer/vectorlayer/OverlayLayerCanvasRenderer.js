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
    checkResources() {
        var geometries = this._geosToCheck;
        if (!this._resourceChecked && !geometries) {
            geometries = this.layer._geoList;
        }
        if (!isArrayHasData(geometries)) {
            return [];
        }
        var me = this,
            resources = [];

        function checkGeo(geo) {
            var res = geo._getExternalResources();
            if (!res.length) {
                return;
            }
            if (!me.resources) {
                resources.push.apply(resources, res);
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
        delete this._geosToCheck;
        return resources;
    }

    _addGeoToCheckRes(res) {
        if (!res) {
            return;
        }
        if (!this._geosToCheck) {
            this._geosToCheck = [];
        }
        this._geosToCheck.push.apply(this._geosToCheck, res);
    }

    onGeometryAdd(geometries) {
        if (geometries) {
            if (!Array.isArray(geometries)) {
                geometries = [geometries];
            }
            this._addGeoToCheckRes(geometries);
        }

        this.render();
    }

    onGeometryRemove() {
        this.render();
    }

    onGeometrySymbolChange(e) {
        this._addGeoToCheckRes([e.target]);
        this.render();
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
