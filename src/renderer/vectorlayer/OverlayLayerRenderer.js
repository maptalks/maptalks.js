import { isArray, isArrayHasData } from 'core/util';
import CanvasRenderer from 'renderer/CanvasRenderer';

/**
 * @classdesc
 * A parent renderer class for OverlayLayer to inherit by OverlayLayer's subclasses.
 * @class
 * @protected
 * @memberOf renderer.overlaylayer
 * @name Canvas
 * @extends {renderer.Canvas}
 */
export default class OverlayLayerRenderer extends CanvasRenderer {

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
        if (!this._resourceChecked && !isArray(geometries)) {
            geometries = this.layer._geoList;
        }
        if (!geometries || !isArrayHasData(geometries)) {
            return [];
        }
        var me = this,
            resources = [];
        var res;

        function checkGeo(geo) {
            res = geo._getExternalResources();
            if (!isArrayHasData(res)) {
                return;
            }
            if (!me.resources) {
                resources = resources.concat(res);
            } else {
                for (var ii = 0; ii < res.length; ii++) {
                    if (!me.resources.isResourceLoaded(res[ii])) {
                        resources.push(res[ii]);
                    }
                }
            }
        }

        for (var i = geometries.length - 1; i >= 0; i--) {
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
