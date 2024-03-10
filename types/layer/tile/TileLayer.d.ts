import Size from '../../geo/Size';
import PointExtent from '../../geo/PointExtent';
import Layer, { LayerOptionsType } from '../Layer';
import SpatialReference from '../../map/spatial-reference/SpatialReference';
declare class TileHashset {
    _table: any;
    constructor();
    add(key: any): void;
    has(key: any): any;
    reset(): void;
}
export type TileLayerOptionsType = LayerOptionsType & {
    'urlTemplate': string;
    'subdomains'?: Array<any>;
    'errorUrl'?: string;
    'repeatWorld'?: boolean;
    'background'?: boolean;
    'loadingLimitOnInteracting'?: number;
    'tileRetryCount'?: number;
    'placeholder'?: number;
    'crossOrigin'?: string;
    'tileSize'?: Array<number>;
    'offset'?: Array<number>;
    'tileSystem'?: Array<number>;
    'fadeAnimation'?: boolean;
    'fadeDuration'?: number;
    'debug'?: boolean;
    'spatialReference'?: any;
    'maxCacheSize'?: number;
    'renderer'?: string;
    'clipByPitch'?: boolean;
    'maxAvailableZoom'?: number;
    'cascadeTiles'?: boolean;
    'zoomOffset'?: number;
    'pyramidMode'?: boolean;
    'decodeImageInWorker'?: boolean;
    'tileLimitPerFrame'?: number;
    'tileStackStartDepth'?: number;
    'tileStackDepth'?: number;
    'awareOfTerrain'?: boolean;
};
/**
 * @classdesc
 * A layer used to display tiled map services, such as [google maps]{@link http://maps.google.com}, [open street maps]{@link http://www.osm.org}
 * @category layer
 * @extends Layer
 * @param {String|Number} id - tile layer's id
 * @param {Object} [options=null] - options defined in [TileLayer]{@link TileLayer#options}
 * @example
 * new TileLayer("tile",{
        urlTemplate : 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        subdomains:['a','b','c']
    })
 */
declare class TileLayer extends Layer {
    _tileSize: Size;
    _coordCache: object;
    _disablePyramid: any;
    _hasOwnSR: any;
    _tileFullExtent: PointExtent;
    _rootNodes: any;
    _visitedTiles: TileHashset;
    tileInfoCache: any;
    _zScale: number;
    _sr: any;
    _srMinZoom: number;
    _srMaxZoom: number;
    _tileOffsets: object;
    _defaultTileConfig: any;
    _tileConfig: any;
    _polygonOffset: number;
    constructor(id: any, options?: TileLayerOptionsType);
    /**
     * Reproduce a TileLayer from layer's profile JSON.
     * @param  {Object} layerJSON - layer's profile JSON
     * @return {TileLayer}
     * @static
     * @private
     * @function
     */
    static fromJSON(layerJSON: any): TileLayer;
    /**
     * force Reload tilelayer.
     * Note that this method will clear all cached tiles and reload them. It shouldn't be called frequently for performance reason.

     * @return {TileLayer} this
     */
    forceReload(): this;
    /**
     * Get tile size of the tile layer
     * @return {Size}
     */
    getTileSize(): Size;
    getTiles(z?: number, parentLayer?: any): any;
    _isPyramidMode(): boolean;
    _getTileFullExtent(): PointExtent;
    _getRootNodes(offset0: any): any;
    _getRootError(): number;
    _getPyramidTiles(z: any, layer: any): any;
    isParentTile(z: any, maxZoom: any, tile: any): boolean;
    _splitNode(node: any, projectionView: any, queue: any, tiles: any, gridExtent: any, maxZoom: any, offset: any, parentRenderer: any, glRes: any): void;
    _isTileVisible(node: any, projectionView: any, glScale: any, maxZoom: any, offset: any): 0 | 1 | -1;
    _isTileInFrustum(node: any, projectionView: any, glScale: any, offset: any): any;
    /**
     * Compute tile's SSE
     * from Cesium
     * 与cesium不同的是，我们用boundingVolume顶面的四个顶点中的最小值作为distanceToCamera
     */
    _getScreenSpaceError(node: any, glScale: any, maxZoom: any, offset: any): number;
    /**
     * Get tiles at zoom z (or current zoom)
     * @param {Number} z - zoom
     * @return {Object[]} tile descriptors
     */
    _getCascadeTiles(z: any, parentLayer: any): {
        tileGrids: any[];
        count: number;
    };
    /**
     * Get tile's url
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @returns {String} url
     */
    getTileUrl(x: any, y: any, z: any): any;
    /**
     * Clear the layer
     * @return {TileLayer} this
     */
    clear(): this;
    /**
     * Export the tile layer's profile json. <br>
     * Layer's profile is a snapshot of the layer in JSON format. <br>
     * It can be used to reproduce the instance by [fromJSON]{@link Layer#fromJSON} method
     * @return {Object} layer's profile JSON
     */
    toJSON(): {
        type: string;
        id: string | number;
        options: {};
    };
    /**
     * Get tilelayer's spatial reference.
     * @returns {SpatialReference} spatial reference
     */
    getSpatialReference(): SpatialReference;
    getMinZoom(): number;
    getMaxZoom(): number;
    _getTileZoom(zoom?: any): any;
    _getTiles(tileZoom: any, containerExtent: any, cascadeLevel: any, parentRenderer: any, ignoreMinZoom?: any): {
        zoom: any;
        extent: any;
        offset: any;
        tiles: any[];
    };
    _convertToExtent2d(containerExtent: any): any;
    _splitTiles(frustumMatrix: any, tiles: any, renderer: any, tileIdx: any, z: any, res: any, tileExtent: any, dx: any, dy: any, tileOffsets: any, parentRenderer: any): void;
    _checkAndAddTile(frustumMatrix: any, renderer: any, idx: any, idy: any, x: any, y: any, z: any, res: any, i: any, j: any, w: any, h: any, corner: any, glScale: any, tileOffsets: any, parentRenderer: any): any;
    _getTileOffset(z: any): any;
    _getTileId(x: any, y: any, zoom: any, id?: any): string;
    _project(pcoord: any, out: any): any;
    _unproject(pcoord: any, out: any): any;
    /**
     * initialize [tileConfig]{@link TileConfig} for the tilelayer
     * @private
     */
    _initTileConfig(): void;
    _getTileConfig(): any;
    _bindMap(map: any): any;
    _isTileInExtent(frustumMatrix: any, tileExtent: any, offset: any, glScale: any): any;
    _isSplittedTileInExtent(frustumMatrix: any, tileExtent: any, offset: any, glScale: any): any;
    getEvents(): {
        spatialreferencechange: () => void;
    };
    _onSpatialReferenceChange(): void;
    /**
     * Get layer's polygonOffset count
     * @return {Number}
     */
    getPolygonOffsetCount(): number;
    /**
     * Get layer's base polygon offset
     * @return {Number}
     */
    getPolygonOffset(): number;
    /**
     * Set layer's base polygon offset, called by GroupGLLayer
     * @param {Number} offset polygon offset
     * @return {TileLayer}
     */
    setPolygonOffset(offset: any): this;
}
export default TileLayer;
