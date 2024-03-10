import Class from '../../core/Class';
import Actor from '../../core/worker/Actor';
import Point from '../../geo/Point';
import Layer from './../../layer/Layer';
import { PointExtent } from './../../geo';
import Map from '../../map/Map'
declare class ResourceWorkerConnection extends Actor {
    constructor();
    fetchImage(url: any, cb: any): void;
}
/**
 * @classdesc
 * Base Class to render layer on HTMLCanvasElement
 * @abstract
 * @protected
 * @memberOf renderer
 * @extends Class
 */
declare class CanvasRenderer extends Class {
    layer: Layer;
    _painted: boolean;
    _drawTime: number;
    _resWorkerConn: ResourceWorkerConnection;
    resources: any;
    _toRedraw: boolean;
    _loadingResource: boolean;
    drawOnInteracting: boolean;
    _renderComplete: boolean;
    _canvasUpdated: boolean;
    southWest: any;
    canvas: any;
    context: CanvasRenderingContext2D;
    canvasExtent2D: PointExtent;
    _extent2D: PointExtent;
    _renderZoom: number;
    gl: WebGL2RenderingContext;
    _maskExtent: any;
    mapStateCache: any;
    /**
     * @param  {Layer} layer the layer to render
     */
    constructor(layer: any);
    /**
     * Render the layer.
     * Call checkResources
     */
    render(framestamp?: any): void;
    checkAndDraw(drawFn: any, ...args: any[]): void;
    /**
     * Check if has any external resources to load
     * If yes, load the resources before calling draw method
     * @abstract
     * @method checkResources
     * @instance
     * @returns {Array[]} an array of resource arrays [ [url1, width, height], [url2, width, height], [url3, width, height] .. ]
     * @memberOf renderer.CanvasRenderer
     */
    /**
     * a required abstract method to implement
     * draw the layer when map is not interacting
     * @abstract
     * @instance
     * @method draw
     * @memberOf renderer.CanvasRenderer
     */
    /**
     * an optional abstract method to implement
     * draw the layer when map is interacting (moving/zooming/dragrotating)
     * @abstract
     * @instance
     * @method drawOnInteracting
     * @param {Object} eventParam event parameters
     * @memberOf renderer.CanvasRenderer
     */
    /**
     * @private
     */
    testIfNeedRedraw(): boolean;
    /**
     * Ask whether the layer renderer needs to redraw
     * @return {Boolean}
     */
    needToRedraw(): boolean;
    /**
     * A callback for overriding when drawOnInteracting is skipped due to low fps
     */
    onSkipDrawOnInteracting(): void;
    isLoadingResource(): boolean;
    isRenderComplete(): boolean;
    /**
     * Whether must call render instead of drawOnInteracting when map is interacting
     */
    mustRenderOnInteracting(): boolean;
    /**
     * Set to redraw, ask map to call draw/drawOnInteracting to redraw the layer
     */
    setToRedraw(): this;
    /**
     *  Mark layer's canvas updated
     */
    setCanvasUpdated(): this;
    /**
     * Only called by map's renderer to check whether the layer's canvas is updated
     * @protected
     * @return {Boolean}
     */
    isCanvasUpdated(): boolean;
    /**
     * Remove the renderer, will be called when layer is removed
     */
    remove(): void;
    onRemove(): void;
    onAdd(): void;
    /**
     * Get map
     * @return {Map}
     */
    getMap(): Map;
    /**
     * Get renderer's Canvas image object
     * @return {HTMLCanvasElement}
     */
    getCanvasImage(): {
        image: any;
        layer: Layer;
        point: Point;
    };
    /**
     * Clear canvas
     */
    clear(): void;
    /**
     * A method to help improve performance.
     * If you are sure that layer's canvas is blank, returns true to save unnecessary layer works of maps.
     * @return {Boolean}
     */
    isBlank(): boolean;
    /**
     * Show the layer
     */
    show(): void;
    /**
     * Hide the layer
     */
    hide(): void;
    /**
     * Set z-index of layer
     */
    setZIndex(): void;
    /**
     * Detect if there is anything painted on the given point
     * @param  {Point} point containerPoint
     * @return {Boolean}
     */
    hitDetect(point: any): boolean;
    /**
     * loadResource from resourceUrls
     * @param  {String[]} resourceUrls    - Array of urls to load
     * @param  {Function} onComplete          - callback after loading complete
     * @param  {Object} context         - callback's context
     * @returns {Promise[]}
     */
    loadResources(resourceUrls: any): any;
    /**
     * Prepare rendering
     * Set necessary properties, like this._renderZoom/ this.canvasExtent2D, this.southWest
     * @private
     */
    prepareRender(): void;
    /**
     * Create renderer's Canvas
     */
    createCanvas(): void;
    onCanvasCreate(): void;
    createContext(): void;
    resetCanvasTransform(): void;
    /**
     * Resize the canvas
     * @param  {Size} canvasSize the size resizing to
     */
    resizeCanvas(canvasSize?: any): void;
    /**
     * Clear the canvas to blank
     */
    clearCanvas(): void;
    /**
     * Prepare the canvas for rendering. <br>
     * 1. Clear the canvas to blank. <br>
     * 2. Clip the canvas by mask if there is any and return the mask's extent
     * @return {PointExtent} mask's extent of current zoom's 2d point.
     */
    prepareCanvas(): any;
    clipCanvas(context: any): boolean;
    /**
     * Get renderer's current view extent in 2d point
     * @return {Object} view.extent, view.maskExtent, view.zoom, view.southWest
     */
    getViewExtent(): {
        extent: PointExtent;
        maskExtent: any;
        zoom: number;
        southWest: any;
    };
    /**
     * call when rendering completes, this will fire necessary events and call setCanvasUpdated
     */
    completeRender(): void;
    /**
     * Get renderer's event map registered on the map
     * @return {Object} events
     */
    getEvents(): {
        _zoomstart: () => void;
        _zooming: () => void;
        _zoomend: () => void;
        _resize: () => void;
        _movestart: () => void;
        _moving: () => void;
        _moveend: () => void;
        _dragrotatestart: () => void;
        _dragrotating: () => void;
        _dragrotateend: () => void;
        _spatialreferencechange: () => void;
    };
    /**
    /**
     * onZoomStart
     * @param  {Object} param event parameters
     */
    onZoomStart(): void;
    /**
    * onZoomEnd
    * @param  {Object} param event parameters
    */
    onZoomEnd(): void;
    /**
    * onZooming
    * @param  {Object} param event parameters
    */
    onZooming(): void;
    /**
    * onMoveStart
    * @param  {Object} param event parameters
    */
    onMoveStart(): void;
    /**
    * onMoving
    * @param  {Object} param event parameters
    */
    onMoving(): void;
    /**
    * onMoveEnd
    * @param  {Object} param event parameters
    */
    onMoveEnd(): void;
    /**
    * onResize
    * @param  {Object} param event parameters
    */
    onResize(): void;
    /**
    * onDragRotateStart
    * @param  {Object} param event parameters
    */
    onDragRotateStart(): void;
    /**
    * onDragRotating
    * @param  {Object} param event parameters
    */
    onDragRotating(): void;
    /**
    * onDragRotateEnd
    * @param  {Object} param event parameters
    */
    onDragRotateEnd(): void;
    /**
    * onSpatialReferenceChange
    * @param  {Object} param event parameters
    */
    onSpatialReferenceChange(): void;
    /**
     * Get ellapsed time of previous drawing
     * @return {Number}
     */
    getDrawTime(): number;
    _tryToDraw(framestamp: any): void;
    _drawAndRecord(framestamp: any): void;
    _promiseResource(url: any): (resolve: any) => void;
    _cacheResource(url: any, img: any): void;
}
export default CanvasRenderer;
export declare class ResourceCache {
    resources: object;
    _errors: object;
    constructor();
    addResource(url: any, img: any): void;
    isResourceLoaded(url: any, checkSVG?: any): boolean;
    login(url: any): void;
    logout(url: any): void;
    getImage(url: any): any;
    markErrorResource(url: any): void;
    merge(res: any): this;
    forEach(fn: any): this;
    _getImgUrl(url: any): any;
    remove(): void;
}
