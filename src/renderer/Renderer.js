/**
 * @namespace
 * @protected
 */
Z.renderer = {};


/**
 * @classdesc
 * Base Class for all the renderer based on HTML5 Canvas2D
 * @abstract
 * @class
 * @protected
 * @memberOf maptalks.renderer
 * @name Canvas
 * @extends {maptalks.Class}
 */
Z.renderer.Canvas = Z.Class.extend(/** @lends maptalks.renderer.Canvas.prototype */{
    isCanvasRender:function () {
        return true;
    },

    render:function (isCheckRes) {
        this.prepareRender();
        if (!this.getMap()) {
            return;
        }
        if (!this._layer.isVisible()) {
            this.completeRender();
            return;
        }
        if (this.checkResources && isCheckRes) {
            var me = this, args = arguments;
            var resources = this.checkResources.apply(this, args);
            if (Z.Util.isArrayHasData(resources)) {
                this.loadResources(resources).then(function () {
                    if (me._layer) {
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

    _tryToDraw:function () {
        this._clearTimeout();
        if (this._layer.isEmpty && this._layer.isEmpty()) {
            this.completeRender();
            return;
        }
        var me = this, args = arguments;
        if (this._layer.options['drawImmediate']) {
            this.draw.apply(this, args);
        } else {
            this._animReqId = Z.Util.requestAnimFrame(function () {
                if (me._layer) {
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
        delete this._canvas;
        delete this._context;
        delete this._extent2D;
        delete this._resources;
        Z.renderer.Canvas.prototype.requestMapToRender.call(this);
        delete this._layer;
    },

    getMap: function () {
        if (!this._layer) {
            return null;
        }
        return this._layer.getMap();
    },

    getLayer:function () {
        return this._layer;
    },

    getCanvasImage:function () {
        if (!this._canvas) {
            return null;
        }
        if ((this._layer.isEmpty && this._layer.isEmpty()) || !this._extent2D) {
            return null;
        }
        if (this.isBlank && this.isBlank()) {
            return null;
        }
        var map = this.getMap(),
            size = this._extent2D.getSize(),
            point = this._extent2D.getMin(),
            containerPoint = map._pointToContainerPoint(point);

        return {'image':this._canvas, 'layer':this._layer, 'point': containerPoint, 'size':size};
    },

    isLoaded:function () {
        if (this._loaded) {
            return true;
        }
        return false;
    },

    /**
     * 显示图层
     */
    show: function () {
        var mask = this._layer.getMask();
        if (mask) {
            mask._onZoomEnd();
        }
        this.render();
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

    getRenderZoom: function () {
        return this._renderZoom;
    },

    /**
     *
     * @param  {ViewPoint} point ViewPoint
     * @return {Boolean}       true|false
     */
    hitDetect:function (point) {
        if (!this._context || (this._layer.isEmpty && this._layer.isEmpty()) || this._errorThrown) {
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
            var imgData = this._context.getImageData(detectPoint.x, detectPoint.y, 1, 1).data;
            if (imgData[3] > 0) {
                return true;
            }
        } catch (error) {
            if (!this._errorThrown) {
                console.warn('hit detect failed with tainted canvas, some geometries have external resources in another domain:\n', error);
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
    loadResources:function (resourceUrls) {
        if (!this._resources) {
            this._resources = new Z.renderer.Canvas.Resources();
        }
        var resources = this._resources,
            promises = [];
        if (Z.Util.isArrayHasData(resourceUrls)) {
            var cache = {}, url;
            for (var i = resourceUrls.length - 1; i >= 0; i--) {
                url = resourceUrls[i];
                if (!url || cache[url.join('-')]) {
                    continue;
                }
                cache[url.join('-')] = 1;
                if (!resources.isResourceLoaded(url)) {
                    //closure it to preserve url's value
                    promises.push(new Z.Promise(this._promiseResource(url)));
                }
            }
        }
        return Z.Promise.all(promises);
    },

    _promiseResource: function (url) {
        var me = this, resources = this._resources,
            crossOrigin = this._layer.options['crossOrigin'];
        return function (resolve) {
            if (resources.isResourceLoaded(url)) {
                resolve(url);
                return;
            }
            var img = new Image();
            if (crossOrigin) {
                img['crossOrigin'] = crossOrigin;
            }
            if (Z.Util.isSVG(url[0]) && !Z.node) {
                //amplify the svg image to reduce loading.
                if (url[1]) { url[1] *= 2; }
                if (url[2]) { url[2] *= 2; }
            }
            img.onload = function () {
                me._cacheResource(url, img);
                resolve(url);
            };
            img.onabort = function (err) {
                console.warn('image loading aborted: ' + url[0]);
                if (err) {
                    console.warn(err);
                }
                resolve(url);
            };
            img.onerror = function (err) {
                // console.warn('image loading failed: ' + url[0]);
                if (err && !Z.Browser.phantomjs) {
                    console.warn(err);
                }
                resources.markErrorResource(url);
                resolve(url);
            };
            Z.Util.loadImage(img,  url);
        };

    },

    _cacheResource: function (url, img) {
        if (!this._layer || !this._resources) {
            return;
        }
        var w = url[1], h = url[2];
        if (this._layer.options['cacheSvgOnCanvas'] && Z.Util.isSVG(url[0]) === 1 && (Z.Browser.edge || Z.Browser.ie)) {
            //opacity of svg img painted on canvas is always 1, so we paint svg on a canvas at first.
            if (Z.Util.isNil(w)) {
                w = img.width || this._layer.options['defaultIconSize'][0];
            }
            if (Z.Util.isNil(h)) {
                h = img.height || this._layer.options['defaultIconSize'][1];
            }
            var canvas = Z.Canvas.createCanvas(w, h);
            Z.Canvas.image(canvas.getContext('2d'), img, 0, 0, w, h);
            img = canvas;
        }
        this._resources.addResource(url, img);
    },

    prepareRender: function () {
        this._renderZoom = this.getMap().getZoom();
        this._extent2D = this.getMap()._get2DExtent();
        this._loaded = false;
    },

    createCanvas:function () {
        if (this._canvas) {
            return;
        }
        var map = this.getMap();
        var size = map.getSize();
        var r = Z.Browser.retina ? 2 : 1;
        this._canvas = Z.Canvas.createCanvas(r * size['width'], r * size['height'], map.CanvasClass);
        this._context = this._canvas.getContext('2d');
        if (Z.Browser.retina) {
            this._context.scale(2, 2);
        }
        Z.Canvas.setDefaultCanvasSetting(this._context);
    },

    resizeCanvas:function (canvasSize) {
        if (!this._canvas) {
            return;
        }
        var size;
        if (!canvasSize) {
            var map = this.getMap();
            size = map.getSize();
        } else {
            size = canvasSize;
        }
        var r = Z.Browser.retina ? 2 : 1;
        //only make canvas bigger, never smaller
        if (this._canvas.width >= r * size['width'] && this._canvas.height >= r * size['height']) {
            return;
        }
        //retina support
        this._canvas.height = r * size['height'];
        this._canvas.width = r * size['width'];
        if (Z.Browser.retina) {
            this._context.scale(2, 2);
        }
    },

    clearCanvas:function () {
        if (!this._canvas) {
            return;
        }
        Z.Canvas.clearRect(this._context, 0, 0, this._canvas.width, this._canvas.height);
    },

    prepareCanvas:function () {
        if (this._clipped) {
            this._context.restore();
            this._clipped = false;
        }
        if (!this._canvas) {
            this.createCanvas();
        } else {
            this.clearCanvas();
        }
        var mask = this.getLayer().getMask();
        if (!mask) {
            return null;
        }
        var maskExtent2D = mask._getPainter().get2DExtent();
        if (!maskExtent2D.intersects(this._extent2D)) {
            return maskExtent2D;
        }
        this._context.save();
        mask._getPainter().paint();
        this._context.clip();
        this._clipped = true;
        /**
         * renderstart event, fired when layer starts to render.
         *
         * @event maptalks.Layer#renderstart
         * @type {Object}
         * @property {String} type              - renderstart
         * @property {maptalks.Layer} target    - layer
         * @property {CanvasRenderingContext2D} context - canvas's context
         */
        this._layer.fire('renderstart', {'context' : this._context});
        return maskExtent2D;
    },

    requestMapToRender: function () {
        if (this.getMap()) {
            if (this._context) {
                /**
                 * renderend event, fired when layer ends rendering.
                 *
                 * @event maptalks.Layer#renderend
                 * @type {Object}
                 * @property {String} type              - renderend
                 * @property {maptalks.Layer} target    - layer
                 * @property {CanvasRenderingContext2D} context - canvas's context
                 */
                this._layer.fire('renderend', {'context' : this._context});
            }
            this.getMap()._getRenderer().render();
        }
    },

    fireLoadedEvent: function () {
        this._loaded = true;
        if (this._layer) {
            /**
             * layerload event, fired when layer is loaded.
             *
             * @event maptalks.Layer#layerload
             * @type {Object}
             * @property {String} type - layerload
             * @property {maptalks.Layer} target - layer
             */
            this._layer.fire('layerload');
        }
    },

    completeRender: function () {
        this.requestMapToRender();
        this.fireLoadedEvent();
    },

    getPaintContext:function () {
        if (!this._context) {
            return null;
        }
        return [this._context, this._resources];
    },

    _getEvents: function () {
        return {
            '_zoomstart' : this._onZoomStart,
            '_zoomend' : this._onZoomEnd,
            '_resize'  : this._onResize,
            '_movestart' : this._onMoveStart,
            '_moving' : this._onMoving,
            '_moveend' : this._onMoveEnd
        };
    },

    _onZoomStart: function () {

    },

    _onZoomEnd: function () {
        this.prepareRender();
        this.draw();
    },

    _onMoveStart: function () {

    },

    _onMoving: function () {

    },

    _onMoveEnd: function () {
        this.prepareRender();
        this.draw();
    },

    _onResize: function () {
        this.resizeCanvas();
        this.prepareRender();
        this.draw();
    },

    _clearTimeout:function () {
        if (this._animReqId) {
            //clearTimeout(this._animReqId);
            Z.Util.cancelAnimFrame(this._animReqId);
        }
    }
});

Z.renderer.Canvas.Resources = function () {
    this._resources = {};
    this._errors = {};
};

Z.Util.extend(Z.renderer.Canvas.Resources.prototype, {
    addResource:function (url, img) {
        this._resources[url[0]] = {
            image : img,
            width : +url[1],
            height : +url[2]
        };
    },

    isResourceLoaded:function (url) {
        if (this._errors[this._getImgUrl(url)]) {
            return true;
        }
        var img = this._resources[this._getImgUrl(url)];
        if (!img) {
            return false;
        }
        if (+url[1] > img.width || +url[2] > img.height) {
            return false;
        }
        return true;
    },

    getImage:function (url) {
        if (!this.isResourceLoaded(url) || this._errors[this._getImgUrl(url)]) {
            return null;
        }
        return this._resources[this._getImgUrl(url)].image;
    },

    markErrorResource:function (url) {
        this._errors[this._getImgUrl(url)] = 1;
    },

    _getImgUrl: function (url) {
        if (!Z.Util.isArray(url)) {
            return url;
        }
        return url[0];
    }
});
