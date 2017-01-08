import TileLayer from './TileLayer';

export default class CanvasTileLayer extends TileLayer {
    /**
     * Export the CanvasTileLayer's profile json. <br>
     * Layer's profile is a snapshot of the layer in JSON format. <br>
     * It can be used to reproduce the instance by [fromJSON]{@link Layer#fromJSON} method
     * @return {Object} layer's profile JSON
     */
    toJSON() {
        return {
            'type': 'CanvasTileLayer',
            'id': this.getId(),
            'options': this.config()
        };
    }

    /**
     * Reproduce a CanvasTileLayer from layer's profile JSON.
     * @param  {Object} layerJSON - layer's profile JSON
     * @return {TileLayer}
     * @static
     * @private
     * @function
     */
    static fromJSON(layerJSON) {
        if (!layerJSON || layerJSON['type'] !== 'CanvasTileLayer') {
            return null;
        }
        return new CanvasTileLayer(layerJSON['id'], layerJSON['options']);
    }
}

CanvasTileLayer.registerJSONType('CanvasTileLayer');
