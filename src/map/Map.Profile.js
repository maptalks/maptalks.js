/** Profile **/
import {
    extend,
    isNil,
    isObject,
    isArray,
    isArrayHasData
} from 'core/util';
import Layer from 'layer/Layer';
import Map from './Map';
import { Geometry } from 'geometry/Geometry';
import { GeoJSON } from 'geometry/GeoJSON';

/**
 * Produce a geometry from one or more [profile json]{@link Geometry#toJSON} or GeoJSON.
 * @static
 * @param  {Object} json - a geometry's profile json or a geojson
 * @return {Geometry} geometry
 * @example
 * var profile = {
        "feature": {
              "type": "Feature",
              "id" : "point1",
              "geometry": {"type": "Point", "coordinates": [102.0, 0.5]},
              "properties": {"prop0": "value0"}
        },
        //construct options.
        "options":{
            "draggable" : true
        },
        //symbol
        "symbol":{
            "markerFile"  : "http://foo.com/icon.png",
            "markerWidth" : 20,
            "markerHeight": 20
        }
    };
    var marker = Geometry.fromJSON(profile);
 */
Geometry.fromJSON = function (json) {
    if (isArray(json)) {
        var result = [],
            c;
        for (var i = 0, len = json.length; i < len; i++) {
            c = Geometry.fromJSON(json[i]);
            if (isArray(json)) {
                result = result.concat(c);
            } else {
                result.push(c);
            }
        }
        return result;
    }

    if (json && !json['feature']) {
        return GeoJSON.toGeometry(json);
    }
    var geometry;
    if (json['subType']) {
        geometry = maptalks[json['subType']].fromJSON(json);
        if (!isNil(json['feature']['id'])) {
            geometry.setId(json['feature']['id']);
        }
    } else {
        var feature = json['feature'];
        geometry = GeoJSON.toGeometry(feature);
        if (json['options']) {
            geometry.config(json['options']);
        }
    }
    if (json['symbol']) {
        geometry.setSymbol(json['symbol']);
    }
    if (json['infoWindow']) {
        geometry.setInfoWindow(json['infoWindow']);
    }
    return geometry;
};

/**
 * Reproduce a Layer from layer's profile JSON.
 * @param  {Object} layerJSON - layer's profile JSON
 * @return {Layer}
 * @static
 * @function
 */
Layer.fromJSON = function (layerJSON) {
    if (!layerJSON) {
        return null;
    }
    // TODO: layerTypes register
    var layerType = layerJSON['type'];
    if (layerType === 'vector') {
        layerType = layerJSON['type'] = 'VectorLayer';
    } else if (layerType === 'dynamic') {
        layerType = layerJSON['type'] = 'DynamicLayer';
    } else if (layerType === 'tile') {
        layerType = layerJSON['type'] = 'TileLayer';
    }
    if (typeof maptalks[layerType] === 'undefined' || !maptalks[layerType].fromJSON) {
        throw new Error('unsupported layer type:' + layerType);
    }
    return maptalks[layerType].fromJSON(layerJSON);
};

Map.include(/** @lends Map.prototype */ {
    /**
     * @property {String}  - Version of the [profile]{@link Map#toJSON} JSON schema.
     * @constant
     * @static
     */
    'PROFILE_VERSION': '1.0',
    /**
     * Export the map's profile json. <br>
     * Map's profile is a snapshot of the map in JSON format. <br>
     * It can be used to reproduce the instance by [fromJSON]{@link Map#fromJSON} method
     * @param  {Object} [options=null] - export options
     * @param  {Boolean|Object} [options.baseLayer=null] - whether to export base layer's profile, if yes, it will be used as layer's toJSON options.
     * @param  {Boolean|Extent} [options.clipExtent=null] - if set with an extent instance, only the geometries intersectes with the extent will be exported.
     *                                                             If set to true, map's current extent will be used.
     * @param  {Boolean|Object|Object[]} [options.layers=null] - whether to export other layers' profile, if yes, it will be used as layer's toJSON options.
     *                                                        It can also be a array of layer export options with a "id" attribute to filter the layers to export.
     * @return {Object} layer's profile JSON
     */
    toJSON: function (options) {
        if (!options) {
            options = {};
        }
        var profile = {
            'version': this['PROFILE_VERSION'],
            'extent': this.getExtent().toJSON()
        };
        profile['options'] = this.config();
        profile['options']['center'] = this.getCenter();
        profile['options']['zoom'] = this.getZoom();

        var baseLayer = this.getBaseLayer();
        if ((isNil(options['baseLayer']) || options['baseLayer']) && baseLayer) {
            profile['baseLayer'] = baseLayer.toJSON(options['baseLayer']);
        }
        var extraLayerOptions = {};
        if (options['clipExtent']) {
            //if clipExtent is set, only geometries intersecting with extent will be exported.
            //clipExtent's value can be an extent or true (map's current extent)
            if (options['clipExtent'] === true) {
                extraLayerOptions['clipExtent'] = this.getExtent();
            } else {
                extraLayerOptions['clipExtent'] = options['clipExtent'];
            }
        }
        var i, len, layers, opts,
            layersJSON = [];
        if (isNil(options['layers']) || (options['layers'] && !isArray(options['layers']))) {
            layers = this.getLayers();
            for (i = 0, len = layers.length; i < len; i++) {
                if (!layers[i].toJSON) {
                    continue;
                }
                opts = extend({}, isObject(options['layers']) ? options['layers'] : {}, extraLayerOptions);
                layersJSON.push(layers[i].toJSON(opts));
            }
            profile['layers'] = layersJSON;
        } else if (isArrayHasData(options['layers'])) {
            layers = options['layers'];
            for (i = 0; i < layers.length; i++) {
                var exportOption = layers[i];
                var layer = this.getLayer(exportOption['id']);
                if (!layer.toJSON) {
                    continue;
                }
                opts = extend({}, exportOption['options'], extraLayerOptions);
                layersJSON.push(layer.toJSON(opts));
            }
            profile['layers'] = layersJSON;
        } else {
            profile['layers'] = [];
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
 * @return {Map}
 * @static
 * @function
 * @example
 * var map = Map.fromJSON('map', mapProfile);
 */
Map.fromJSON = function (container, profile, options) {
    if (!container || !profile) {
        return null;
    }
    if (!options) {
        options = {};
    }
    var map = new Map(container, profile['options']);
    if (isNil(options['baseLayer']) || options['baseLayer']) {
        var baseLayer = Layer.fromJSON(profile['baseLayer']);
        if (baseLayer) {
            map.setBaseLayer(baseLayer);
        }
    }
    if (isNil(options['layers']) || options['layers']) {
        var layers = [];
        var layerJSONs = profile['layers'];
        for (var i = 0; i < layerJSONs.length; i++) {
            var layer = Layer.fromJSON(layerJSONs[i]);
            layers.push(layer);
        }
        map.addLayer(layers);
    }

    return map;
};
