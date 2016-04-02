/**
 * @classdesc
 * A layer for managing and rendering geometrie.
 * @class
 * @category layer
 * @extends {maptalks.OverlayLayer}
 * @param {String|Number} id - layer's id
 * @param {Object} [options=null] - construct options
 * @param {Boolean} [options.debug=false] - whether the geometries on the layer is in debug mode.
 * @param {Boolean} [options.enableSimplify=false] - whether to simplify geometries before rendering.
 * @param {String} [options.cursor=default] - the cursor style of the layer
 * @param {Boolean} [options.geometryEvents=true] - enable/disable firing geometry events
 * @param {Number} [options.thresholdOfPointUpdate=50] - threshold of points number to update points while transforming.
 * @param {*} options.* - any other option defined in [maptalks.Layer]{@link maptalks.Layer#options}
 */
Z.VectorLayer=Z.OverlayLayer.extend(/** @lends maptalks.VectorLayer.prototype */{

    options:{
        'debug'                     : false,
        'enableSimplify'            : true,
        'cursor'                    : 'pointer',
        'geometryEvents'            : true,
        'thresholdOfPointUpdate'    : 50
    },

    initialize:function(id, options) {
        this.setId(id);
        Z.Util.setOptions(this, options);
    }
});

/**
 * Export the vector layer's profile json. <br>
 * @param  {Object} [options=null] - export options
 * @param  {Object} [options.geometries=null] - If not null and the layer is a [OverlayerLayer]{@link maptalks.OverlayLayer},
 *                                            the layer's geometries will be exported with the given "options.geometries" as a parameter of geometry's toJSON.
 * @param  {maptalks.Extent} [options.clipExtent=null] - if set, only the geometries intersectes with the extent will be exported.
 * @return {Object} layer's profile JSON
 */
Z.VectorLayer.prototype.toJSON = function(options) {
    if (!options) {
        options = {};
    }
    var profile = {
        "type"    : 'VectorLayer',
        "id"      : this.getId(),
        "options" : this.config()
    };
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
    return profile;
}

/**
 * Reproduce a VectorLayer from layer's profile JSON.
 * @param  {Object} layerJSON - layer's profile JSON
 * @return {maptalks.VectorLayer}
 * @static
 * @private
 * @function
 */
Z.VectorLayer._fromJSON = function(layerJSON) {
    if (!layerJSON || layerJSON['type'] !== 'VectorLayer') {return null;}
    var layer = new Z.VectorLayer(layerJSON['id'], layerJSON['options']);
    var geoJSONs = layerJSON['geometries'];
    var geometries = [];
    for (var i = 0; i < geoJSONs.length; i++) {
        var geo = Z.Geometry.fromJSON(geoJSONs[i]);
        if (geo) {
            geometries.push(geo);
        }
    }
    layer.addGeometry(geometries);
    return layer;
}

Z.Util.extend(Z.VectorLayer,Z.Renderable);
