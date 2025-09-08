/* eslint-disable @typescript-eslint/ban-types */

import { now, isNil, isArrayHasData, isSVG, IS_NODE, loadImage, getImageBitMap, isImageBitMap, calCanvasSize } from '../../core/util';
import Class from '../../core/Class';
import Browser from '../../core/Browser';
import Canvas2D from '../../core/Canvas';
import Actor from '../../core/worker/Actor';
import Point from '../../geo/Point';
import Extent from '../../geo/Extent';
import { imageFetchWorkerKey } from '../../core/worker/CoreWorkers';
import { registerWorkerAdapter } from '../../core/worker/Worker';
import { formatResourceUrl } from '../../core/ResourceProxy';
import { TileRenderingCanvas, ImageType } from '../types';
import { getResouceCacheInstance, ResourceCache } from '../../core/ResourceCacheManager';
import { SizeLike } from '../../geo/Size';

const EMPTY_ARRAY = [];
class ResourceWorkerConnection extends Actor {
    constructor() {
        super(imageFetchWorkerKey);
    }

    fetchImage(url: string, cb: Function) {
        const data = {
            url
        };
        this.send(data, EMPTY_ARRAY, cb);
    }
}

/**
 * 在 HTMLCanvasElement 上渲染图层的基类
 * @english
 * Base Class to render layer on HTMLCanvasElement
 * @abstract
 * @protected
 * @memberOf renderer
 * @extends Class
 */
class LayerAbstractRenderer extends Class {
    layer: any;
    resources: ResourceCache;

    context: any;
    canvas: TileRenderingCanvas;
    middleWest: Point;
    canvasExtent2D: Extent;
    //@internal
    _extent2D: Extent;
    //@internal
    _maskExtent: Extent;

    //@internal
    _painted: boolean;
    //@internal
    _drawTime: number;
    //@internal
    _frameTime: number;
    //@internal
    _resWorkerConn: ResourceWorkerConnection;

    //@internal
    _toRedraw: boolean;
    //@internal
    _loadingResource: boolean;
    //@internal
    _renderComplete: boolean;

    //@internal
    _renderZoom: number;
    //@internal
    _errorThrown: boolean;
    //@internal
    __zoomTransformMatrix: number[];
    //@internal
    _canvasUpdated: boolean;

    mapDPR?: number;

    drawOnInteracting?(...args: any[]): void;
    checkResources?(): any[];
    getImageData?(): ImageData;
    draw?(...args: any[]): void;

    /**
     * @param  {Layer} layer the layer to render
     */
    constructor(layer: any) {
        super();
        this.layer = layer;
        this._painted = false;
        this._drawTime = 0;
        if (Browser.decodeImageInWorker && !Browser.safari && !Browser.iosWeixin) {
            this._resWorkerConn = new ResourceWorkerConnection();
        }
        this.setToRedraw();
    }


    /**
     * Render the layer.
     * Call checkResources
     */
    render(framestamp?: number): void {
        this.prepareRender();
        if (!this.getMap() || !this.layer.isVisible()) {
            return;
        }
        if (!this.resources) {
            /* eslint-disable no-use-before-define */
            this.resources = getResouceCacheInstance();
            /* eslint-enable no-use-before-define */
        }
        this.checkAndDraw(this._tryToDraw, framestamp);
        this._frameTime = framestamp;
    }

    getFrameTimestamp(): number {
        return this._frameTime || 0;
    }

