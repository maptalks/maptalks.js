maptalks.CanvasTileLayer = maptalks.TileLayer.extend({
});

/**
 * Export the CanvasTileLayer's profile json. <br>
 * Layer's profile is a snapshot of the layer in JSON format. <br>
 * It can be used to reproduce the instance by [fromJSON]{@link maptalks.Layer#fromJSON} method
 * @return {Object} layer's profile JSON
 */
maptalks.CanvasTileLayer.prototype.toJSON = function () {
    var profile = {
        'type':'CanvasTileLayer',
        'id':this.getId(),
        'options' : this.config()
    };
    return profile;
};

/**
 * Reproduce a CanvasTileLayer from layer's profile JSON.
 * @param  {Object} layerJSON - layer's profile JSON
 * @return {maptalks.TileLayer}
 * @static
 * @private
 * @function
 */
maptalks.CanvasTileLayer.fromJSON = function (layerJSON) {
    if (!layerJSON || layerJSON['type'] !== 'CanvasTileLayer') { return null; }
    return new maptalks.CanvasTileLayer(layerJSON['id'], layerJSON['options']);
};
