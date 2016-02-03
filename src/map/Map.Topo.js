/**
 * Map类的扩展:拓扑计算的相关方法
 */
Z.Map.include({
    /**
     * 计算两坐标间距离，计算结果单位为米，如果返回-1，则说明参数不合法
     * @member maptalks.Map
     * @param {maptalks.Coordinate} lonlat1 坐标1，例如{x:121,y:19}
     * @param {maptalks.Coordinate} lonlat2 坐标2，例如{x:122,y:19}
     * @return {Number} 距离
     * @expose
     */
    computeDistance: function(lonlat1, lonlat2) {
        if (!this.getProjection()) {return null;}
        var p1 = new Z.Coordinate(lonlat1),
            p2 = new Z.Coordinate(lonlat2);
        if (p1.equals(p2)) {return 0;}
        return this.getProjection().measureLength(p1, p2);
    },

    /**
     * 计算Geometry的地理长度
     * @member maptalks.Map
     * @param {maptalks.Geometry} geometry 图形
     * @return {Number} 长度
     * @expose
     */
    computeGeodesicLength:function(geometry) {
        return geometry._computeGeodesicLength(this.getProjection());
    },

    /**
     * 计算Geometry的地理面积
     * @member maptalks.Map
     * @param  {maptalks.Geometry} geometry
     * @return {Number}          地理面积
     * @expose
     */
    computeGeodesicArea:function(geometry) {
        return geometry._computeGeodesicArea(this.getProjection());
    },

    /**
     * Identify
     * @member maptalks.Map
     * @param  {opts} opts 查询参数 {
     *                     //是否排除内部图层
     *                     includeInternals : true|false,
     *                     coordinate: coordinate,
     *                     "layers": [],
     *                     "success": fn
     *                     }
     * @expose
     */
    identify: function(opts) {
        if (!opts) {
            return;
        }
        var reqLayers = opts['layers'];
        if(!Z.Util.isArrayHasData(reqLayers)) {
            return;
        }
        var layers = [];
        var i,len;
        for (i = 0; i < reqLayers.length; i++) {
            if (Z.Util.isString(reqLayers[i])) {
                layers.push(this.getLayer(reqLayers[i]));
            } else {
                layers.push(reqLayers[i]);
            }
        }
        var point = this.coordinateToViewPoint(opts['coordinate']).round();
        var fn = opts['success'],
            filter = opts['filter'];
        var hits = [],
            isEnd =false;
        for (i = layers.length - 1; i >= 0; i--) {
            if (isEnd) {
                break;
            }
            var layer = layers[i];
            if(!layer || !layer.getMap() || (!opts['includeInternals'] && layer.getId().indexOf(Z.internalLayerPrefix) >= 0)) {
                continue;
            }
            var allGeos = layers[i].getGeometries();
            for (var j = allGeos.length - 1; j >= 0; j--) {
                var geo = allGeos[j];
                if (!geo || !geo.isVisible()) {
                    continue;
                }
                var pxExtent = !geo._getPainter()? null : geo._getPainter().getPixelExtent();
                if (!pxExtent || !pxExtent.contains(point)) {
                    continue;
                }
                if (geo._containsPoint(point) && (!filter || (filter && filter(geo)))) {
                    hits.push(geo);
                    if (opts['count']) {
                        if (hits.length >= opts['count']) {
                            isEnd = true;
                            break;
                        }
                    }
                }
            }
        }
        fn.call(this, hits/*{'success': true, 'count':hits.length, 'data': hits}*/);
    }

});