    checkAndDraw(drawFn, ...args) {
        this._toRedraw = false;
        if (this.checkResources) {
            const resources = this.checkResources();
            if (resources.length > 0) {
                this._loadingResource = true;
                this.loadResources(resources).then(() => {
                    this._loadingResource = false;
                    if (this.layer) {
                        /**
                         * resourceload event, fired when external resources of the layer complete loading.
                         *
                         * @event Layer#resourceload
                         * @type {Object}
                         * @property {String} type     - resourceload
                         * @property {Layer} target    - layer
                         */
                        this.layer.fire('resourceload');
                        const map = this.layer.getMap();
                        this.setToRedraw();
                        map.getRenderer().callInNextFrame(() => {
                            // sometimes renderer still fails to fetch loaded images, an additional frame will solved it
                            this.setToRedraw();
                        });
                    }
                });
            } else {
                drawFn.call(this, ...args);
            }
        } else {
            drawFn.call(this, ...args);
        }
    }

    /**
     * Check if has any external resources to load
     * If yes, load the resources before calling draw method
     * @abstract
     * @method checkResources
     * @instance
     * @returns {Array[]} an array of resource arrays [ [url1, width, height], [url2, width, height], [url3, width, height] .. ]
     * @memberOf renderer.LayerAbstractRenderer
     */

    /**
     * a required abstract method to implement
     * draw the layer when map is not interacting
     * @abstract
     * @instance
     * @method draw
     * @memberOf renderer.LayerAbstractRenderer
     */

    /**
     * an optional abstract method to implement
     * draw the layer when map is interacting (moving/zooming/dragrotating)
     * @abstract
     * @instance
     * @method drawOnInteracting
     * @param {Object} eventParam event parameters
     * @memberOf renderer.LayerAbstractRenderer
     */

    /**
     * @private
     */
    testIfNeedRedraw(): boolean {
        const map = this.getMap();
        if (this._loadingResource) {
            return false;
        }
        if (this._toRedraw) {
            return true;
        }
        if (map.isInteracting() && !this.drawOnInteracting) {
            return false;
        }
        if (this.needToRedraw()) {
            return true;
        }
        return false;
    }

    /**
     * Ask whether the layer renderer needs to redraw
     */
    needToRedraw(): boolean {
        const map = this.getMap();
        if (map.isInteracting() || map.getRenderer().isViewChanged()) {
            // don't redraw when map is moving without any pitch
            return true;
        }
        return false;
    }

    /**
     * A callback for overriding when drawOnInteracting is skipped due to low fps
     */
    onSkipDrawOnInteracting(): void { }

    isLoadingResource(): boolean {
        return this._loadingResource;
    }

    isRenderComplete(): boolean {
        return !!this._renderComplete;
    }

    /**
     * Whether must call render instead of drawOnInteracting when map is interacting
     */
    mustRenderOnInteracting(): boolean {
        return !this._painted;
    }

    /**
     * Set to redraw, ask map to call draw/drawOnInteracting to redraw the layer
     */
    setToRedraw() {
        this._toRedraw = true;
        return this;
    }

    /**
     * Remove the renderer, will be called when layer is removed
     */
    remove(): void {
        this.onRemove();
        delete this._loadingResource;
        delete this.middleWest;
        delete this.canvas;
        delete this.context;
        delete this.canvasExtent2D;
        delete this._extent2D;
        if (this.resources) {
            this.resources.remove();
        }
        delete this.resources;
        if (this._resWorkerConn) {
            this._resWorkerConn.remove();
            delete this._resWorkerConn;
        }
        delete this.layer;
    }

    onRemove(): void { }

    onAdd(): void { }

    /**
     * Get map
     */
    getMap(): any {
        if (!this.layer) {
            return null;
        }
        return this.layer.getMap();
    }

    /**
     * Clear canvas
     */
    clear(): void {
        this.clearCanvas();
    }

    /**
     * A method to help improve performance.
     * If you are sure that layer's canvas is blank, returns true to save unnecessary layer works of maps.
     */
    isBlank(): boolean {
        return !this._painted;
    }

    /**
     * Show the layer
     */
    show(): void {
        this.setToRedraw();
    }

    /**
     * Hide the layer
     */
    hide(): void {
        this.clear();
        this.setToRedraw();
    }

    /**
     * Set z-index of layer
     */
    setZIndex(_z?: number): void {
        this.setToRedraw();
    }

