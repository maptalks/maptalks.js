import { isArray, parseJSON } from 'core/util';
import Geometry from 'geometry/Geometry';
import VectorLayer from './VectorLayer';

/**
 * @classdesc
 * A sub class of VectorLayer supports GeoJSON.
 * @class
 * @category layer
 * @extends {VectorLayer}
 * @param {String|Number} id        - layer's id
 * @param {Object}        json      - GeoJSON objects
 * @param {Object} [options=null]   - construct options defined in [GeoJSONLayer]{@link GeoJSONLayer#options}
 */
export default class GeoJSONLayer extends VectorLayer {

    /**
     * Reproduce a GeoJSONLayer from layer's profile JSON.
     * @param  {Object} layerJSON - layer's profile JSON
     * @return {GeoJSONLayer}
     * @static
     * @private
     * @function
     */
    static fromJSON(profile) {
        if (!profile || profile['type'] !== 'GeoJSONLayer') {
            return null;
        }
        var layer = new GeoJSONLayer(profile['id'], profile['geojson'], profile['options']);
        if (profile['style']) {
            layer.setStyle(profile['style']);
        }
        return layer;
    }

    constructor(id, json, options) {
        if (json && !isArray(json)) {
            if (!json['type']) {
                //is options
                options = json;
                json = null;
            }
        }
        super(id, options);
        if (json) {
            var geometries = this._parse(json);
            this.addGeometry(geometries);
        }
    }

    /**
     * Add geojson data to the layer
     * @param {Object|Object[]} json - GeoJSON data
     * @return {GeoJSONLayer} this
     */
    addData(json) {
        var geometries = this._parse(json);
        this.addGeometry(geometries);
        return this;
    }

    _parse(json) {
        json = parseJSON(json);
        return Geometry.fromJSON(json);
    }

    /**
     * Export the GeoJSONLayer's profile json. <br>
     * @param  {Object} [options=null] - export options
     * @param  {Object} [options.geometries=null] - If not null and the layer is a [OverlayerLayer]{@link OverlayLayer},
     *                                            the layer's geometries will be exported with the given "options.geometries" as a parameter of geometry's toJSON.
     * @param  {Extent} [options.clipExtent=null] - if set, only the geometries intersectes with the extent will be exported.
     * @return {Object} layer's profile JSON
     */
    toJSON(options) {
        var profile = VectorLayer.prototype.toJSON.call(this, options);
        profile['type'] = 'GeoJSONLayer';
        var json = [];
        if (profile['geometries']) {
            var g;
            for (var i = 0, len = profile['geometries'].length; i < len; i++) {
                g = profile['geometries'][i]['feature'];
                if (!g['id'] && !g['properties']) {
                    g = g['geometry'];
                }
                json.push(g);
            }
            delete profile['geometries'];
        }
        profile['geojson'] = json;
        return profile;
    }
}
