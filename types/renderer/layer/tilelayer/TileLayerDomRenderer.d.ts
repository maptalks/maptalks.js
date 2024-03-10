import Class from '../../../core/Class';
import TileLayer from '../../../layer/tile/TileLayer';
import { PointExtent } from './../../../geo';
import Map from '../../../map/Map'
/**
 * @classdesc
 * @deprecated
 *
 * A renderer based on HTML Doms for TileLayers.
 * It is implemented based on Leaflet's GridLayer.
 *
 * It is deprecated and replaced by {TileLayerGLRenderer}
 * @class
 * @protected
 * @memberOf renderer
 * @extends {Class}
 */
declare class TileLayerDomRenderer extends Class {
    layer: TileLayer;
    _tiles: object;
    _fadeAnimated: boolean;
    _container: any;
    _zIndex: number;
    _renderTime: number;
    _curAnimZoom: number;
    _startZoom: number;
    _endZoom: number;
    _tileZoom: number;
    _preLoaded: boolean;
    _redraw: boolean;
    _zoomParam: any;
    _levelContainers: any;
    _tileExtent: PointExtent;
    _centerOffset: any;
    _anchor: any;
    _preAnchor: any;
    _reported: boolean;
    _fadeFrame: number;
    _pruneTimeout: number;
    _mapOffset: any;
    /**
     * @param {TileLayer} layer - layer of the renderer
     */
    constructor(layer: any);
    getMap(): Map;
    show(): void;
    hide(): void;
    remove(): void;
    clear(): void;
    setZIndex(z: any): void;
    prepareRender(): void;
    render(): void;
    drawOnInteracting(): void;
    _preloadTiles(tiles: any): void;
    needToRedraw(): boolean;
    setToRedraw(): void;
    _drawOnZooming(): void;
    _drawOnMoving(): void;
    _drawOnDragRotating(): void;
    _renderTiles(escapeTileLoading?: any): void;
    _getTileQueue(tileGrid: any): any[];
    /**
     * Update container's transform style in the following cases :
     * 1 at an integer zoom
     * 2 at a fractional zoom
     * 3 with domCssMatrix(pitch/bearing) at an integer zoom
     * 4 with domCssMatrix(pitch/bearing) at a fractional zoom
     * @private
     */
    _updateContainer(): void;
    _resetDomCssMatrix(): void;
    _getTileSize(): number[];
    _loadTile(tile: any): HTMLElement;
    _createTile(tile: any, done: any): HTMLElement;
    _tileReady(err: any, tile: any): void;
    _tileOnLoad(done: any, tile: any): void;
    _tileOnError(done: any, tile: any): void;
    _noTilesToLoad(): boolean;
    _updateOpacity(): void;
    _pruneTiles(pruneLevels?: boolean): void;
    _pruneLevels(): void;
    _removeTileContainer(z: any): void;
    _removeTile(key: any): void;
    _removeTilesAtZoom(zoom: any): void;
    _removeAllTiles(): void;
    _getTileContainer(zoom: any): any;
    _createLayerContainer(): void;
    _clearLayerContainer(): void;
    _removeLayerContainer(): void;
    getEvents(): {
        _zoomstart: (param: any) => void;
        '_touchzoomstart _dragrotatestart': (pruneLevels?: boolean) => void;
        _movestart: () => void;
        _zooming: (param: any) => void;
        _zoomend: () => void;
        _dragrotateend: () => void;
    };
    _canTransform(): boolean;
    _show(): void;
    _hide(): void;
    _posTileImage(tileImage: any, pos: any): void;
    onMoveStart(): void;
    onZoomStart(param: any): void;
    onZooming(param: any): void;
    onZoomEnd(): void;
    _abortLoading(removeDOM?: any): void;
}
export default TileLayerDomRenderer;