    /**
     * 渲染结果区域截图,主要用于事件检测处理
     * @param x
     * @param y
     * @param width
     * @param height
     * @returns
     */
    screenshotRenderResult(x: number, y: number, width: number, height: number): CanvasRenderingContext2D | null {
        if (this.canvas) {
            const tempCanvas = Canvas2D.getTempCanvas();
            tempCanvas.width = width;
            tempCanvas.height = height;
            //open willReadFrequently for getImageData Performance
            const context = Canvas2D.getCanvas2DContext(tempCanvas);
            context.clearRect(0, 0, width, height);
            context.drawImage(this.canvas, x, y, width, height, 0, 0, width, height);
            return context;
        } else {
            console.warn('not find layer canvas for screenshotRenderResult,the layerId:', this.layer.getId());
        }
    }

    /**
     * Detect if there is anything painted on the given point
     * @param point containerPoint
     */
    hitDetect(point: Point): boolean {
        if (!this.context || (this.layer.isEmpty && this.layer.isEmpty()) || this.isBlank() || this._errorThrown || (this.layer.isVisible && !this.layer.isVisible())) {
            return false;
        }
        const map = this.getMap();
        const r = this.mapDPR || map.getDevicePixelRatio();
        const size = map.getSize();
        if (point.x < 0 || point.x > size['width'] * r || point.y < 0 || point.y > size['height'] * r) {
            return false;
        }
        const x = Math.round(r * point.x), y = Math.round(r * point.y);
        const imageData = this.getImageData && this.getImageData();
        if (imageData) {
            const idx = y * imageData.width * 4 + x * 4;
            //索引下标从0开始需要-1
            return imageData.data[idx + 3] > 0;
        }
        try {
            const ctx = this.screenshotRenderResult(x, y, 2, 2);
            if (ctx) {
                const imgData = ctx.getImageData(x, y, 1, 1).data;
                if (imgData[3] > 0) {
                    return true;
                }
            }
        } catch (error) {
            if (!this._errorThrown) {
                if (console) {
                    console.warn('hit detect failed with tainted canvas, some geometries have external resources in another domain:\n', error);
                }
                this._errorThrown = true;
            }
            //usually a CORS error will be thrown if the canvas uses resources from other domain.
            //this may happen when a geometry is filled with pattern file.
            return false;
        }
        return false;

    }

    /**
     * loadResource from resourceUrls
     * @param  {String[]} resourceUrls    - Array of urls to load
     * @returns {Promise[]}
     */
    loadResources(resourceUrls: string[][]): Promise<any> {
        if (!this.resources) {
            /* eslint-disable no-use-before-define */
            this.resources = new ResourceCache();
            /* eslint-enable no-use-before-define */
        }
        const resources = this.resources,
            promises = [];
        if (isArrayHasData(resourceUrls)) {
            const cache = {};
            for (let i = resourceUrls.length - 1; i >= 0; i--) {
                const url = resourceUrls[i];
                if (!url || !url.length) {
                    continue;
                }
                const key = url.join('-');
                //Exclude ImageBitmap
                if (!isImageBitMap(url[0])) {
                    if (cache[key]) {
                        continue;
                    }
                    cache[key] = 1;
                }
                if (!resources.isResourceLoaded(url, true)) {
                    //closure it to preserve url's value
                    promises.push(new Promise(this._promiseResource(url)));
                }
            }
        }
        return Promise.all(promises);
    }

    /**
     * Prepare rendering
     * Set necessary properties, like this._renderZoom/ this.canvasExtent2D, this.middleWest
     * @private
     */
    prepareRender(): void {
        delete this._renderComplete;
        const map = this.getMap();
        this._renderZoom = map.getZoom();
        this.canvasExtent2D = this._extent2D = map.get2DExtent();
        //change from northWest to middleWest, because northwest's point <=> containerPoint changes when pitch >= 72
        this.middleWest = map._containerPointToPoint(new Point(0, map.height / 2));
    }


