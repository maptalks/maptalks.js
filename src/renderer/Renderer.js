    /**
 * @namespace
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

    render:function () {
        this._prepareRender();
        if (!this.getMap()) {
            return;
        }
        if (!this._layer.isVisible()) {
            this._complete();
            return;
        }
        if (this.checkResources) {
            var me = this, args = arguments;
            var resources = this.checkResources.apply(this, args);
            if (Z.Util.isArrayHasData(resources)) {
                this._loadResources(resources).then(function () {
                    if (me._layer) {
                        me.draw.apply(me, args);
                    }
                });
            } else {
                this.draw.apply(this, args);
            }
        } else {
            this.draw.apply(this, arguments);
        }
    },

    remove: function () {
        if (this._onRemove) {
            this._onRemove();
        }
        delete this._canvas;
        delete this._context;
        delete this._viewExtent;
        delete this._resources;
        Z.renderer.Canvas.prototype._requestMapToRender.call(this);
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
        if ((this._layer.isEmpty && this._layer.isEmpty()) || !this._viewExtent) {
            return null;
        }
        if (this.isBlank && this.isBlank()) {
            return null;
        }
        var size = this._viewExtent.getSize();
        var point = this._viewExtent.getMin();
        return {'image':this._canvas, 'layer':this._layer, 'point':this.getMap().viewPointToContainerPoint(point), 'size':size};
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
        this._clearCanvas();
        this._requestMapToRender();
    },

    setZIndex: function () {
        this._requestMapToRender();
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
        var viewExtent = this.getMap()._getViewExtent();
        var size = viewExtent.getSize();
        var leftTop = viewExtent.getMin();
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
    _loadResources:function (resourceUrls) {
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
                resolve({});
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
                me._cacheResource(url, this);
                resolve({});
            };
            img.onabort = function (err) {
                console.warn('image loading aborted: ' + url[0]);
                if (err) {
                    console.warn(err);
                }
                resolve({});
            };
            img.onerror = function (err) {
                // console.warn('image loading failed: ' + url[0]);
                if (err && !Z.Browser.phantomjs) {
                    console.warn(err);
                }
                resources.markErrorResource(url);
                resolve({});
            };
            Z.Util.loadImage(img,  url);
        };

    },

    _cacheResource: function (url, img) {
        if (!this._layer) {
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

    _prepareRender: function () {
        this._renderZoom = this.getMap().getZoom();
        this._viewExtent = this.getMap()._getViewExtent();
        this._loaded = false;
    },

    _requestMapToRender: function () {
        if (this.getMap()) {
            if (this._context) {
                this._layer.fire('renderend', {'context' : this._context});
            }
            this.getMap()._getRenderer().render();
        }
    },

    _fireLoadedEvent: function () {
        this._loaded = true;
        if (this._layer) {
            this._layer.fire('layerload');
        }
    },

    _complete: function () {
        this._requestMapToRender();
        this._fireLoadedEvent();
    },

    _createCanvas:function () {
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

    _resizeCanvas:function (canvasSize) {
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

    _clearCanvas:function () {
        if (!this._canvas) {
            return;
        }
        Z.Canvas.clearRect(this._context, 0, 0, this._canvas.width, this._canvas.height);
    },

    _prepareCanvas:function () {
        if (this._clipped) {
            this._context.restore();
            this._clipped = false;
        }
        if (!this._canvas) {
            this._createCanvas();
        } else {
            this._clearCanvas();
        }
        var mask = this.getLayer().getMask();
        if (!mask) {
            return null;
        }
        var maskViewExtent = mask._getPainter().getViewExtent();
        if (!maskViewExtent.intersects(this._viewExtent)) {
            return maskViewExtent;
        }
        this._context.save();
        mask._getPainter().paint();
        this._context.clip();
        this._clipped = true;
        this._layer.fire('renderstart', {'context' : this._context});
        return maskViewExtent;
    },

    getPaintContext:function () {
        if (!this._context) {
            return null;
        }
        return [this._context, this._resources];
    },

    _getEvents: function () {
        return {
            '_zoomend' : this._onZoomEnd,
            '_resize'  : this._onResize,
            '_moveend' : this._onMoveEnd
        };
    },

    _onZoomEnd: function () {
        this.render();
    },

    _onMoveEnd: function () {
        this.render();
    },

    _onResize: function () {
        this._resizeCanvas();
        this.render();
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
