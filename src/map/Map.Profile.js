/** Profile **/
import {
    extend,
    isNil,
    isObject,
    isArrayHasData
} from '../core/util';
import Layer from '../layer/Layer';
import Map from './Map';
import Geometry from '../geometry/Geometry';
import GeoJSON from '../geometry/GeoJSON';

/**
 * Produce a geometry from one or more [JSON]{@link Geometry#toJSON} or GeoJSON.
 * @param  {Object} json - a geometry's JSON or a geojson
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
    const marker = Geometry.fromJSON(profile);
 */
Geometry.fromJSON = function (json) {
    if (Array.isArray(json)) {
        let result = [];
        for (let i = 0, len = json.length; i < len; i++) {
            const c = Geometry.fromJSON(json[i]);
            if (Array.isArray(json)) {
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
    let geometry;
    if (json['subType']) {
        geometry = Geometry.getJSONClass(json['subType']).fromJSON(json);
        if (!isNil(json['feature']['id'])) {
            geometry.setId(json['feature']['id']);
        }
    } else {
        geometry = GeoJSON.toGeometry(json['feature']);
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
 * Reproduce a Layer from layer's JSON.
 * @param  {Object} layerJSON - layer's JSON
 * @return {Layer}
 */
Layer.fromJSON = function (layerJSON) {
    if (!layerJSON) {
        return null;
    }
    const layerType = layerJSON['type'];
    const clazz = Layer.getJSONClass(layerType);
    if (!clazz || !clazz.fromJSON) {
        throw new Error('unsupported layer type:' + layerType);
    }
    return clazz.fromJSON(layerJSON);
};

Map.include(/** @lends Map.prototype */ {
    /**
     * @property {String}  - Version of the [JSON]{@link Map#toJSON} schema.
     * @constant
     * @static
     */
    'JSON_VERSION': '1.0',
    /**
     * Export the map's json, a snapshot of the map in JSON format.<br>
     * It can be used to reproduce the instance by [fromJSON]{@link Map#fromJSON} method
     * @param  {Object} [options=null] - export options
     * @param  {Boolean|Object} [options.baseLayer=null] - whether to export base layer's JSON, if yes, it will be used as layer's toJSON options.
     * @param  {Boolean|Extent} [options.clipExtent=null] - if set with an extent instance, only the geometries intersectes with the extent will be exported.
     *                                                             If set to true, map's current extent will be used.
     * @param  {Boolean|Object|Object[]} [options.layers=null] - whether to export other layers' JSON, if yes, it will be used as layer's toJSON options.
     *                                                        It can also be an array of layer export options with a "id" attribute to filter the layers to export.
     * @return {Object} layer's JSON
     */
    toJSON: function (options) {
        if (!options) {
            options = {};
        }
        const json = {
            'jsonVersion': this['JSON_VERSION'],
            'version': this.VERSION,
            'extent': this.getExtent().toJSON()
        };
        json['options'] = this.config();
        json['options']['center'] = this.getCenter();
        json['options']['zoom'] = this.getZoom();
        json['options']['bearing'] = this.getBearing();
        json['options']['pitch'] = this.getPitch();

        const baseLayer = this.getBaseLayer();
        if ((isNil(options['baseLayer']) || options['baseLayer']) && baseLayer) {
            json['baseLayer'] = baseLayer.toJSON(options['baseLayer']);
        }
        const extraLayerOptions = {};
        if (options['clipExtent']) {
            //if clipExtent is set, only geometries intersecting with extent will be exported.
            //clipExtent's value can be an extent or true (map's current extent)
            if (options['clipExtent'] === true) {
                extraLayerOptions['clipExtent'] = this.getExtent();
            } else {
                extraLayerOptions['clipExtent'] = options['clipExtent'];
            }
        }
        const layersJSON = [];
        if (isNil(options['layers']) || (options['layers'] && !Array.isArray(options['layers']))) {
            const layers = this.getLayers();
            for (let i = 0, len = layers.length; i < len; i++) {
                if (!layers[i].toJSON) {
                    continue;
                }
                const opts = extend({}, isObject(options['layers']) ? options['layers'] : {}, extraLayerOptions);
                layersJSON.push(layers[i].toJSON(opts));
            }
            json['layers'] = layersJSON;
        } else if (isArrayHasData(options['layers'])) {
            const layers = options['layers'];
            for (let i = 0; i < layers.length; i++) {
                const exportOption = layers[i];
                const layer = this.getLayer(exportOption['id']);
                if (!layer.toJSON) {
                    continue;
                }
                const opts = extend({}, exportOption['options'], extraLayerOptions);
                layersJSON.push(layer.toJSON(opts));
            }
            json['layers'] = layersJSON;
        } else {
            json['layers'] = [];
        }
        return json;
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
    const map = new Map(container, profile['options']);
    if (isNil(options['baseLayer']) || options['baseLayer']) {
        const baseLayer = Layer.fromJSON(profile['baseLayer']);
        if (baseLayer) {
            map.setBaseLayer(baseLayer);
        }
    }
    if (isNil(options['layers']) || options['layers']) {
        const layers = [];
        const layerJSONs = profile['layers'];
        for (let i = 0; i < layerJSONs.length; i++) {
            const layer = Layer.fromJSON(layerJSONs[i]);
            layers.push(layer);
        }
        map.addLayer(layers);
    }

    return map;
};
