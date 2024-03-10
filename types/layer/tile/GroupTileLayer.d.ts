import TileLayer from './TileLayer';
import Size from '../../geo/Size';
/**
 * @classdesc
 * A layer used to display a group of tile layers. <br>
 * Its performance is better than add TileLayers seperately and it can help prevent limits of active webgl contexts: <br>
 * "WARNING: Too many active WebGL contexts. Oldest context will be lost"
 * @category layer
 * @extends TileLayer
 * @param {String|Number} id - tile layer's id
 * @param {TileLayer[]} layers  - TileLayers to add
 * @param {Object} [options=null] - options defined in [TileLayer]{@link TileLayer#options}
 * @example
 * new GroupTileLayer("group-tiles",[
    new maptalks.WMSTileLayer('wms', {
      'urlTemplate' : 'https://demo.boundlessgeo.com/geoserver/ows',
      'crs' : 'EPSG:3857',
      'layers' : 'ne:ne',
      'styles' : '',
      'version' : '1.3.0',
      'format': 'image/png',
      'transparent' : true,
      'uppercase' : true
    }),
    new maptalks.TileLayer('tile2',{
      urlTemplate: 'http://korona.geog.uni-heidelberg.de/tiles/adminb/x={x}&y={y}&z={z}'
    })
  ])
 */
declare class GroupTileLayer extends TileLayer {
    layers: Array<TileLayer>;
    layerMap: object;
    _groupChildren: any;
    /**
     * Reproduce a GroupTileLayer from layer's profile JSON.
     * @param  {Object} layerJSON - layer's profile JSON
     * @return {GroupTileLayer}
     * @static
     * @private
     * @function
     */
    static fromJSON(layerJSON: any): GroupTileLayer;
    /**
     * @param {String|Number} id    - layer's id
     * @param {TileLayer[]} layers  - TileLayers to add
     * @param {Object}  [options=null]          - construct options
     * @param {*}  [options.*=null]             - options defined in [TileLayer]{@link TileLayer#options}
     */
    constructor(id: any, layers: Array<TileLayer>, options: any);
    /**
     * Get children TileLayer
     * @returns {TileLayer[]}
     */
    getLayers(): TileLayer[];
    /**
     * add tilelayers
     * @param {TileLayer[]} tileLayers
     */
    addLayer(tileLayers?: Array<TileLayer>): this;
    /**
     * remove tilelayers
     * @param {TileLayer[]} tileLayers
     */
    removeLayer(tileLayers?: Array<TileLayer>): this;
    /**
   * clear tilelayers
   */
    clearLayers(): this;
    /**
     * Export the GroupTileLayer's profile json. <br>
     * Layer's profile is a snapshot of the layer in JSON format. <br>
     * It can be used to reproduce the instance by [fromJSON]{@link Layer#fromJSON} method
     * @return {Object} layer's profile JSON
     */
    toJSON(): {
        type: string;
        id: string | number;
        layers: {
            type: string;
            id: string | number;
            options: {};
        }[];
        options: {};
    };
    // @ts-expect-error
    getTileSize(id: any): Size;
    /**
     * Get tiles at zoom (or current zoom)
     * @param {Number} z
     * @returns {Object} tiles
     */
    getTiles(z: any, parentLayer: any): {
        count: number;
        tileGrids: any[];
    };
    onAdd(): void;
    onRemove(): void;
    getLayer(id: any): TileLayer;
    getChildLayer(id: any): any;
    _onLayerShowHide(e: any): this;
    _renderLayers(): this;
    _refresh(): this;
    isVisible(): boolean;
    _checkChildren(): void;
    _sortLayers(): void;
}
export default GroupTileLayer;
