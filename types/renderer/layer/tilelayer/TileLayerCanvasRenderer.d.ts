import { default as TileLayer } from '../../../layer/tile/TileLayer';
import CanvasRenderer from '../CanvasRenderer';
import Actor from '../../../core/worker/Actor';
declare class TileWorkerConnection extends Actor {
    constructor();
    checkUrl(url: any): any;
    fetchImage(url: any, workerId: any, cb: any, fetchOptions: any): void;
}
/**
 * @classdesc
 * Renderer class based on HTML5 Canvas2D for TileLayers
 * @class
 * @protected
 * @memberOf renderer
 * @extends {renderer.CanvasRenderer}
 */
declare class TileLayerCanvasRenderer extends CanvasRenderer {
    layer: TileLayer;
    tilesInView: object;
    tilesLoading: object;
    _parentTiles: Array<any>;
    _childTiles: Array<any>;
    _tileQueue: Array<any>;
    tileCache: any;
    _tileImageWorkerConn: TileWorkerConnection;
    _compareTiles: Function;
    _tileZoom: number;
    _renderTimestamp: number;
    _frameTiles: any;
    _frameTileGrids: any;
    drawingChildTiles: boolean;
    drawingParentTiles: boolean;
    drawingCurrentTiles: boolean;
    loadTileBitmap: Function;
    avgMinAltitude: number;
    avgMaxAltitude: number;
    _tilePlaceHolder: any;
    /**
     *
     * @param {TileLayer} layer - TileLayer to render
     */
    constructor(layer: any);
    getCurrentTileZoom(): number;
    draw(timestamp: any, context: any): void;
    getTileGridsInCurrentFrame(): any;
    _getTilesInCurrentFrame(): {
        childTiles: any[];
        parentTiles: any[];
        tiles: any[];
        placeholders: any[];
        loading: boolean;
        loadingCount: number;
        tileQueue: {};
    };
    removeTileCache(tileId: any): void;
    isTileCachedOrLoading(tileId: any): any;
    isTileCached(tileId: any): boolean;
    isTileFadingIn(tileImage: any): boolean;
    _drawTiles(tiles: any, parentTiles: any, childTiles: any, placeholders: any, parentContext: any): void;
    onDrawTileStart(): void;
    onDrawTileEnd(): void;
    _drawTile(info: any, image: any, parentContext: any): void;
    _drawTileAndCache(tile: any, parentContext: any): void;
    drawOnInteracting(event: any, timestamp: any, context: any): void;
    needToRedraw(): boolean;
    hitDetect(): boolean;
    _getLoadLimit(): any;
    isDrawable(): boolean;
    clear(): void;
    _isLoadingTile(tileId: any): boolean;
    clipCanvas(context: any): boolean;
    _clipByPitch(ctx: any): boolean;
    loadTileQueue(tileQueue: any): void;
    loadTile(tile: any): {};
    _fetchImage(image: any, tile: any): void;
    loadTileImage(tileImage: any, url: any): void;
    abortTileLoading(tileImage: any): void;
    onTileLoad(tileImage: any, tileInfo: any): void;
    _consumeTileQueue(): void;
    _computeAvgTileAltitude(): void;
    checkTileInQueue(): boolean;
    consumeTile(tileImage: any, tileInfo: any): void;
    resetTileLoadTime(tileImage: any): void;
    onTileError(tileImage: any, tileInfo: any): void;
    drawTile(tileInfo: any, tileImage: any): void;
    getDebugInfo(tileId: any): string;
    _findChildTiles(info: any): any[];
    _findChildTilesAt(children: any, pmin: any, pmax: any, layer: any, childZoom: any): void;
    _findParentTile(info: any): any;
    isValidCachedTile(tile: any): boolean;
    isTileComplete(): boolean;
    _getLayerOfTile(layerId: any): any;
    _getCachedTile(tileId: any, isParent: any): any;
    _addTileToCache(tileInfo: any, tileImage: any): void;
    getTileOpacity(tileImage: any, tileInfo: any): number;
    _getTileFadingOpacity(tileImage: any): number;
    onRemove(): void;
    _markTiles(): number[];
    _retireTiles(force?: any): void;
    deleteTile(tile: any): void;
    _generatePlaceHolder(res: any): any;
}
export default TileLayerCanvasRenderer;
