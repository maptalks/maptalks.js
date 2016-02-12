/**
 * 所有图层的基类
 * 供Map调用的图层方法有:
 * @class maptalks.Layer
 * @extends maptalks.Class
 * @mixins maptalks.Eventable
 * @author Maptalks Team
 */
Z['Layer']=Z.Layer=Z.Class.extend({

    includes: Z.Eventable,


    options:{
        //最大最小可视范围, -1表示不受限制
        'minZoom':-1,
        'maxZoom':-1,
        //图层是否可见
        'visible':true,
        'opacity': 1
    },




    /**
     * 将图层加到地图上
     * @param {Map} map 地图
     */
    addTo:function(map) {
        map.addLayer(this);
        return this;
    },

    /**
     * 设置图层z-index叠加顺序
     * @param {Number} zIndex 叠加顺序
     */
    setZIndex:function(zIndex) {
        this._zIndex = zIndex;
        if (this.map) {
            var layerList = this._getLayerList();
            this.map._sortLayersByZIndex(layerList);
        }
        if (this._renderer) {
            this._renderer.setZIndex(zIndex);
        }
        return this;
    },

    getZIndex:function() {
        return this._zIndex;
    },

    /**
     * 获取图层id
     * @returns
     * @expose
     */
    getId:function() {
        return this._id;
    },

    /**
     * 设置图层id
     * @param {String} [id] [图层id]
     * @expose
     */
    setId:function(id) {
        //TODO 设置id可能造成map无法找到layer
        this._id = id;
        this.fire('idchange');
        return this;
    },

    /**
     * 是否用Canvas渲染
     * @return {Boolean}
     * @expose
     */
    isCanvasRender:function() {
        var renderer = this._getRenderer();
        if (renderer) {
            return renderer.isCanvasRender();
        }
        return false;
    },

    /**
     * 获取图层所属的地图对象
     * @expose
     * @returns {seegoo.maps.Map}
     */
    getMap:function() {
        if (this.map) {
            return this.map;
        }
        return null;
    },


    /**
     * 获取图层的Extent
     * @return {Extent} 图层的Extent
     */
    getExtent:function() {
        if (!this.extent) {return null;}
        return this.extent;
    },

    /**
     * 将图层置顶
     * @expose
     */
    bringToFront:function() {
        var layers = this._getLayerList();
        if (!layers) {
            return this;
        }
        var topLayer = layers[layers.length-1];
        if (layers.length === 1 || topLayer === this) {
            return this;
        }
        var max = topLayer.getZIndex();
        this.setZIndex(max+1);
        return this;
    },

    /**
     * 将图层置底
     * @expose
     */
    bringToBack:function(){
        var layers = this._getLayerList();
        if (!layers) {
            return this;
        }
        var bottomLayer = layers[0];
        if (layers.length === 1 || bottomLayer === this) {
            return this;
        }
        var min = bottomLayer.getZIndex();
        this.setZIndex(min-1);
        return this;
    },

    /**
     * 显示图层
     */
    show:function() {
        if (!this.options['visible']) {
            this.options['visible'] = true;
            if (this._getRenderer()) {
                this._getRenderer().show();
            }
        }
        return this;
    },

    /**
     * 隐藏图层
     */
    hide:function() {
        if (this.options['visible']) {
            this.options['visible'] = false;
            if (this._getRenderer()) {
                this._getRenderer().hide();
            }
        }
        return this;
    },

    /**
     * 瓦片图层是否可见
     * @return {Boolean} true/false
     */
    isVisible:function() {
        if (Z.Util.isNumber(this.options['opacity']) && this.options['opacity'] <= 0) {
            return false;
        }
        var map = this.getMap();
        if (map) {
            var zoom = map.getZoom();
            if ((this.options['maxZoom'] !== -1 && this.options['maxZoom'] < zoom)
                    || this.options['minZoom'] > zoom) {
                return false;
            }
        }

        if (Z.Util.isNil(this.options['visible'])) {
            this.options['visible'] = true;
        }
        return this.options['visible'];
    },

    remove:function() {
        if (this.map) {
            this.map.removeLayer(this);
        }
        return this;
    },

    getMask:function() {
        return this._mask;
    },

    setMask:function(mask) {
        if (!((mask instanceof Z.Marker && Z.VectorMarkerSymbolizer.test(mask, mask.getSymbol()))
            || mask instanceof Z.Polygon || mask instanceof Z.MultiPolygon)) {
            throw new Error('mask has to be a Polygon or a MultiPolygon');
        }

        mask._bindLayer(this);
        mask._isRenderImmediate(true);
        if (mask instanceof Z.Marker ) {
            mask.setSymbol(Z.Util.extend({},mask.getSymbol(),{
                'markerLineWidth': 0,
                'markerFillOpacity': 0
            }));
        } else {
            mask.setSymbol({
                'lineWidth':0,
                'polygonOpacity':0
            });
        }
        this._mask = mask;
        if (!this.getMap() || this.getMap().isBusy()) {
            return;
        }
        var render = this._getRenderer();
        render && render.render();
    },

    clearMask:function(mask) {
        delete this._mask;
        if (!this.getMap() || this.getMap().isBusy()) {
            return this;
        }
        var renderer = this._getRenderer();
        renderer && renderer.render();
        return this;
    },

    _onRemove:function() {
        this.clear();
        if (this._renderer) {
            this._renderer.remove();
            delete this._renderer;
        }
        delete this.map;
    },

    _bindMap:function(map,zIndex) {
        if (!map) {return;}
        this.map = map;
        this.setZIndex(zIndex);
    },

    _initRenderer:function() {
        var renderer = this.options['renderer'];
        var clazz = this.constructor.getRendererClass(renderer);
        this._renderer = new clazz(this);
    },

    _getRenderer:function() {
        return this._renderer;
    },


    /**
     * 获取该图层所属的list
     */
    _getLayerList:function() {
        if (!this.map) {return null;}
        return this.map._layers;
    }
});
