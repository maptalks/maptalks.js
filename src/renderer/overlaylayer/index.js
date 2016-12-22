import { isArray, isArrayHasData } from 'core/util';
import { Canvas as Renderer } from 'renderer';

/**
 * @classdesc
 * A parent renderer class for OverlayLayer to inherit by OverlayLayer's subclasses.
 * @class
 * @protected
 * @memberOf renderer.overlaylayer
 * @name Canvas
 * @extends {renderer.Canvas}
 */
export const Canvas = Renderer.extend({

    // geometries can be: true | [geometries] | null
    // true: check layer's all geometries if the checking is the first time.
    // [geometries] : the additional geometries needs to be checked.
    // null : no checking.
    //
    // possible memory leaks:
    // 1. if geometries' symbols with external resources change frequently,
    // resources of old symbols will still be stored.
    // 2. removed geometries' resources won't be removed.
    checkResources: function (geometries) {
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
    },

    onGeometryAdd: function (geometries) {
        this.render(geometries);
    },

    onGeometryRemove: function () {
        this.render();
    },

    onGeometrySymbolChange: function (e) {
        this.render([e.target]);
    },

    onGeometryShapeChange: function () {
        this.render();
    },

    onGeometryPositionChange: function () {
        this.render();
    },

    onGeometryZIndexChange: function () {
        this.render();
    },

    onGeometryShow: function () {
        this.render();
    },

    onGeometryHide: function () {
        this.render();
    },

    onGeometryPropertiesChange: function () {
        this.render();
    }
});