    /**
     * @english
     * Prepare the canvas for rendering. <br>
     * 1. Clear the canvas to blank. <br>
     * 2. Clip the canvas by mask if there is any and return the mask's extent
     * @return {PointExtent} mask's extent of current zoom's 2d point.
     */
    prepareCanvas(): any {
        const parent = this.layer.parent;
        const { canvas: mapCanvas, context: mapContext } = parent.getRenderer();
        const isMapCanvasRenderer = mapContext instanceof CanvasRenderingContext2D;
        if (!this.context) {
            if (isMapCanvasRenderer) {
                this.createContext();
            } else {
                this.canvas = mapCanvas;
                this.context = mapContext;
            }
            this.initContext();
        } else if (isMapCanvasRenderer) {
            this.clearContext();
            this.resizeCanvas();
        }
        this.prepareContext();
        delete this._maskExtent;
        const mask = this.layer.getMask();
        // this.context may be not available
        if (!mask) {
            this.layer.fire('renderstart', {
                'context': this.context
            });
            return null;
        }
        const maskExtent2D = this._maskExtent = mask._getMaskPainter().get2DExtent();
        //fix vt _extent2D is null
        if (maskExtent2D && this._extent2D && !maskExtent2D.intersects(this._extent2D)) {
            this.layer.fire('renderstart', {
                'context': this.context
            });
            return maskExtent2D;
        }
        /**
         * renderstart event, fired when layer starts to render.
         *
         * @event Layer#renderstart
         * @type {Object}
         * @property {String} type              - renderstart
         * @property {Layer} target    - layer
         * @property {CanvasRenderingContext2D} context - canvas's context
         */
        this.layer.fire('renderstart', {
            'context': this.context
        });
        return maskExtent2D;
    }

    initContext() {

    }

    prepareContext() {

    }

    clearContext() {

    }

    createContext() {
        throw new Error('createContext not implemented');
    }


    /**
     * Get renderer's current view extent in 2d point
     * @return {Object} view.extent, view.maskExtent, view.zoom, view.middleWest
     */
    getViewExtent() {
        return {
            'extent': this._extent2D,
            'maskExtent': this._maskExtent,
            'zoom': this._renderZoom,
            'middleWest': this.middleWest
        };
    }

    /**
     * call when rendering completes, this will fire necessary events and call setCanvasUpdated
     */
    completeRender(): void {
        if (this.getMap()) {
            this._renderComplete = true;
            /**
             * renderend event, fired when layer ends rendering.
             *
             * @event Layer#renderend
             * @type {Object}
             * @property {String} type              - renderend
             * @property {Layer} target    - layer
             * @property {CanvasRenderingContext2D} context - canvas's context
             */
            this.layer.fire('renderend', {
                'context': this.context
                // 'gl': this.gl
            });
            this.setCanvasUpdated();
        }
    }

    /**
     * Get renderer's event map registered on the map
     * @return {Object} events
     */
    getEvents() {
        return {
            '_zoomstart': this.onZoomStart,
            '_zooming': this.onZooming,
            '_zoomend': this.onZoomEnd,
            '_resize': this.onResize,
            '_movestart': this.onMoveStart,
            '_moving': this.onMoving,
            '_moveend': this.onMoveEnd,
            '_dragrotatestart': this.onDragRotateStart,
            '_dragrotating': this.onDragRotating,
            '_dragrotateend': this.onDragRotateEnd,
            '_spatialreferencechange': this.onSpatialReferenceChange
        };
    }

    /* eslint-disable @typescript-eslint/no-unused-vars */
    /**
     * onZoomStart
     * @param  {Object} param event parameters
     */
    onZoomStart(param: any): void {
    }

    /**
    * onZoomEnd
    * @param  {Object} param event parameters
    */
    onZoomEnd(param: any): void {
        this.setToRedraw();
    }

