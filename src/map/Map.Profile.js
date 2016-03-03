/** Profile **/

Z.Layer.include(/** @lends maptalks.Layer.prototype */{
    /**
     * Export the layer's profile json. <br>
     * Layer's profile is a snapshot of the layer in JSON format. <br>
     * It can be used to reproduce the instance by [fromJSON]{@link maptalks.Layer#fromJSON} method
     * @param  {Object} [options=null] - export options
     * @param  {Boolean} [options.visible=null]   - used to set profile.options.visible
     * @param  {Object} [options.geometries=null] - If not null and the layer is a [OverlayerLayer]{@link maptalks.OverlayLayer},
     *                                            the layer's geometries will be exported with the given "options.geometries" as a parameter of geometry's toJSON.
     * @param  {maptalks.Extent} [options.clipExtent=null] - if set, only the geometries intersectes with the extent will be exported.
     * @return {Object} layer's profile JSON
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
        if (!Z.Util.isNil(options['visible'])) {
            profile['options']['visible'] = options['visible'];
        }

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

/**
 * Reproduce a Layer from layer's profile JSON.
 * @param  {Object} layerJSON - layer's profile JSON
 * @return {maptalks.Layer}
 * @static
 * @function
 */
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

Z.Map.include(/** @lends maptalks.Map.prototype */{
    /**
     * @property {String}  - Version of the profile JSON schema.
     * @constant
     * @static
     */
    "PROFILE_VERSION" : "1.0",
    /**
     * Export the map's profile json. <br>
     * Map's profile is a snapshot of the map in JSON format. <br>
     * It can be used to reproduce the instance by [fromJSON]{@link maptalks.Map#fromJSON} method
     * @param  {Object} [options=null] - export options
     * @param  {Boolean|Object} [options.baseLayer=null] - whether to export base layer's profile, if yes, it will be used as layer's toJSON options.
     * @param  {Boolean|maptalks.Extent} [options.clipExtent=null] - if set with an extent instance, only the geometries intersectes with the extent will be exported.
     *                                                             If set to true, map's current extent will be used.
     * @param  {Boolean|Object|Object[]} [options.layers=null] - whether to export other layers' profile, if yes, it will be used as layer's toJSON options.
     *                                                        It can also be a array of layer export options with a "id" attribute to filter the layers to export.
     * @return {Object} layer's profile JSON
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
        if ((Z.Util.isNil(options['baseLayer']) || options['baseLayer']) && baseLayer) {
            profile['baseLayer'] = baseLayer.toJSON(options['baseLayer']);
            // if (!Z.Util.isNil(options['baseLayer']) && !options['baseLayer']) {
            //     profile['baseLayer']['options']['visible'] = false;
            // }
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

        if (Z.Util.isNil(options['layers']) || (options['layers'] && !Z.Util.isArray(options['layers']))) {
            var layers = this.getLayers();
            var layersJSON = [];
            for (var i = 0, len=layers.length; i < len; i++) {
                var options = Z.Util.extend({},Z.Util.isObject(options['layers'])?options['layers']:{},extraLayerOptions);
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

/**
 * Reproduce a map from map's profile JSON.
 * @param {(string|HTMLElement|object)} container - The container to create the map on, can be:<br>
 *                                          1. A HTMLElement container.<br/>
 *                                          2. ID of a HTMLElement container.<br/>
 *                                          3. A canvas compatible container in node,
 *                                          e.g. [node-canvas]{@link https://github.com/Automattic/node-canvas},
 *                                              [canvas2svg]{@link https://github.com/gliffy/canvas2svg}
 * @param  {Object} mapJSON - map's profile JSON
 * @param  {Object} [options=null] - options
 * @param  {Object} [options.baseLayer=null] - whether to import the baseLayer
 * @param  {Object} [options.layers=null]    - whether to import the layers
 * @return {maptalks.Map}
 * @static
 * @function
 */
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
