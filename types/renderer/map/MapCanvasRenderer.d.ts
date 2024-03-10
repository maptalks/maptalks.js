import MapRenderer from './MapRenderer';
/**
 * @classdesc
 * Renderer class based on HTML5 Canvas for maps.
 * @class
 * @protected
 * @extends {renderer.MapRenderer}
 * @memberOf renderer
 */
declare class MapCanvasRenderer extends MapRenderer {
    _containerIsCanvas: boolean;
    _loopTime: number;
    _isViewChanged: boolean;
    _needClear: boolean;
    _mapview: object;
    _spatialRefChanged: boolean;
    _canvasUpdated: boolean;
    _zoomMatrix: any;
    _eventParam: any;
    _canvasIds: Array<any>;
    _updatedIds: Array<any>;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    _resizeInterval: any;
    _resizeObserver: ResizeObserver;
    _frameTimestamp: number;
    _resizeCount: number;
    _animationFrame: number;
    topLayer: HTMLCanvasElement;
    topCtx: CanvasRenderingContext2D;
    _checkPositionTime: number;
    _checkSizeInterval: number;
    _hitDetectFrame: number;
    _tops: Array<any>;
    /**
     * @param {Map} map - map for the renderer
     */
    constructor(map: any);
    load(): void;
    /**
     * render layers in current frame
     * @return {Boolean} return false to cease frame loop
     */
    renderFrame(framestamp: any): boolean;
    updateMapDOM(): void;
    drawLayers(layers: any, framestamp: any): void;
    /**
     * check if need to call layer's draw/drawInteracting
     * @param  {Layer} layer
     * @return {Boolean}
     */
    _checkLayerRedraw(layer: any): any;
    /**
     * Draw canvas rendered layer when map is interacting
     * @param  {Layer} layer
     * @param  {Number} t     current consumed time of layer drawing
     * @param  {Number} timeLimit time limit for layer drawing
     * @return {Number}       time to draw this layer
     * @private
     */
    _drawCanvasLayerOnInteracting(layer: any, t: any, timeLimit: any, framestamp: any): any;
    /**
     * Fire layerload events.
     * Make sure layer are drawn on map when firing the events
     * @private
     */
    _fireLayerLoadEvents(): void;
    isLayerCanvasUpdated(): boolean;
    setLayerCanvasUpdated(): void;
    /**
     * Renders the layers
     */
    drawLayerCanvas(layers: any): boolean;
    setToRedraw(): void;
    updateMapSize(size: any): void;
    getMainPanel(): any;
    toDataURL(mimeType: any, quality: any): string;
    remove(): void;
    hitDetect(point: any): void;
    _getLayerImage(layer: any): any;
    /**
     * initialize container DOM of panels
     */
    initContainer(): void;
    /**
     * Is current map's state changed?
     * @return {Boolean}
     */
    isViewChanged(): boolean;
    _recordView(): void;
    isSpatialReferenceChanged(): boolean;
    _getMapView(): {
        x: any;
        y: any;
        zoom: any;
        pitch: any;
        bearing: any;
        width: any;
        height: any;
    };
    /**
    * Main frame loop
    */
    _frameLoop(framestamp: any): void;
    _cancelFrameLoop(): void;
    _drawLayerCanvasImage(layer: any, layerImage: any, targetWidth: any, targetHeight: any): void;
    _drawCenterCross(): void;
    _drawContainerExtent(): void;
    _drawFog(): void;
    _debugSky(): this;
    _getAllLayerToRender(): any;
    clearCanvas(): void;
    _updateCanvasSize(): boolean;
    createCanvas(): void;
    _updateDomPosition(framestamp: any): this;
    _checkSize(): void;
    _setCheckSizeInterval(interval: any): void;
    _registerEvents(): void;
    _onMapMouseMove(param: any): void;
    _getCanvasLayers(): any;
    addTopElement(e: any): void;
    removeTopElement(e: any): void;
    getTopElements(): any[];
    drawTops(): void;
}
export default MapCanvasRenderer;