    /**
    * onZooming
    * @param  {Object} param event parameters
    */
    onZooming(param: any) { }

    /**
    * onMoveStart
    * @param  {Object} param event parameters
    */
    onMoveStart(param: any) { }

    /**
    * onMoving
    * @param  {Object} param event parameters
    */
    onMoving(param: any) { }

    /**
    * onMoveEnd
    * @param  {Object} param event parameters
    */
    onMoveEnd(param: any) {
        this.setToRedraw();
    }

    /**
    * onResize
    * @param  {Object} param event parameters
    */
    onResize(param: any) {
        delete this._extent2D;
        this.setToRedraw();
    }

    /**
    * onDragRotateStart
    * @param  {Object} param event parameters
    */
    onDragRotateStart(param: any) { }

    /**
    * onDragRotating
    * @param  {Object} param event parameters
    */
    onDragRotating(param: any) { }

    /**
    * onDragRotateEnd
    * @param  {Object} param event parameters
    */
    onDragRotateEnd(param: any) {
        this.setToRedraw();
    }

    /**
    * onSpatialReferenceChange
    * @param  {Object} param event parameters
    */
    onSpatialReferenceChange(param: any) {
    }

    /* eslint-disable @typescript-eslint/no-unused-vars */

    /**
     * Get ellapsed time of previous drawing
     * @return {Number}
     */
    getDrawTime() {
        return this._drawTime;
    }

    //@internal
    _tryToDraw(framestamp) {
        this._toRedraw = false;
        if (!this.canvas && this.layer.isEmpty && this.layer.isEmpty()) {
            this._renderComplete = true;
            // not to create canvas when layer is empty
            return;
        }
        this._drawAndRecord(framestamp);
    }

    //@internal
    _drawAndRecord(framestamp: number) {
        const map = this.getMap();
        if (!map) {
            return;
        }
        const painted = this._painted;
        this._painted = true;
        let t = now();

        this.mapDPR = map.getDevicePixelRatio();

        this.draw(framestamp);
        t = now() - t;
        //reduce some time in the first draw
        this._drawTime = painted ? t : t / 2;
        if (painted && this.layer && this.layer.options['logDrawTime']) {
            console.log(this.layer.getId(), 'frameTimeStamp:', framestamp, 'drawTime:', this._drawTime);
        }
    }

    //@internal
    _promiseResource(url) {
        const layer = this.layer;
        const resources = this.resources;
        const crossOrigin = layer.options['crossOrigin'];
        const renderer = layer.options['renderer'] || '';
        return (resolve) => {
            if (resources.isResourceLoaded(url, true)) {
                resolve(url);
                return;
            }
            const imageURL = formatResourceUrl(url[0]);

            if (isImageBitMap(imageURL)) {
                createImageBitmap(imageURL).then(newbitmap => {
                    //新的数据为layer提供服务
                    this._cacheResource(url, newbitmap);
                    resolve(url);
                }).catch(err => {
                    console.error(err);
                    resolve(url);
                });
                return;
            }
            const fetchInWorker = !isSVG(url[0]) && this._resWorkerConn && (layer.options['renderer'] !== 'canvas' || layer.options['decodeImageInWorker']);
            if (fetchInWorker) {
                // const uri = getAbsoluteURL(url[0]);
                this._resWorkerConn.fetchImage(imageURL, (err, data) => {
                    if (err) {
                        if (err && typeof console !== 'undefined') {
                            console.warn(err);
                        }
                        resolve(url);
                        return;
                    }
                    getImageBitMap<ImageBitmap>(data, bitmap => {
                        this._cacheResource(url, bitmap);
                        resolve(url);
                    });
                });
            } else {
                const img = new Image();
                if (!isNil(crossOrigin)) {
                    img['crossOrigin'] = crossOrigin;
                } else if (renderer !== 'canvas') {
                    img['crossOrigin'] = '';
                }
                if (isSVG(url[0]) && !IS_NODE) {
                    //amplify the svg image to reduce loading.
                    if (url[1]) { url[1] *= 2; }
                    if (url[2]) { url[2] *= 2; }
                }
                img.onload = () => {
                    this._cacheResource(url, img);
                    resolve(url);
                };
                img.onabort = function (err) {
                    if (console) { console.warn('image loading aborted: ' + url[0]); }
                    if (err) {
                        if (console) { console.warn(err); }
                    }
                    resolve(url);
                };
                img.onerror = function (err) {
                    // if (console) { console.warn('image loading failed: ' + url[0]); }
                    if (err && typeof console !== 'undefined') {
                        console.warn(err);
                    }
                    resources.markErrorResource(url);
                    resolve(url);
                };
                loadImage(img, [imageURL]);
            }
        };

    }

