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
Z.renderer.vectorlayer.Canvas=Z.renderer.Canvas.extend(/** @lends Z.renderer.vectorlayer.Canvas.prototype */{

    initialize:function(layer) {
        this._layer = layer;
        this._registerEvents();
        this._painted = false;
    },

    remove:function() {
        this.getMap().off('_zoomstart _zoomend _moveend _resize',this._onMapEvent,this);
        this._requestMapToRender();
    },

    /**
     * render layer
     * @param  {maptalks.Geometry[]} geometries   geometries to render
     * @param  {Boolean} ignorePromise   whether escape step of promise
     */
    _render:function(geometries) {
        this._clearTimeout();
        if (!this.getMap()) {
            return;
        }
        if (!this._layer.isVisible() || this._layer.isEmpty()) {
            this._requestMapToRender();
            this._fireLoadedEvent();
            return;
        }
        if (!this._painted && !geometries) {
            geometries = this._layer._geoCache;
        }
        var check = this._checkResources(geometries);
        if (Z.Util.isArrayHasData(check.resources)) {
            this._resourcesToLoad = check.resources;
        } else {
            if (check.immediate) {
                this._renderImmediate();
                return;
            }
        }
        var me = this;
        this._renderTimeout = setTimeout(function() {
            if (Z.Util.isArrayHasData(me._resourcesToLoad)) {
                me._promise();
            } else {
                me._renderImmediate();
            }
        },1);
    },

    draw:function() {
        var map = this.getMap();
        if (!map) {
            return;
        }

        //载入资源后再进行绘制
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
        this._painted = true;
        var viewExtent = map._getViewExtent();
        var me = this;
        var counter = 0;
        this._shouldUpdateWhileTransforming = true;
        var maskViewExtent = this._prepareCanvas(viewExtent);
        if (maskViewExtent) {
            if (!maskViewExtent.intersects(viewExtent)) {
                this._fireLoadedEvent();
                return;
            }
            viewExtent = viewExtent.intersection(maskViewExtent);
        }
        var geoViewExt, geoPainter;

        function drawGeo(geo) {
            //geo的map可能为null,因为绘制为延时方法
            if (!geo || !geo.isVisible() || !geo.getMap() || !geo.getLayer() || (!geo.getLayer().isCanvasRender())) {
                return;
            }
            geoPainter = geo._getPainter();
            geoViewExt = geoPainter.getPixelExtent();
            if (!geoViewExt || !geoViewExt.intersects(viewExtent)) {
                return;
            }
            counter++;
            if (me._shouldUpdateWhileTransforming && geoPainter.hasPointSymbolizer()) {
                me._shouldUpdateWhileTransforming = false;
            }
            if (counter > layer.options['thresholdOfPointUpdate']) {
                me._shouldUpdateWhileTransforming = true;
            }
            geoPainter.paint();
        }

        layer._eachGeometry(drawGeo);
        this._canvasFullExtent = map._getViewExtent();
    },

    getPaintContext:function() {
        if (!this._context) {
            return null;
        }
        return [this._context, this._resources];
    },

    getCanvasImage:function() {
        if (!this._canvasFullExtent || this._layer.isEmpty()) {
            return null;
        }
        var size = this._canvasFullExtent.getSize();
        var point = this._canvasFullExtent.getMin();
        return {'image':this._canvas,'layer':this._layer,'point':this.getMap().viewPointToContainerPoint(point),'size':size};
    },

    /**
     * Show and render
     * @override
     */
    show: function() {
        this._layer._eachGeometry(function(geo) {
            geo._onZoomEnd();
        });
        var mask = this._layer.getMask();
        if (mask) {
            mask._onZoomEnd();
        }
        this.render();
    },

    /**
     * 测试point处是否存在Geometry
     * @param  {ViewPoint} point ViewPoint
     * @return {Boolean}       true|false
     */
    hitDetect:function(point) {
        if (!this._context || !this._canvasFullExtent || this._layer.isEmpty()) {
            return false;
        }
        var size = this._canvasFullExtent.getSize();
        var canvasNW = this._canvasFullExtent.getMin();
        var detectPoint = point.substract(canvasNW);
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

    //determin whether this layer can be economically transformed, updatePointsWhileTransforming can bring better performance.
    //if all the geometries to render are vectors including polygons and linestrings, updatePointsWhileTransforming won't reduce user experience.
    shouldUpdateWhileTransforming:function() {
        if (Z.Util.isNil(this._shouldUpdateWhileTransforming)) {
            return true;
        }
        return this._shouldUpdateWhileTransforming;
    },

    isResourceLoaded:function(url) {
        if (!this._resources) {
            return false;
        }
        return this._resources.isResourceLoaded(url);
    },

    /**
     * Renderer the layer immediately.
     */
    _renderImmediate:function() {
        this._clearTimeout();
        if (!this.getMap()) {
            return;
        }
        if (!this._layer.isVisible() || this._layer.isEmpty()) {
            this._requestMapToRender();
            this._fireLoadedEvent();
            return;
        }
        if (this._resources) {
            var check = this._checkResources(this._layer._geoCache);
            if (Z.Util.isArrayHasData(check.resources)) {
                this._resourcesToLoad = (this._resourcesToLoad || []).concat(check.resources);
                this._promise();
                return;
            }
        }
        this.draw();
        this._requestMapToRender();
        this._fireLoadedEvent();

    },

    _registerEvents:function() {
        this.getMap().on('_zoomend _moveend _resize',this._onMapEvent,this);
    },

    _onMapEvent:function(param) {
        if (param['type'] === '_zoomend') {
            if (this._layer.isVisible()) {
                this._layer._eachGeometry(function(geo) {
                    geo._onZoomEnd();
                });
                var mask = this._layer.getMask();
                if (mask) {
                    mask._onZoomEnd();
                }
            }
            if (!this._painted) {
                this.render();
            } else {
                //_prepareRender is called in render not in _renderImmediate.
                //Thus _prepareRender needs to be called here
                this._prepareRender();
                this._renderImmediate();
            }
        } else if (param['type'] === '_moveend') {
            if (!this._painted) {
                this.render();
            } else {
                this._prepareRender();
                this._renderImmediate();
            }
        } else if (param['type'] === '_resize') {
            this._resizeCanvas();
            if (!this._painted) {
                this.render();
            } else {
                this._prepareRender();
                this._renderImmediate();
            }
        }
    },

    _clearTimeout:function() {
        if (this._renderTimeout) {
            clearTimeout(this._renderTimeout);
        }
    },

    /**
     * 读取并载入绘制所需的外部资源, 例如markerFile, shieldFile等
     * @return {Promise[]} promise数组
     */
    _promise:function() {
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

    _checkResources:function(geometries) {
        if (!geometries) {
            return true;
        }
        var me = this,
            resources = [],
            immediate = false;
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
    _loadResources:function(resourceUrls, onComplete, context) {
        var me = this;
        //var preResources = this._resources;
        if (!this._resources) {
            this._resources = new Z.renderer.vectorlayer.Canvas.Resources();
        }
        var resources = this._resources;
        var promises = [];
        var crossOrigin = this._layer.options['crossOrigin'];
        function onPromiseCallback(_url) {
            return function(resolve, reject) {
                        var img = new Image();
                        if (crossOrigin) {
                            img['crossOrigin'] = crossOrigin;
                        }
                        img.onload = function(){
                            var w = _url[1] || img.width,
                                h = _url[2] || img.height;
                            if (w && h && Z.Util.isSVG(_url[0]) === 1 && (Z.Browser.edge || Z.Browser.ie)) {
                                var canvas = Z.Canvas.createCanvas(w, h);
                                Z.Canvas.image(canvas.getContext('2d'), img, 0, 0, w, h);
                                resources.addResource(_url,canvas);
                            } else {
                                resources.addResource(_url,this);
                            }
                            resolve({});
                        };
                        img.onabort = function(){
                            resolve({});
                        };
                        img.onerror = function(){
                            resources.markErrorResource(_url);
                            resolve({});
                        };
                        try {
                            Z.Util.loadImage(img,  _url);
                        } catch (err) {
                            reject({});
                        }

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
            Z.Promise.all(promises).then(function(reources) {
                whenPromiseEnd();
            },function() {
               whenPromiseEnd();
            });
        } else {
            whenPromiseEnd();
        }
    }
});


Z.renderer.vectorlayer.Canvas.Resources=function() {
    this._resources = {};
    this._errors = {};
};

Z.Util.extend(Z.renderer.vectorlayer.Canvas.Resources.prototype,{
    addResource:function(url, img) {
        this._resources[this._regulate(url)] = img;
    },

    isResourceLoaded:function(url) {
        return (this._resources[this._regulate(url)] || this._errors[url[0]]) ? true : false;
    },

    getImage:function(url) {
        if (!this.isResourceLoaded(url)) {
            return null;
        }
        return this._resources[this._regulate(url)];
    },

    markErrorResource:function(url) {
        this._errors[url[0]] = 1;
    },

    _regulate:function(url) {
        if (url.length < 3) {
            for (var i = url.length; i<3; i++) {
                url.push(null);
            }
        }
        if (Z.Util.isNil(url[1])) {
            url[1] = null;
        }
        if (Z.Util.isNil(url[2])) {
            url[2] = null;
        }
        return url.join('-');
    }
});

Z.VectorLayer.registerRenderer('canvas',Z.renderer.vectorlayer.Canvas);

