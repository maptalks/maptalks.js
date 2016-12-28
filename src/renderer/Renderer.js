import { extend, isNil, isArray, isArrayHasData, isSVG, isNode, loadImage, requestAnimFrame, cancelAnimFrame } from 'core/util';
import Class from 'core/class/index';
import Browser from 'core/Browser';
import Promise from 'utils/Promise';
import Point from 'geo/Point';
import TileLayer from 'layer/tile/TileLayer';

/**
 * @classdesc
 * Base Class for all the renderer based on HTML5 Canvas2D
 * @abstract
 * @class
 * @protected
 * @memberOf renderer
 * @name Canvas
 * @extends {Class}
 */
export const Canvas = Class.extend(/** @lends renderer.Canvas.prototype */ {

    isCanvasRender: function () {
        return true;
    },

    render: function (isCheckRes) {
        this.prepareRender();
        if (!this.getMap()) {
            return;
        }
        if (!this.layer.isVisible()) {
            this.completeRender();
            return;
        }
        if (!this.resources) {
            this.resources = new Canvas.Resources();
        }
        if (this.checkResources && isCheckRes) {
            var me = this,
                args = arguments;
            var resources = this.checkResources.apply(this, args);
            if (isArrayHasData(resources)) {
                this.loadResources(resources).then(function () {
                    if (me.layer) {
                        /**
                         * resourceload event, fired when external resources of the layer complete loading.
                         *
                         * @event Layer#resourceload
                         * @type {Object}
                         * @property {String} type              - resourceload
                         * @property {Layer} target    - layer
                         */
                        me.layer.fire('resourceload');
                        me._tryToDraw.apply(me, args);
                    }
                });
            } else {
                this._tryToDraw.apply(this, args);
            }
        } else {
            this._tryToDraw.apply(this, arguments);
        }
    },

    _tryToDraw: function () {
        this._clearTimeout();
        if (!this.canvas && this.layer.isEmpty && this.layer.isEmpty()) {
            this.completeRender();
            return;
        }
        var me = this,
            args = arguments;
        if (this.layer.options['drawImmediate']) {
            this.draw.apply(this, args);
        } else {
            this._animReqId = requestAnimFrame(function () {
                if (me.layer) {
                    me.draw.apply(me, args);
                }
            });
        }
    },

    remove: function () {
        this._clearTimeout();
        if (this.onRemove) {
            this.onRemove();
        }
        delete this._northWest;
        delete this.canvas;
        delete this.context;
        delete this._extent2D;
        delete this.resources;
        // requestMapToRender may be overrided, e.g. renderer.TileLayer.Canvas
        Canvas.prototype.requestMapToRender.call(this);
        delete this.layer;
    },

    getMap: function () {
        if (!this.layer) {
            return null;
        }
        return this.layer.getMap();
    },

    getCanvasImage: function () {
        if (this._renderZoom !== this.getMap().getZoom() || !this.canvas) {
            return null;
        }
        if ((this.layer.isEmpty && this.layer.isEmpty()) || !this._extent2D) {
            return null;
        }
        if (this.isBlank && this.isBlank()) {
            return null;
        }
        var map = this.getMap(),
            size = this._extent2D.getSize(),
            // point = this._extent2D.getMin(),
            containerPoint = map._pointToContainerPoint(this._northWest);
        return {
            'image': this.canvas,
            'layer': this.layer,
            'point': containerPoint,
            'size': size
        };
    },

    isLoaded: function () {
        if (this._loaded) {
            return true;
        }
        return false;
    },

    /**
     * 显示图层
     */
    show: function () {
        var mask = this.layer.getMask();
        if (mask) {
            mask.onZoomEnd();
        }
        this.render(true);
    },

    /**
     * 隐藏图层
     */
    hide: function () {
        this.clearCanvas();
        this.requestMapToRender();
    },

    setZIndex: function () {
        this.requestMapToRender();
    },

    /**
     *
     * @param  {ViewPoint} point ViewPoint
     * @return {Boolean}       true|false
     */
    hitDetect: function (point) {
        if (!this.context || (this.layer.isEmpty && this.layer.isEmpty()) || this._errorThrown || (this.layer instanceof TileLayer)) {
            return false;
        }
        var extent2D = this.getMap()._get2DExtent();
        var size = extent2D.getSize();
        var leftTop = extent2D.getMin();
        var detectPoint = point.substract(leftTop);
        if (detectPoint.x < 0 || detectPoint.x > size['width'] || detectPoint.y < 0 || detectPoint.y > size['height']) {
            return false;
        }
        try {
            var imgData = this.context.getImageData(detectPoint.x, detectPoint.y, 1, 1).data;
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

    },

    /**
     * loadResource from resourceUrls
     * @param  {String[]} resourceUrls    - Array of urls to load
     * @param  {Function} onComplete          - callback after loading complete
     * @param  {Object} context         - callback's context
     */
    loadResources: function (resourceUrls) {
        var resources = this.resources,
            promises = [];
        if (isArrayHasData(resourceUrls)) {
            var cache = {},
                url;
            for (var i = resourceUrls.length - 1; i >= 0; i--) {
                url = resourceUrls[i];
                if (!url || cache[url.join('-')]) {
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
    },

    _promiseResource: function (url) {
        var me = this,
            resources = this.resources,
            crossOrigin = this.layer.options['crossOrigin'];
        return function (resolve) {
            if (resources.isResourceLoaded(url, true)) {
                resolve(url);
                return;
            }
            var img = new Image();
            if (crossOrigin) {
                img['crossOrigin'] = crossOrigin;
            }
            if (isSVG(url[0]) && !isNode) {
                //amplify the svg image to reduce loading.
                if (url[1]) {
                    url[1] *= 2;
                }
                if (url[2]) {
                    url[2] *= 2;
                }
            }
            img.onload = function () {
                me._cacheResource(url, img);
                resolve(url);
            };
            img.onabort = function (err) {
                if (console) {
                    console.warn('image loading aborted: ' + url[0]);
                }
                if (err) {
                    if (console) {
                        console.warn(err);
                    }
                }
                resolve(url);
            };
            img.onerror = function (err) {
                // if (console) { console.warn('image loading failed: ' + url[0]); }
                if (err && !Browser.phantomjs) {
                    if (console) {
                        console.warn(err);
                    }
                }
                resources.markErrorResource(url);
                resolve(url);
            };
            loadImage(img, url);
        };

    },

    _cacheResource: function (url, img) {
        if (!this.layer || !this.resources) {
            return;
        }
        var w = url[1],
            h = url[2];
        if (this.layer.options['cacheSvgOnCanvas'] && isSVG(url[0]) === 1 && (Browser.edge || Browser.ie)) {
            //opacity of svg img painted on canvas is always 1, so we paint svg on a canvas at first.
            if (isNil(w)) {
                w = img.width || this.layer.options['defaultIconSize'][0];
            }
            if (isNil(h)) {
                h = img.height || this.layer.options['defaultIconSize'][1];
            }
            var canvas = Canvas.createCanvas(w, h);
            Canvas.image(canvas.getContext('2d'), img, 0, 0, w, h);
            img = canvas;
        }
        this.resources.addResource(url, img);
    },

    prepareRender: function () {
        var map = this.getMap();
        this._renderZoom = map.getZoom();
        this._extent2D = map._get2DExtent();
        this._northWest = map._containerPointToPoint(new Point(0, 0));
        this._loaded = false;
    },

    createCanvas: function () {
        if (this.canvas) {
            return;
        }
        var map = this.getMap();
        var size = map.getSize();
        var r = Browser.retina ? 2 : 1;
        this.canvas = Canvas.createCanvas(r * size['width'], r * size['height'], map.CanvasClass);
        this.context = this.canvas.getContext('2d');
        if (this.layer.options['globalCompositeOperation']) {
            this.context.globalCompositeOperation = this.layer.options['globalCompositeOperation'];
        }
        if (Browser.retina) {
            this.context.scale(2, 2);
        }
        Canvas.setDefaultCanvasSetting(this.context);
        if (this.onCanvasCreate) {
            this.onCanvasCreate();
        }
    },

    resizeCanvas: function (canvasSize) {
        if (!this.canvas) {
            return;
        }
        var size;
        if (!canvasSize) {
            var map = this.getMap();
            size = map.getSize();
        } else {
            size = canvasSize;
        }
        var r = Browser.retina ? 2 : 1;
        //only make canvas bigger, never smaller
        if (this.canvas.width >= r * size['width'] && this.canvas.height >= r * size['height']) {
            return;
        }
        //retina support
        this.canvas.height = r * size['height'];
        this.canvas.width = r * size['width'];
        if (Browser.retina) {
            this.context.scale(2, 2);
        }
    },

    clearCanvas: function () {
        if (!this.canvas) {
            return;
        }
        Canvas.clearRect(this.context, 0, 0, this.canvas.width, this.canvas.height);
    },

    prepareCanvas: function () {
        if (this._clipped) {
            this.context.restore();
            this._clipped = false;
        }
        if (!this.canvas) {
            this.createCanvas();
        } else {
            this.clearCanvas();
        }
        var mask = this.layer.getMask();
        if (!mask) {
            this.layer.fire('renderstart', {
                'context': this.context
            });
            return null;
        }
        var maskExtent2D = mask._getPainter().get2DExtent();
        if (!maskExtent2D.intersects(this._extent2D)) {
            this.layer.fire('renderstart', {
                'context': this.context
            });
            return maskExtent2D;
        }
        this.context.save();
        mask._getPainter().paint();
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
    },

    get2DExtent: function () {
        return this._extent2D;
    },

    requestMapToRender: function () {
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
    },

    fireLoadedEvent: function () {
        this._loaded = true;
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
    },

    completeRender: function () {
        this.requestMapToRender();
        this.fireLoadedEvent();
    },

    getPaintContext: function () {
        if (!this.context) {
            return null;
        }
        return [this.context, this.resources];
    },

    getEvents: function () {
        return {
            '_zoomstart': this.onZoomStart,
            '_zoomend': this.onZoomEnd,
            '_resize': this.onResize,
            '_movestart': this.onMoveStart,
            '_moving': this.onMoving,
            '_moveend': this.onMoveEnd
        };
    },

    onZoomStart: function () {

    },

    onZoomEnd: function () {
        this._drawOnEvent();
    },

    onMoveStart: function () {

    },

    onMoving: function () {

    },

    onMoveEnd: function () {
        this._drawOnEvent();
    },

    onResize: function () {
        this.resizeCanvas();
        this._drawOnEvent();
    },

    _drawOnEvent: function () {
        this.prepareRender();
        if (this.layer.isVisible()) {
            this.draw();
        }
    },

    _clearTimeout: function () {
        if (this._animReqId) {
            //clearTimeout(this._animReqId);
            cancelAnimFrame(this._animReqId);
        }
    }
});

Canvas.Resources = function () {
    this.resources = {};
    this._errors = {};
};

extend(Canvas.Resources.prototype, {
    addResource: function (url, img) {
        this.resources[url[0]] = {
            image: img,
            width: +url[1],
            height: +url[2]
        };
    },

    isResourceLoaded: function (url, checkSVG) {
        if (!url) {
            return false;
        }
        if (this._errors[this._getImgUrl(url)]) {
            return true;
        }
        var img = this.resources[this._getImgUrl(url)];
        if (!img) {
            return false;
        }
        if (checkSVG && isSVG(url[0]) && (+url[1] > img.width || +url[2] > img.height)) {
            return false;
        }
        return true;
    },

    getImage: function (url) {
        if (!this.isResourceLoaded(url) || this._errors[this._getImgUrl(url)]) {
            return null;
        }
        return this.resources[this._getImgUrl(url)].image;
    },

    markErrorResource: function (url) {
        this._errors[this._getImgUrl(url)] = 1;
    },

    merge: function (res) {
        if (!res) {
            return this;
        }
        for (var p in res.resources) {
            var img = res.resources[p];
            this.addResource([p, img.width, img.height], img.image);
        }
        return this;
    },

    _getImgUrl: function (url) {
        if (!isArray(url)) {
            return url;
        }
        return url[0];
    }
});