    //@internal
    _cacheResource(url: [string, number | string, string | number], img: ImageType) {
        if (!this.layer || !this.resources) {
            return;
        }
        let w = url[1], h = url[2];
        if (this.layer.options['cacheSvgOnCanvas'] && isSVG(url[0]) === 1 && (Browser.edge || Browser.ie)) {
            //opacity of svg img painted on canvas is always 1, so we paint svg on a canvas at first.
            if (isNil(w)) {
                w = img.width || this.layer.options['defaultIconSize'][0];
            }
            if (isNil(h)) {
                h = img.height || this.layer.options['defaultIconSize'][1];
            }
            const canvas = Canvas2D.createCanvas(w as number, h as number);
            Canvas2D.image(canvas.getContext('2d'), img, 0, 0, w as number, h as number);
            img = canvas;
        }
        this.resources.addResource(url, img);
    }

    // methods for MapCanvasRenderer

    /**
     * Only for MapCanvasRenderer
     * Mark layer's canvas updated
     */
    setCanvasUpdated() {
        this._canvasUpdated = true;
        return this;
    }

    /**
     * Only for MapCanvasRenderer
     * Only called by map's renderer to check whether the layer's canvas is updated
     * @protected
     * @return {Boolean}
     */
    isCanvasUpdated(): boolean {
        return !!this._canvasUpdated;
    }

    /**
     * Only for MapCanvasRenderer
     * Get renderer's Canvas image object
     */
    getCanvasImage(): any {
        const map = this.getMap();
        this._canvasUpdated = false;
        if (this._renderZoom !== map.getZoom() || !this.canvas || !this._extent2D) {
            return null;
        }
        if (this.isBlank()) {
            return null;
        }
        if (this.layer.isEmpty && this.layer.isEmpty()) {
            return null;
        }
        // size = this._extent2D.getSize(),
        const containerPoint = map._pointToContainerPoint(this.middleWest)._add(0, -map.height / 2);
        return {
            'image': this.canvas,
            'layer': this.layer,
            'point': containerPoint/* ,
            'size': size */
        };
    }

    clearCanvas() {

    }

    /**
     * Only for MapCanvasRenderer
     * Create renderer's Canvas
     */
    createCanvas(): void {
        if (this.canvas) {
            return;
        }
        const map = this.getMap();
        const size = map.getSize();
        const r = map.getDevicePixelRatio(),
            w = Math.round(r * size.width),
            h = Math.round(r * size.height);
        if (this.layer._canvas) {
            const canvas = this.layer._canvas;
            canvas.width = w;
            canvas.height = h;
            if (canvas.style) {
                canvas.style.width = size.width + 'px';
                canvas.style.height = size.height + 'px';
            }
            this.canvas = this.layer._canvas;
        } else {
            this.canvas = Canvas2D.createCanvas(w, h, map.CanvasClass);
        }

        this.onCanvasCreate();

    }

    onCanvasCreate() {

    }


