/**
 * @classdesc
 * A layer for managing and rendering geometrie.
 * @class
 * @category layer
 * @extends {maptalks.OverlayLayer}
 * @param {String|Number} id - layer's id
 * @param {Object} [options=null] - construct options
 * @param {Boolean} [options.debug=false] - whether the geometries on the layer is in debug mode.
 * @param {Boolean} [options.enableSimplify=false] - whether to simplify geometries before rendering.
 * @param {String} [options.cursor=default] - the cursor style of the layer
 * @param {Boolean} [options.geometryEvents=true] - enable/disable firing geometry events
 * @param {Number} [options.thresholdOfPointUpdate=50] - threshold of points number to update points while transforming.
 * @param {String} [options.renderer=canvas] - renderer type. Don't change it if you are not sure about it. About renderer, see [TODO]{@link tutorial.renderer}.
 * @param {*} options.* - any other option defined in [maptalks.Layer]{@link maptalks.Layer#options}
 */
Z.VectorLayer=Z.OverlayLayer.extend(/** @lends maptalks.VectorLayer.prototype */{
    type : 'vector',

    options:{
        'debug'                     : false,
        'enableSimplify'            : true,
        'cursor'                    : 'pointer',
        'geometryEvents'            : true,
        'thresholdOfPointUpdate'   : 50,
        'renderer'                  : 'canvas'
    },

    initialize:function(id, options) {
        this.setId(id);
        Z.Util.setOptions(this, options);

    },

    /**
     * load the layer
     * @return {maptalks.VectorLayer} this
     */
    load:function() {
        var renderer = this._getRenderer();
        if (!renderer) {
            this._initRenderer();
            renderer = this._getRenderer();
            renderer.setZIndex(this.getZIndex());
        }
        renderer.render();
        return this;
    },


    /**
     * Called when geometry is being removed to clear the context concerned.
     * @param  {maptalks.Geometry} geometry - the geometry instance to remove
     * @private
     */
    _onGeometryRemove:function(geometry) {
        if (!geometry) {return;}
        //考察geometry是否属于该图层
        if (this != geometry.getLayer()) {
            return;
        }
        var internalId = geometry._getInternalId();
        if (Z.Util.isNil(internalId)) {
            return;
        }
        var geoId = geometry.getId();
        if (!Z.Util.isNil(geoId)) {
            delete this._geoMap[geoId];
        }
        delete this._geoCache[internalId];
        this._counter--;
        if (this.isCanvasRender()) {
            this._getRenderer().render();
        }
    }
});

Z.Util.extend(Z.VectorLayer,Z.Renderable);
