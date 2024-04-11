import { LayerJSONType } from '../Layer';
import TileLayer, { TileLayerOptionsType } from './TileLayer';

/**
 * @classdesc
 * @ignore
 * @category layer
 * @extends TileLayer
 * @param id - tile layer's id
 * @param - options defined in [CanvasTileLayer]{@link TileLayer#options}
 * @example
 * var layer = new CanvasTileLayer("tile");
 * layer.drawTile = ()
 */
class CanvasTileLayer extends TileLayer {

    constructor(id: string, options: CanvasTileLayerOptionsType) {
        super(id, options);
        if (!this.options.hasOwnProperty('forceRenderOnMoving')) {
            // force not to forceRenderOnMoving
            this.options['forceRenderOnMoving'] = false;
        }
    }

    /**
     * The interface method to draw on canvsa tile
     * @param canvas  canvas to draw on
     * @param options current options
     * @param options current options
     */
    drawTile(/*canvas, options*/) {

    }

    /**
     * Export the CanvasTileLayer's json. <br>
     * It can be used to reproduce the instance by [fromJSON]{@link Layer#fromJSON} method
     * @return layer's JSON
     */
    toJSON(): LayerJSONType {
        return {
            'type': 'CanvasTileLayer',
            'id': this.getId(),
            'options': this.config()
        };
    }

    /**
     * Reproduce a CanvasTileLayer from layer's JSON.
     * @param layerJSON - layer's JSON
     * @static
     * @private
     * @function
     */
    static fromJSON(layerJSON: { [x: string]: any; }): CanvasTileLayer {
        if (!layerJSON || layerJSON['type'] !== 'CanvasTileLayer') {
            return null;
        }
        return new CanvasTileLayer(layerJSON['id'], layerJSON['options']);
    }
}

CanvasTileLayer.registerJSONType('CanvasTileLayer');

export default CanvasTileLayer;

export type CanvasTileLayerOptionsType = TileLayerOptionsType;