    /**
     * Only for MapCanvasRenderer
     * Resize the canvas
     * @param canvasSize the size resizing to
     */
    resizeCanvas(canvasSize?: SizeLike): void {
        const canvas = this.canvas;
        const map = this.getMap();
        if (!canvas || canvas === map.canvas) {
            return;
        }
        const size = canvasSize || map.getSize();
        const r = map.getDevicePixelRatio();
        const { width, height, cssWidth, cssHeight } = calCanvasSize(size, r);
        // width/height不变并不意味着 css width/height 不变
        if (this.layer._canvas && (canvas.style.width !== cssWidth || canvas.style.height !== cssHeight)) {
            canvas.style.width = cssWidth;
            canvas.style.height = cssHeight;
        }

        if (canvas.width === width && canvas.height === height) {
            return;
        }
        //retina support
        canvas.height = height;
        canvas.width = width;
        if (this.context) {
            this.context.dpr = 1;
        }
        if (r !== 1 && this.context) {
            this._canvasContextScale(this.context, r);
        }
    }

    /**
     * Only for MapCanvasRenderer
     * @param context
     * @returns
     */
    clipCanvas(context: CanvasRenderingContext2D) {
        const mask = this.layer.getMask();
        if (!mask) {
            return false;
        }
        if (!this.layer.options.maskClip) {
            return false;
        }
        const old = this.middleWest;
        const map = this.getMap();
        //when clipping, layer's middleWest needs to be reset for mask's containerPoint conversion
        this.middleWest = map._containerPointToPoint(new Point(0, map.height / 2));
        //geometry 渲染逻辑里会修改globalAlpha，这里保存一下
        const alpha = context.globalAlpha;
        context.save();
        const dpr = this.mapDPR || map.getDevicePixelRatio();
        if (dpr !== 1) {
            context.save();
            this._canvasContextScale(context, dpr);
        }
        // Handle MultiPolygon
        if (mask.getGeometries) {
            context.isMultiClip = true;
            const masks = mask.getGeometries() || [];
            context.beginPath();
            masks.forEach(_mask => {
                const painter = _mask._getMaskPainter();
                painter.paint(null, context);
            });
            context.stroke();
            context.isMultiClip = false;
        } else {
            context.isClip = true;
            context.beginPath();
            const painter = mask._getMaskPainter();
            painter.paint(null, context);
            context.isClip = false;
        }
        if (dpr !== 1) {
            context.restore();
        }
        try {
            context.clip('evenodd');
        } catch (error) {
            console.error(error);
        }
        this.middleWest = old;
        context.globalAlpha = alpha;
        return true;
    }

    //@internal
    _canvasContextScale(context: CanvasRenderingContext2D, dpr: number) {
        if (!context.scale) {
            return this;
        }
        context.scale(dpr, dpr);
        context.dpr = dpr;
        return this;
    }
}

export default LayerAbstractRenderer;


const workerSource = `
function (exports) {
    exports.onmessage = function (msg, postResponse) {
        var url = msg.data.url;
        var fetchOptions = msg.data.fetchOptions;
        requestImageOffscreen(url, function (err, data) {
            var buffers = [];
            if (data && data.data) {
                buffers.push(data.data);
            }
            postResponse(err, data, buffers);
        }, fetchOptions);
    };

    function requestImageOffscreen(url, cb, fetchOptions) {
        fetch(url, fetchOptions ? fetchOptions : {})
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => {
                const blob=new Blob([arrayBuffer]);
                return createImageBitmap(blob);
            })
            .then(bitmap => {
                cb(null, {data:bitmap});
            }).catch(err => {
                console.error('error when loading tile:', url);
                console.error(err);
                cb(err);
            });
    }
}`;

function registerWorkerSource() {
    if (!Browser.decodeImageInWorker) {
        return;
    }
    registerWorkerAdapter(imageFetchWorkerKey, function () { return workerSource; });
}

registerWorkerSource();
