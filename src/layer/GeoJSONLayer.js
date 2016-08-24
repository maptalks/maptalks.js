/**
 * @classdesc
 * A sub class of maptalks.VectorLayer supports GeoJSON.
 * @class
 * @category layer
 * @extends {maptalks.VectorLayer}
 * @param {String|Number} id - layer's id
 * @param {Object}        json - GeoJSON objects
 * @param {Object} [options=null] - construct options
 * @param {*} options.* - any other option defined in [maptalks.VectorLayer]{@link maptalks.VectorLayer#options}
 */
Z.GeoJSONLayer = Z.VectorLayer.extend(/** @lends maptalks.GeoJSONLayer.prototype */{

    initialize: function (id, json, options) {
        this.setId(id);
        Z.Util.setOptions(this, options);
        var geometries = this._parse(json);
        this.addGeometry(geometries);
    },

    _parse: function (json) {
        json = Z.Util.parseJSON(json);
        return Z.Geometry.fromJSON(json);
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
        var profile = Z.VectorLayer.prototype.toJSON.call(this, options);
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
Z.GeoJSONLayer.fromJSON = function (profile) {
    if (!profile || profile['type'] !== 'GeoJSONLayer') { return null; }
    var layer = new Z.GeoJSONLayer(profile['id'], profile['geojson'], profile['options']);
    if (profile['style']) {
        layer.setStyle(profile['style']);
    }
    return layer;
};
