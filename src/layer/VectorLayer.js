Z.VectorLayer=Z.OverlayLayer.extend({
    type : 'vector',

    options:{
        'debug'                     : false,
        'enableSimplify'            : true,
        'cursor'                    : 'pointer',
        'geometryEvents'            : true,
        'thresholdOfEcoTransform'   : 50,
        'renderer'                  : 'canvas'
    },

    /**
     * 构造函数
     * @param  {String} id 图层identifier
     */
    initialize:function(id, options) {
        this.setId(id);
        Z.Util.setOptions(this, options);

    },

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
     * 当geometry被移除时触发
     * @param  {[type]} geometry [description]
     * @return {[type]}          [description]
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
