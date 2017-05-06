import { now, isNil, isArrayHasData, isSVG, IS_NODE, loadImage, callImmediate, clearCallImmediate } from 'core/util';
import Class from 'core/Class';
import Browser from 'core/Browser';
import Promise from 'core/Promise';
import Canvas2D from 'core/Canvas';
import Point from 'geo/Point';

/**
 * @classdesc
 * Base Class to render layer on HTMLCanvasElement
 * @abstract
 * @protected
 * @memberOf renderer
 * @extends Class
 */
class CanvasRenderer extends Class {

    /**
     * @param  {Layer} layer the layer to render
     */
    constructor(layer) {
        super();
        this.layer = layer;
        this._drawTime = -1;
    }

    /**
     * Whether it's a renderer based on Canvas
     * @return {Boolean}
     */
    isCanvasRender() {
        return true;
    }

    /**
     * Render the layer
     * @param  {Boolean} isCheckRes whether to check and load external resources in the layer
     */
    render() {
        this.prepareRender();
        if (!this.getMap() || !this.layer.isVisible()) {
            return;
        }
        if (!this.resources) {
            /* eslint-disable no-use-before-define */
            this.resources = new ResourceCache();
            /* eslint-enable no-use-before-define */
        }
        if (this.checkResources) {
            const resources = this.checkResources();
            if (resources.length > 0) {
                this.loadResources(resources).then(() => {
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
                        this._tryToDraw();
                    }
                });
            } else {
                this._tryToDraw(this);
            }
        } else {
            this._tryToDraw(this);
        }
    }

    /**
     * Remove the renderer, will be called when layer is removed
     */
    remove() {
        this._cancelDrawFrame();
        if (this.onRemove) {
            this.onRemove();
        }
        delete this._northWest;
        delete this.canvas;
        delete this.context;
        delete this._extent2D;
        delete this.resources;
        // requestMapToRender may be overrided, e.g. renderer.TileLayer.Canvas
        CanvasRenderer.prototype.requestMapToRender.call(this);
        delete this.layer;
    }

    /**
     * Get map
     * @return {Map}
     */
    getMap() {
        if (!this.layer) {
            return null;
        }
        return this.layer.getMap();
    }

    /**
     * Get renderer's Canvas image object
     * @return {HTMLCanvasElement}
     */
    getCanvasImage() {
        if (this._renderZoom !== this.getMap().getZoom() || !this.canvas || !this._extent2D) {
            return null;
        }
        if (this.isBlank()) {
            return null;
        }
        if (this.layer.isEmpty && this.layer.isEmpty()) {
            return null;
        }
        const map = this.getMap(),
            size = this._extent2D.getSize(),
            // point = this._extent2D.getMin(),
            containerPoint = map._pointToContainerPoint(this._northWest);
        return {
            'image': this.canvas,
            'layer': this.layer,
            'point': containerPoint,
            'size': size
        };
    }

    clear() {
        this.clearCanvas();
        this.requestMapToRender();
    }

    isBlank() {
        return false;
    }

    /**
     * Show the layer
     */
    show() {
        this.render();
    }

    /**
     * Hide the layer
     */
    hide() {
        this.clear();
    }

    setZIndex(/*z*/) {
        this.requestMapToRender();
    }

    /**
     * Detect if there is anything painted on the given point
     * @param  {Point} point a 2d point on current zoom
     * @return {Boolean}
     */
    hitDetect(point) {
        if (!this.context || (this.layer.isEmpty && this.layer.isEmpty()) || this.isBlank() || this._errorThrown) {
            return false;
        }
        const map = this.getMap();
        const size = map.getSize();
        if (point.x < 0 || point.x > size['width'] || point.y < 0 || point.y > size['height']) {
            return false;
        }
        try {
            const imgData = this.context.getImageData(point.x, point.y, 1, 1).data;
            if (imgData[3] > 0) {
                return true;
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
     * @param  {Function} onComplete          - callback after loading complete
     * @param  {Object} context         - callback's context
     * @returns {Promise[]}
     */
    loadResources(resourceUrls) {
        const resources = this.resources,
            promises = [];
        if (isArrayHasData(resourceUrls)) {
            const cache = {};
            for (let i = resourceUrls.length - 1; i >= 0; i--) {
                const url = resourceUrls[i];
                if (!url || !url.length || cache[url.join('-')]) {
                    continue;
                }
                cache[url.join('-')] = 1;
                if (!resources.isResourceLoaded(url, true)) {
                    //closure it to preserve url's value
                    promises.push(new Promise(this._promiseResource(url)));
                }
            }
        }
        return Promise.all(promises);
    }

    /**
     * Prepare rendering,
     */
    prepareRender() {
        const map = this.getMap();
        this._renderZoom = map.getZoom();
        this._extent2D = map._get2DExtent();
        this._northWest = map._containerPointToPoint(new Point(0, 0));
    }

    /**
     * Create renderer's Canvas
     */
    createCanvas() {
        if (this.canvas) {
            return;
        }
        const map = this.getMap();
        const size = map.getSize();
        const r = Browser.retina ? 2 : 1;
        this.canvas = Canvas2D.createCanvas(r * size['width'], r * size['height'], map.CanvasClass);
        this.context = this.canvas.getContext('2d');
        if (this.layer.options['globalCompositeOperation']) {
            this.context.globalCompositeOperation = this.layer.options['globalCompositeOperation'];
        }
        if (Browser.retina) {
            this.context.scale(r, r);
        }
        Canvas2D.setDefaultCanvasSetting(this.context);
        if (this.onCanvasCreate) {
            this.onCanvasCreate();
        }
    }

    /**
     * Resize the canvas
     * @param  {Size} canvasSize the size resizing to
     */
    resizeCanvas(canvasSize) {
        if (!this.canvas) {
            return;
        }
        let size;
        if (!canvasSize) {
            const map = this.getMap();
            size = map.getSize();
        } else {
            size = canvasSize;
        }
        const r = Browser.retina ? 2 : 1;
        if (this.canvas.width === r * size['width'] && this.canvas.height === r * size['height']) {
            return;
        }
        //retina support
        this.canvas.height = r * size['height'];
        this.canvas.width = r * size['width'];
        if (Browser.retina) {
            this.context.scale(r, r);
        }
    }

    /**
     * Clear the canvas to blank
     */
    clearCanvas() {
        if (!this.canvas) {
            return;
        }
        Canvas2D.clearRect(this.context, 0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Prepare the canvas for rendering. <br>
     * 1. Clear the canvas to blank. <br>
     * 2. Clip the canvas by mask if there is any and return the mask's extent
     * @return {PointExtent} mask's extent of current zoom's 2d point.
     */
    prepareCanvas() {
        if (this._clipped) {
            this.context.restore();
            this._clipped = false;
        }
        if (!this.canvas) {
            this.createCanvas();
        } else {
            this.clearCanvas();
        }
        delete this._maskExtent;
        const mask = this.layer.getMask();
        if (!mask) {
            this.layer.fire('renderstart', {
                'context': this.context
            });
            return null;
        }
        const maskExtent2D = this._maskExtent = mask._getPainter().get2DExtent();
        if (!maskExtent2D.intersects(this._extent2D)) {
            this.layer.fire('renderstart', {
                'context': this.context
            });
            return maskExtent2D;
        }
        this.context.save();
        mask._paint();
        this.context.clip();
        this._clipped = true;
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

     /**
     * Get renderer's current view extent in 2d point
     * @return {Object} view.extent, view.maskExtent, view.zoom, view.northWest
     */
    getViewExtent() {
        return {
            'extent' : this._extent2D,
            'maskExtent' : this._maskExtent,
            'zoom' : this._renderZoom,
            'northWest' : this._northWest
        };
    }

    /**
     * Request map to render, to redraw all layer's canvas on map's canvas.<br>
     * This should be called once any canvas layer is updated
     */
    requestMapToRender() {
        if (this.getMap()) {
            if (this.context) {
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
                });
            }
            this.getMap()._getRenderer().render();
        }
    }

    /**
     * Ask the layer to fire the layerload event
     */
    fireLoadedEvent() {
        if (this.layer) {
            /**
             * layerload event, fired when layer is loaded.
             *
             * @event Layer#layerload
             * @type {Object}
             * @property {String} type - layerload
             * @property {Layer} target - layer
             */
            this.layer.fire('layerload');
        }
    }

    /**
     * requestMapToRender and fireLoadedEvent
     */
    completeRender() {
        this.requestMapToRender();
        this.fireLoadedEvent();
    }


    /**
     * Get renderer's events registered on the map
     * @return {Object} events
     */
    getEvents() {
        return {
            '_zoomstart' : this.onZoomStart,
            '_zoomend' : this.onZoomEnd,
            '_resize'  : this.onResize,
            '_movestart' : this.onMoveStart,
            '_moveend' : this.onMoveEnd,
            '_dragrotatestart' : this.onDragRotateStart,
            '_dragrotateend' : this.onDragRotateEnd
        };
    }

    /**
    /**
     * onZoomStart
     * @param  {Object} param event parameters
     */
    onZoomStart() {
        delete this._transform;
    }

    /**
    * onZoomEnd
    * @param  {Object} param event parameters
    */
    onZoomEnd() {
        this._drawOnEvent();
    }

    /**
    * onMoveStart
    * @param  {Object} param event parameters
    */
    onMoveStart() {}

    /**
    * onMoveEnd
    * @param  {Object} param event parameters
    */
    onMoveEnd() {
        this._drawOnEvent();
    }

    /**
    * onResize
    * @param  {Object} param event parameters
    */
    onResize() {
        delete this._extent2D;
        this.resizeCanvas();
        this._drawOnEvent();
    }

    onDragRotateStart() {}

    onDragRotateEnd() {
        this._drawOnEvent();
    }

    getDrawTime() {
        return this._drawTime;
    }

    _tryToDraw() {
        this._cancelDrawFrame();
        if (!this.canvas && this.layer.isEmpty && this.layer.isEmpty()) {
            this.fireLoadedEvent();
            return;
        }
        if (!this._painted && this.onAdd) {
            this.onAdd();
        }
        if (this.layer.options['drawImmediate']) {
            this._drawAndRecord();
        } else {
            this._currentFrameId = callImmediate(() => {
                this._drawAndRecord();
            });
        }
    }

    _drawAndRecord() {
        if (!this.getMap()) {
            return;
        }
        this._painted = true;
        const nowTime = now();
        this.draw();
        this._drawTime = now() - nowTime;
    }

    _promiseResource(url) {
        const me = this, resources = this.resources,
            crossOrigin = this.layer.options['crossOrigin'];
        return function (resolve) {
            if (resources.isResourceLoaded(url, true)) {
                resolve(url);
                return;
            }
            const img = new Image();
            if (crossOrigin) {
                img['crossOrigin'] = crossOrigin;
            }
            if (isSVG(url[0]) && !IS_NODE) {
                //amplify the svg image to reduce loading.
                if (url[1]) { url[1] *= 2; }
                if (url[2]) { url[2] *= 2; }
            }
            img.onload = function () {
                me._cacheResource(url, img);
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
                if (err && !Browser.phantomjs) {
                    if (console) { console.warn(err); }
                }
                resources.markErrorResource(url);
                resolve(url);
            };
            loadImage(img,  url);
        };

    }

    _cacheResource(url, img) {
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
            const canvas = Canvas2D.createCanvas(w, h);
            Canvas2D.image(canvas.getContext('2d'), img, 0, 0, w, h);
            img = canvas;
        }
        this.resources.addResource(url, img);
    }

    _drawOnEvent() {
        if (!this._painted) {
            this.render();
        } else {
            //prepareRender is called in render not in draw.
            //Thus prepareRender needs to be called here
            this.prepareRender();
            if (this.layer.isVisible()) {
                this._drawAndRecord();
            }
        }
    }

    _cancelDrawFrame() {
        if (this._currentFrameId) {
            clearCallImmediate(this._currentFrameId);
        }
    }
}

export default CanvasRenderer;

export class ResourceCache {
    constructor() {
        this.resources = {};
        this._errors = {};
    }

    addResource(url, img) {
        this.resources[url[0]] = {
            image: img,
            width: +url[1],
            height: +url[2]
        };
    }

    isResourceLoaded(url, checkSVG) {
        if (!url) {
            return false;
        }
        const imgUrl = this._getImgUrl(url);
        if (this._errors[imgUrl]) {
            return true;
        }
        const img = this.resources[imgUrl];
        if (!img) {
            return false;
        }
        if (checkSVG && isSVG(url[0]) && (+url[1] > img.width || +url[2] > img.height)) {
            return false;
        }
        return true;
    }

    getImage(url) {
        const imgUrl = this._getImgUrl(url);
        if (!this.isResourceLoaded(url) || this._errors[imgUrl]) {
            return null;
        }
        return this.resources[imgUrl].image;
    }

    markErrorResource(url) {
        this._errors[this._getImgUrl(url)] = 1;
    }

    merge(res) {
        if (!res) {
            return this;
        }
        for (const p in res.resources) {
            const img = res.resources[p];
            this.addResource([p, img.width, img.height], img.image);
        }
        return this;
    }

    _getImgUrl(url) {
        if (!Array.isArray(url)) {
            return url;
        }
        return url[0];
    }
}
