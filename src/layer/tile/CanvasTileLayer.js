Z.CanvasTileLayer = Z.TileLayer.extend({
});

/**
 * Export the CanvasTileLayer's profile json. <br>
 * Layer's profile is a snapshot of the layer in JSON format. <br>
 * It can be used to reproduce the instance by [fromJSON]{@link maptalks.Layer#fromJSON} method
 * @return {Object} layer's profile JSON
 */
Z.CanvasTileLayer.prototype.toJSON = function () {
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
Z.CanvasTileLayer.fromJSON = function (layerJSON) {
    if (!layerJSON || layerJSON['type'] !== 'CanvasTileLayer') { return null; }
    return new Z.CanvasTileLayer(layerJSON['id'], layerJSON['options']);
};
