/**
 * @classdesc
 * A sub class of maptalks.VectorLayer supports GeoJSON.
 * @class
 * @category layer
 * @extends {maptalks.VectorLayer}
 * @param {String|Number} id        - layer's id
 * @param {Object}        json      - GeoJSON objects
 * @param {Object} [options=null]   - construct options defined in [maptalks.GeoJSONLayer]{@link maptalks.GeoJSONLayer#options}
 */
maptalks.GeoJSONLayer = maptalks.VectorLayer.extend(/** @lends maptalks.GeoJSONLayer.prototype */{

    initialize: function (id, json, options) {
        this.setId(id);
        if (json && !maptalks.Util.isArray(json)) {
            if (!json['type']) {
                //is options
                options = json;
                json = null;
            }
        }
        maptalks.Util.setOptions(this, options);
        if (json) {
            var geometries = this._parse(json);
            this.addGeometry(geometries);
        }
    },

    /**
     * Add geojson data to the layer
     * @param {Object|Object[]} json - GeoJSON data
     * @return {maptalks.GeoJSONLayer} this
     */
    addData: function (json) {
        var geometries = this._parse(json);
        this.addGeometry(geometries);
        return this;
    },

    _parse: function (json) {
        json = maptalks.Util.parseJSON(json);
        return maptalks.Geometry.fromJSON(json);
    },

    /**
     * Export the GeoJSONLayer's profile json. <br>
     * @param  {Object} [options=null] - export options
     * @param  {Object} [options.geometries=null] - If not null and the layer is a [OverlayerLayer]{@link maptalks.OverlayLayer},
     *                                            the layer's geometries will be exported with the given "options.geometries" as a parameter of geometry's toJSON.
     * @param  {maptalks.Extent} [options.clipExtent=null] - if set, only the geometries intersectes with the extent will be exported.
     * @return {Object} layer's profile JSON
     */
    toJSON: function (options) {
        var profile = maptalks.VectorLayer.prototype.toJSON.call(this, options);
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
});

/**
 * Reproduce a GeoJSONLayer from layer's profile JSON.
 * @param  {Object} layerJSON - layer's profile JSON
 * @return {maptalks.GeoJSONLayer}
 * @static
 * @private
 * @function
 */
maptalks.GeoJSONLayer.fromJSON = function (profile) {
    if (!profile || profile['type'] !== 'GeoJSONLayer') { return null; }
    var layer = new maptalks.GeoJSONLayer(profile['id'], profile['geojson'], profile['options']);
    if (profile['style']) {
        layer.setStyle(profile['style']);
    }
    return layer;
};
