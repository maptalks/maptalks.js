import TileLayer, { TileLayerOptionsType } from './TileLayer';
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
declare class CanvasTileLayer extends TileLayer {
    constructor(id: number | string, options: TileLayerOptionsType);
    /**
     * The interface method to draw on canvsa tile
     * @param  {HTMLCanvasElement} canvas  canvas to draw on
     * @param  {Object} options current options
     * @param  {Object} options current options
     */
    drawTile(): void;
    /**
     * Export the CanvasTileLayer's json. <br>
     * It can be used to reproduce the instance by [fromJSON]{@link Layer#fromJSON} method
     * @return {Object} layer's JSON
     */
    toJSON(): {
        type: string;
        id: string | number;
        options: {};
    };
    /**
     * Reproduce a CanvasTileLayer from layer's JSON.
     * @param  {Object} layerJSON - layer's JSON
     * @return {CanvasTileLayer}
     * @static
     * @private
     * @function
     */
    static fromJSON(layerJSON: any): CanvasTileLayer;
}
export default CanvasTileLayer;
