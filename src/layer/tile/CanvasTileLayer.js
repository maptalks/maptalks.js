import TileLayer from './TileLayer';

/**
 * @classdesc
 * @ignore
 * @category layer
 * @extends TileLayer
 * @param {String|Number} id - tile layer's id
 * @param {Object} [options=null] - options defined in [CanvasTileLayer]{@link TileLayer#options}
 * @example
 * var layer = new CanvasTileLayer("tile");
 * layer.drawTile = ()
 */
class CanvasTileLayer extends TileLayer {

    constructor(id, options) {
        super(id, options);
        if (!this.options.hasOwnProperty('forceRenderOnMoving')) {
            // force not to forceRenderOnMoving
            this.options['forceRenderOnMoving'] = false;
        }
    }

    /**
     * The interface method to draw on canvsa tile
     * @param  {HTMLCanvasElement} canvas  canvas to draw on
     * @param  {Object} options current options
     * @param  {Object} options current options
     */
    drawTile(/*canvas, options*/) {

    }

    /**
     * Export the CanvasTileLayer's json. <br>
     * It can be used to reproduce the instance by [fromJSON]{@link Layer#fromJSON} method
     * @return {Object} layer's JSON
     */
    toJSON() {
        return {
            'type': 'CanvasTileLayer',
            'id': this.getId(),
            'options': this.config()
        };
    }

    /**
     * Reproduce a CanvasTileLayer from layer's JSON.
     * @param  {Object} layerJSON - layer's JSON
     * @return {CanvasTileLayer}
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

export default CanvasTileLayer;
