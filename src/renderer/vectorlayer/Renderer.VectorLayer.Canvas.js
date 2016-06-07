/**
 * @classdesc
 * Renderer class based on HTML5 Canvas2D for VectorLayers
 * @class
 * @protected
 * @memberOf maptalks.renderer.vectorlayer
 * @name Canvas
 * @extends {maptalks.renderer.Canvas}
 * @param {maptalks.VectorLayer} layer - layer of the renderer
 */
Z.renderer.vectorlayer.Canvas = Z.renderer.Canvas.extend(/** @lends Z.renderer.vectorlayer.Canvas.prototype */{

    initialize:function (layer) {
        this._layer = layer;
        this._painted = false;
    },

    /**
     * render layer
     * @param  {maptalks.Geometry[]} geometries   geometries to render
     * @param  {Boolean} ignorePromise   whether escape step of promise
     */
    _render:function (geometries) {
        var me = this;
        this._clearTimeout();
        if (this._layer.isEmpty()) {
            if (this._layer.options['drawImmediate']) {
                me._complete();
            } else {
                this._renderTimeout = Z.Util.requestAnimFrame(function () {
                    me._complete();
                });
            }
            return;
        }
        if (!this._painted && !geometries) {
            geometries = this._layer._geoCache;
        }
        var check = this._checkResources(geometries);
        if (Z.Util.isArrayHasData(check.resources)) {
            this._resourcesToLoad = check.resources;
        } else if (check.immediate) {
            this._renderImmediate();
            return;
        }
        this._renderTimeout = Z.Util.requestAnimFrame(function () {
            if (Z.Util.isArrayHasData(me._resourcesToLoad)) {
                me._promise();
            } else {
                me._renderImmediate();
            }
        });
    },

    //redraw all the geometries with transform matrix
    //this may bring low performance if number of geometries is large.
    transform: function (matrix) {
        if (Z.Browser.mobile || !this.getMap().options['layerTransforming'] || this._layer.options['drawOnce'] || this._layer.getMask()) {
            return false;
        }
        //determin whether this layer should be transformed.
        //if all the geometries to render are vectors including polygons and linestrings,
        //disable transforming won't reduce user experience.
        if (!this._hasPointSymbolizer ||
            this.getMap()._getRenderer()._getCountOfGeosToDraw() > this._layer.options['thresholdOfTransforming']) {
            return false;
        }
        this._draw(matrix);
        return true;
    },

    _draw:function (matrix) {
        var map = this.getMap();
        if (!map) {
            return;
        }
        var layer = this._layer;
        if (layer.isEmpty()) {
            this._resources = new Z.renderer.vectorlayer.Canvas.Resources();
            this._fireLoadedEvent();
            return;
        }
        if (!layer.isVisible()) {
            this._fireLoadedEvent();
            return;
        }
        this._prepareToDraw();
        var viewExtent = this._viewExtent,
            maskViewExtent = this._prepareCanvas();
        if (maskViewExtent) {
            if (!maskViewExtent.intersects(viewExtent)) {
                this._fireLoadedEvent();
                return;
            }
            viewExtent = viewExtent.intersection(maskViewExtent);
        }
        this._displayExtent = viewExtent;
        this._forEachGeo(this._checkGeo, this);

        for (var i = 0, len = this._geosToDraw.length; i < len; i++) {
            this._geosToDraw[i]._getPainter().paint(matrix);
        }
    },

    _prepareToDraw: function () {
        this._isBlank = true;
        this._painted = true;
        this._hasPointSymbolizer = false;
        this._geosToDraw = [];
    },

    _checkGeo: function (geo) {
        //geo的map可能为null,因为绘制为延时方法
        if (!geo || !geo.isVisible() || !geo.getMap() ||
            !geo.getLayer() || (!geo.getLayer().isCanvasRender())) {
            return;
        }
        var painter = geo._getPainter(),
            viewExtent = painter.getPixelExtent();
        if (!viewExtent || !viewExtent.intersects(this._displayExtent)) {
            return;
        }
        this._isBlank = false;
        if (painter.hasPointSymbolizer()) {
            this._hasPointSymbolizer = true;
        }
        this._geosToDraw.push(geo);
    },

    isBlank: function () {
        return this._isBlank;
    },

    getPaintContext:function () {
        if (!this._context) {
            return null;
        }
        return [this._context, this._resources];
    },


    /**
     * Show and render
     * @override
     */
    show: function () {
        this._layer.forEach(function (geo) {
            geo._onZoomEnd();
        });
        Z.renderer.Canvas.prototype.show.apply(this, arguments);
    },

    /**
     * 测试point处是否存在Geometry
     * @param  {ViewPoint} point ViewPoint
     * @return {Boolean}       true|false
     */
    hitDetect:function (point) {
        if (!this._context || this._layer.isEmpty() || this._errorThrown) {
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

    isResourceLoaded:function (url) {
        if (!this._resources) {
            return false;
        }
        return this._resources.isResourceLoaded(url);
    },

    _forEachGeo: function (fn, context) {
        this._layer.forEach(fn, context);
    },

    /**
     * Renderer the layer immediately.
     */
    _renderImmediate:function () {
        this._clearTimeout();
        if (!this.getMap()) {
            return;
        }
        var map = this.getMap();
        if (!this._layer.isVisible() || this._layer.isEmpty()) {
            this._complete();
            return;
        }
        var zoom = this.getMap().getZoom();
        if (this._layer.options['drawOnce']) {
            if (!this._canvasCache) {
                this._canvasCache = {};
            }
            if (this._viewExtent) {
                this._complete();
                return;
            } else if (this._canvasCache[zoom]) {
                this._canvas = this._canvasCache[zoom].canvas;
                var center = map._prjToPoint(map._getPrjCenter());
                this._viewExtent = this._canvasCache[zoom].viewExtent.add(this._canvasCache[zoom].center.substract(center));
                this._complete();
                return;
            } else {
                delete this._canvas;
            }

        }
        if (this._resources) {
            var check = this._checkResources(this._layer._geoCache);
            if (Z.Util.isArrayHasData(check.resources)) {
                this._resourcesToLoad = (this._resourcesToLoad || []).concat(check.resources);
                this._promise();
                return;
            }
        }
        this._draw();
        if (this._layer.options['drawOnce']) {
            if (!this._canvasCache[zoom]) {
                this._canvasCache[zoom] = {
                    'canvas'       : this._canvas,
                    'viewExtent'   : this._viewExtent,
                    'center'       : map._prjToPoint(map._getPrjCenter())
                };
            }
        }
        this._complete();
    },

    _onZoomEnd: function () {
        delete this._viewExtent;
        if (this._layer.isVisible()) {
            this._layer.forEach(function (geo) {
                geo._onZoomEnd();
            });
        }
        if (!this._painted) {
            this.render();
        } else {
            //_prepareRender is called in render not in _renderImmediate.
            //Thus _prepareRender needs to be called here
            this._prepareRender();
            this._renderImmediate();
        }
    },

    _onMoveEnd: function () {
        if (!this._painted) {
            this.render();
        } else {
            this._prepareRender();
            this._renderImmediate();
        }
    },

    _onResize: function () {
        this._resizeCanvas();
        if (!this._painted) {
            this.render();
        } else {
            delete this._canvasCache;
            delete this._viewExtent;
            this._prepareRender();
            this._renderImmediate();
        }
    },

    _onRemove:function () {
        delete this._resources;
        delete this._canvasCache;
    },

    _clearTimeout:function () {
        if (this._renderTimeout) {
            //clearTimeout(this._renderTimeout);
            Z.Util.cancelAnimFrame(this._renderTimeout);
        }
    },

    /**
     * 读取并载入绘制所需的外部资源, 例如markerFile, shieldFile等
     * @return {Promise[]} promise数组
     */
    _promise:function () {
        if (!this.getMap()) {
            return;
        }
        if (this._layer.isEmpty() || !Z.Util.isArrayHasData(this._resourcesToLoad)) {
            this._renderImmediate();
            return;
        }
        var resourceUrls = this._resourcesToLoad;
        this._loadResources(resourceUrls, this._renderImmediate, this);
    },

    _checkResources:function (geometries) {
        if (!geometries) {
            return true;
        }
        var me = this,
            resources = [],
            immediate = this._layer.options['drawImmediate'];
        var res, ii;
        function checkGeo(geo) {
            res = geo._getExternalResource();
            if (!immediate && geo._isRenderImmediate()) {
                immediate = true;
            }
            if (!Z.Util.isArrayHasData(res)) {
                return;
            }
            if (!me._resources) {
                resources = resources.concat(res);
            } else {
                for (ii = 0; ii < res.length; ii++) {
                    if (!me._resources.isResourceLoaded(res[ii])) {
                        resources.push(res[ii]);
                    }
                }
            }
        }

        if (Z.Util.isArrayHasData(geometries)) {
            for (var i = geometries.length - 1; i >= 0; i--) {
                checkGeo(geometries[i]);
            }
        } else {
            for (var p in geometries) {
                if (geometries.hasOwnProperty(p)) {
                    checkGeo(geometries[p]);
                }
            }
        }
        return {
            resources : resources,
            immediate : immediate
        };
    },

    /**
     * loadResource from resourceUrls
     * @param  {String[]} resourceUrls    - Array of urls to load
     * @param  {Function} onComplete          - callback after loading complete
     * @param  {Object} context         - callback's context
     */
    _loadResources:function (resourceUrls, onComplete, context) {
        var me = this;
        //var preResources = this._resources;
        if (!this._resources) {
            this._resources = new Z.renderer.vectorlayer.Canvas.Resources();
        }
        var resources = this._resources,
            promises = [],
            crossOrigin = this._layer.options['crossOrigin'];
        function onPromiseCallback(_url) {
            return function (resolve, reject) {
                if (resources.isResourceLoaded(_url)) {
                    resolve({});
                    return;
                }
                try {
                    var img = new Image();
                    if (crossOrigin) {
                        img['crossOrigin'] = crossOrigin;
                    }
                    if (Z.Util.isSVG(_url[0]) && !Z.node) {
                        //amplify the svg image to reduce loading.
                        if (_url[1]) { _url[1] *= 2; }
                        if (_url[2]) { _url[2] *= 2; }
                    }
                    img.onload = function () {
                        if (Z.Util.isSVG(_url[0]) === 1 && !Z.node) {
                                //resolved weird behavior of SVG, loaded but canvas is still blank.
                            var img2 = new Image();
                            img2.onload = function () {
                                me._cacheResource(_url, this);
                                resolve({});
                            };
                            img2.src = img.src;
                        } else {
                            me._cacheResource(_url, this);
                            resolve({});
                        }
                    };
                    img.onabort = function (err) {
                        console.warn('image loading aborted: ' + _url[0]);
                        if (err) {
                            console.warn(err);
                        }
                        resolve({});
                    };
                    img.onerror = function (err) {
                        console.warn('image loading failed: ' + _url[0]);
                        if (err) {
                            console.warn(err);
                        }
                        resources.markErrorResource(_url);
                        resolve({});
                    };
                    Z.Util.loadImage(img,  _url);
                } catch (err) {
                    resources.markErrorResource(_url);
                    reject(err);
                }
                //
            };
        }
        if (Z.Util.isArrayHasData(resourceUrls)) {
            //重复
            var cache = {};
            for (var i = resourceUrls.length - 1; i >= 0; i--) {
                var url = resourceUrls[i];
                if (!url || cache[url.join('-')]) {
                    continue;
                }
                cache[url.join('-')] = 1;
                if (!resources.isResourceLoaded(url)) {
                    //closure it to preserve url's value
                    var promise = new Z.Promise((onPromiseCallback)(url));
                    promises.push(promise);
                }
            }
        }
        function whenPromiseEnd() {
            delete me._resourcesToLoad;
            onComplete.call(context);
        }
        if (promises.length > 0) {
            Z.Promise.all(promises).then(function () {
                whenPromiseEnd();
            }, function (reason) {
                console.warn(reason);
                whenPromiseEnd();
            });
        } else {
            whenPromiseEnd();
        }
    },

    _cacheResource: function (url, img) {
        if (!img || !this._resources) {
            return;
        }
        var w = url[1], h = url[2];
        if (Z.Util.isSVG(url[0]) === 1 && (Z.Browser.edge || Z.Browser.ie)) {
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
    }
});


Z.renderer.vectorlayer.Canvas.Resources = function () {
    this._resources = {};
    this._errors = {};
};

Z.Util.extend(Z.renderer.vectorlayer.Canvas.Resources.prototype, {
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

Z.VectorLayer.registerRenderer('canvas', Z.renderer.vectorlayer.Canvas);

