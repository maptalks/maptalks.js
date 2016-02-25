/**
 * 抽象类, 允许叠加Geometry的图层的共同父类
 * @type {Z.OverlayLayer}
 */
Z.OverlayLayer=Z.Layer.extend({
    //根据不同的语言定义不同的错误信息
    exceptionDefs:{
        'en-US':{
            'DUPLICATE_GEOMETRY_ID':'Duplicate ID for the geometry',
            'INVALID_GEOMETRY':'invalid geometry to add to layer.'
        },
        'zh-CN':{
            'DUPLICATE_GEOMETRY_ID':'重复的Geometry ID',
            'INVALID_GEOMETRY':'不合法的Geometry, 无法被加入图层.'
        }
    },

    /**
     * 通过geometry的id取得Geometry
     * @param  {[String|Integer]} id [Geometry的id]
     * @return {[Geometry]}    [Geometry]
     */
    getGeometryById:function(id) {
        if (Z.Util.isNil(id) || id === '') {
            return null;
        }
        if (!this._geoMap[id]) {
            //避免出现undefined
            return null;
        }
        return this._geoMap[id];
    },

    /**
     * 返回图层上所有的Geometry
     * @param {function} filter 过滤函数
     * @param {Object} context 过滤函数的调用对象
     * @return {Array} [Geometry数组]
     * @expose
     */
    getGeometries:function(filter, context) {
        var cache = this._geoCache;
        var result = [];
        for (var p in cache) {
            if (cache.hasOwnProperty(p)) {
                var geometry = cache[p];
                if (filter) {
                    var filtered;
                    if (context) {
                        filtered = filter.call(context, geometry);
                    } else {
                        filtered = filter(geometry);
                    }
                    if (!filtered) {
                        continue;
                    }
                }
                result.push(geometry);
            }
        }
        return result;
    },

    /**
     * VectorLayer是否为空
     * @return {Boolean} 是
     */
    isEmpty:function() {
        return this._counter === 0;
    },

    /**
     * 向图层中添加geometry
     * @param {Geometry|[Geometry]} geometries 添加的geometry
     * @param {[type]} fitView    添加后是否聚焦到geometry上
     * @expose
     */
    addGeometry:function(geometries,fitView) {
        if (!geometries) {return this;}
        if (!Z.Util.isArray(geometries)) {
            return this.addGeometry([geometries],fitView);
        } else if (!Z.Util.isArrayHasData(geometries)) {
            return this;
        }
        var fitCounter = 0;
        var centerSum = {x:0,y:0};
        var extent = null;
        for (var i=0, len=geometries.length;i<len;i++) {
            var geo = geometries[i];
            if (!geo || !(geo instanceof Z.Geometry)) {
                throw new Error(this.exceptions['INVALID_GEOMETRY']);
            }

            var geoId = geo.getId();
            if (geoId) {
                if (!Z.Util.isNil(this._geoMap[geoId])) {
                    throw new Error(this.exceptions['DUPLICATE_GEOMETRY_ID']+':'+geoId);
                }
                this._geoMap[geoId] = geo;
            }
            var internalId = Z.Util.GUID();
            //内部全局唯一的id
            geo._setInternalId(internalId);
            this._geoCache[internalId] = geo;
            this._counter++;
            geo._bindLayer(this);
            if (fitView) {
                var geoCenter = geo.getCenter();
                var geoExtent = geo.getExtent();
                if (geoCenter && geoExtent) {
                    centerSum.x += geoCenter.x;
                    centerSum.y += geoCenter.y;
                    extent = geoExtent.combine(extent);
                    fitCounter++;
                }
            }
            //图形添加到layer
            geo._fireEvent('addend', {'geometry':geo});
        }
        var map = this.getMap();
        if (map) {
            this._getRenderer().render(geometries);
            if (fitView) {
                var z = map.getFitZoom(extent);
                var center = {x:centerSum.x/fitCounter, y:centerSum.y/fitCounter};
                map.setCenterAndZoom(center,z);
            }
        }
        return this;
    },

    /**
     * 遍历geometry
     * @param  {Function} fn 回调函数
     */
    _eachGeometry:function(fn,context) {
        var cache = this._geoCache;
        if (!context) {
            context=this;
        }
        for (var g in cache) {
            if (cache.hasOwnProperty(g)) {
                fn.call(context,cache[g]);
            }
        }
    },

    /**
     * 从图层上移除Geometry
     * @param  {Geometry} geometry 要移除的Geometry
     * @expose
     */
    removeGeometry:function(geometry) {
        if (Z.Util.isArray(geometry)) {
            for (var i = geometry.length - 1; i >= 0; i--) {
                this.removeGeometry(geometry[i]);
            }
            return this;
        }
        if (!(geometry instanceof Z.Geometry)) {
            geometry = this.getGeometryById(geometry);
        }
        if (!geometry) {return this;}
        if (this != geometry.getLayer()) {
            return this;
        }
        geometry.remove();
        return this;
    },

    /**
     * clear all geometries in this layer
     * @expose
     */
    clear:function() {
        this._eachGeometry(function(geo) {
            geo.remove();
        });
        this._geoMap={};
        this._geoCache={};
        return this;
    }
});

Z.OverlayLayer.addInitHook(function() {
    this._geoCache={};
    this._geoMap={};
    this._resources={};
    this._counter = 0;
});
