/**
 * @classdesc
 * A layer for managing and rendering geometrie.
 * @class
 * @extends {maptalks.OverlayLayer}
 * @param {String|Number} id - layer's id
 * @param {Object} [options=null] - construct options, including the options defined in [maptalks.Layer]{@link maptalks.Layer#options}
 */
Z.VectorLayer=Z.OverlayLayer.extend(/** @lends maptalks.VectorLayer.prototype */{
    type : 'vector',

    options:{
        'debug'                     : false,
        'enableSimplify'            : true,
        'cursor'                    : 'pointer',
        'geometryEvents'            : true,
        'thresholdOfEcoTransform'   : 50,
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
