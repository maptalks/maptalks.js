/** 实现Map的Profile功能 **/
/** Profile是地图当前状态的一个画像, 存储了地图 **/

//Layer的Profile
Z.Layer.include({
    /**
     * 返回Layer的JSON
     * @param  {Object} options 属性配置, 控制属性是否输出
     *                          options: 是否输出options, 不设置或者设置为true则输出, false则不输出
     *                          geometries: 图层geometry(如果有)的JSON配置(同Geometry.toJSON方法的配置), 设为false则不输出
     * @return {JSON}         图层的JSON
     */
    toJSON:function(options) {
        if (!options) {
            options = {};
        }
        var profile = {
            "type":this.type,
            "id":this.getId()
        };
        profile['options'] = this.config();

        if (this instanceof Z.OverlayLayer) {
            if (Z.Util.isNil(options['geometries']) || options['geometries']) {
                var clipExtent;
                if (options['clipExtent']) {
                    clipExtent = new Z.Extent(options['clipExtent']);
                }
                var geoJSONs = [];
                var geometries = this.getGeometries();
                for (var i = 0, len=geometries.length; i < len; i++) {
                    var geoExt = geometries[i].getExtent();
                    if (!geoExt || (clipExtent && !clipExtent.intersects(geoExt))) {
                        continue;
                    }
                    geoJSONs.push(geometries[i].toJSON(options['geometries']));
                }
                profile['geometries'] = geoJSONs;
            }
        }
        return profile;
    }
});

Z.Layer.fromJSON=function(layerJSON) {
    if (!layerJSON) {return null;}
    var layerType;
    if (layerJSON['type'] === 'vector') {
        layerType = Z.VectorLayer;
    } else if (layerJSON['type'] === 'dynamic') {
        //DynamicLayer is also a TileLayer, so this should be before TileLayer
        layerType = Z.DynamicLayer;
    } else if (layerJSON['type'] === 'tile') {
        layerType = Z.TileLayer;
    }
    if (!layerType) {
        throw new Error("unsupported layer type:"+layerJSON['type']);
    }
    var layer = new layerType(layerJSON['id'], layerJSON['options']);
    if (layer instanceof Z.VectorLayer) {
        var geoJSONs = layerJSON['geometries'];
        var geometries = [];
        for (var i = 0; i < geoJSONs.length; i++) {
            var geo = Z.Geometry.fromJSON(geoJSONs[i]);
            if (geo) {
                geometries.push(geo);
            }
        }
        layer.addGeometry(geometries);
    }
    return layer;
};

Z.Map.include({
    "PROFILE_VERSION" : "1.0",
    /**
     * 返回地图的JSON
     * @param  {[type]} options [description]
     * @return {[type]}         [description]
     */
    toJSON:function(options) {
        if (!options) {
            options = {};
        }
        var profile = {
            "version": this["PROFILE_VERSION"],
            "extent" : this.getExtent().toJSON()
        };
        profile['options'] = this.config();
        profile["options"]["center"] = this.getCenter();
        profile["options"]["zoom"] = this.getZoom();

        var baseLayer = this.getBaseLayer();
        if (baseLayer) {
            profile['baseLayer'] = baseLayer.toJSON(options['baseLayer']);
            if (!Z.Util.isNil(options['baseLayer']) && !options['baseLayer']) {
                profile['baseLayer']['options']['visible'] = false;
            }
        }
        var extraLayerOptions = {};
        if (options['clipExtent']) {
            //if clipExtent is set, only geometries intersecting with extent will be exported.
            //clipExtent's value can be an extent or true (map's current extent)
            if (options['clipExtent'] === true)  {
                extraLayerOptions['clipExtent'] = this.getExtent();
            } else {
                extraLayerOptions['clipExtent'] = options['clipExtent'];
            }
        }

        if (Z.Util.isNil(options['layers']) || options['layers'] === true) {
            var layers = this.getLayers();
            var layersJSON = [];
            for (var i = 0, len=layers.length; i < len; i++) {
                var options = Z.Util.extend({},options['layers'],extraLayerOptions);
                layersJSON.push(layers[i].toJSON(options));
            }
            profile["layers"] = layersJSON;
        } else if (Z.Util.isArrayHasData(options['layers'])) {
            var layers = options['layers'];
            var layersJSON = [];
            for (var i = 0; i < layers.length; i++) {
                var exportOption = layers[i];
                var layer = this.getLayer(exportOption['id']);
                var options = Z.Util.extend({},exportOption['options'],extraLayerOptions);
                layersJSON.push(layer.toJSON(options));
            }
            profile["layers"] = layersJSON;
        } else {
            profile["layers"] = [];
        }
        return profile;
    }
});

Z.Map.fromJSON=function(container, mapJSON, options) {
    if (!container || !mapJSON) {
        return null;
    }
    if (!options) {
        options = {};
    }
    var map = new Z.Map(container, mapJSON["options"]);
    if (Z.Util.isNil(options['baseLayer']) || options['baseLayer']) {
        var baseLayer = Z.Layer.fromJSON(mapJSON["baseLayer"]);
        if (baseLayer) {
            map.setBaseLayer(baseLayer);
        }
    }
    if (Z.Util.isNil(options['layers']) || options['layers']) {
        var layers = [];
        var layerJSONs = mapJSON["layers"];
        for (var i = 0; i < layerJSONs.length; i++) {
            var layer = Z.Layer.fromJSON(layerJSONs[i]);
            layers.push(layer);
        }
        map.addLayer(layers);
    }

    return map;
};
