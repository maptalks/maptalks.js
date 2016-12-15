/**
 * @classdesc
 * Renderer class based on HTML5 Canvas2d for maps.
 * @class
 * @protected
 * @memberOf maptalks.renderer.map
 * @name Canvas
 * @extends {maptalks.renderer.map.Renderer}
 * @param {maptalks.Map} map - map for the renderer
 */
maptalks.renderer.map.Canvas = maptalks.renderer.map.Renderer.extend(/** @lends maptalks.renderer.map.Canvas.prototype */{
    initialize:function (map) {
        this.map = map;
        //container is a <canvas> element
        this._isCanvasContainer = !!map._containerDOM.getContext;
        this._registerEvents();
    },

    isCanvasRender:function () {
        return true;
    },

    /**
     * Renders the layers
     */
    render:function () {
         /**
          * renderstart event, an event fired when map starts to render.
          * @event maptalks.Map#renderstart
          * @type {Object}
          * @property {String} type                    - renderstart
          * @property {maptalks.Map} target            - the map fires event
          * @property {CanvasRenderingContext2D} context  - canvas context
          */
        this.map._fireEvent('renderstart', {'context' : this.context});
        if (!this.canvas) {
            this.createCanvas();
        }
        var zoom = this.map.getZoom();
        var layers = this._getAllLayerToTransform();

        if (!this._updateCanvasSize()) {
            this.clearCanvas();
        }

        this._drawBackground();

        for (var i = 0, len = layers.length; i < len; i++) {
            if (!layers[i].isVisible() || !layers[i].isCanvasRender()) {
                continue;
            }
            var renderer = layers[i]._getRenderer();
            if (renderer && renderer.getRenderZoom() === zoom) {
                var layerImage = this._getLayerImage(layers[i]);
                if (layerImage && layerImage['image']) {
                    this._drawLayerCanvasImage(layers[i], layerImage);
                }
            }
        }

        this._drawCenterCross();
        /**
          * renderend event, an event fired when map ends rendering.
          * @event maptalks.Map#renderend
          * @type {Object}
          * @property {String} type                      - renderend
          * @property {maptalks.Map} target              - the map fires event
          * @property {CanvasRenderingContext2D} context - canvas context
          */
        this.map._fireEvent('renderend', {'context' : this.context});
    },

    animateZoom:function (options, fn) {
        if (maptalks.Browser.ielt9) {
            fn.call(this);
            return;
        }
        var map = this.map;
        this.clearCanvas();
        if (!map.options['zoomAnimation']) {
            fn.call(this);
            return;
        }
        var baseLayer = map.getBaseLayer(),
            baseLayerImage = this._getLayerImage(baseLayer);
        if (baseLayerImage) {
            this._storeBackground(baseLayerImage);
        }
        var layersToTransform = map.options['layerZoomAnimation'] ? null : [baseLayer],
            matrix;
        if (options.startScale === 1) {
            this._beforeTransform();
        }

        var player = maptalks.Animation.animate(
            {
                'scale'  : [options.startScale, options.endScale]
            },
            {
                'easing' : 'out',
                'speed'  : options.duration
            },
            maptalks.Util.bind(function (frame) {
                if (player.playState === 'finished') {
                    this._afterTransform(matrix);
                    this._drawCenterCross();
                    fn.call(this);
                } else if (player.playState === 'running') {
                    matrix = this._transformZooming(options.origin, frame.styles['scale'], layersToTransform);
                    /**
                      * zooming event
                      * @event maptalks.Map#zooming
                      * @type {Object}
                      * @property {String} type                    - zooming
                      * @property {maptalks.Map} target            - the map fires event
                      * @property {Matrix} matrix                  - transforming matrix
                      */
                    map._fireEvent('zooming', {'matrix' : matrix});
                }
            }, this)
        ).play();
    },

    /**
     * 对图层进行仿射变换
     * @param  {Matrix} matrix 变换矩阵
     * @param  {maptalks.Layer[]} layersToTransform 参与变换和绘制的图层
     */
    transform:function (matrix, layersToTransform) {
        this.map._fireEvent('renderstart', {'context' : this.context});

        var layers = layersToTransform || this._getAllLayerToTransform();
        this.clearCanvas();
        //automatically disable layerTransforming with mobile browsers.
        var transformLayers = !maptalks.Browser.mobile && this.map.options['layerTransforming'];
        if (!transformLayers) {
            this.context.save();
            this._applyTransform(matrix);
        }

        for (var i = 0, len = layers.length; i < len; i++) {
            if (!layers[i].isVisible()) {
                continue;
            }
            var renderer = layers[i]._getRenderer();
            if (renderer) {
                if (renderer.isCanvasRender && renderer.isCanvasRender()) {
                    var transformed = false;
                    if (transformLayers && renderer.transform) {
                        transformed = renderer.transform(matrix);
                    }
                    if (transformLayers && !transformed) {
                        this.context.save();
                        this._applyTransform(matrix);
                    }

                    var layerImage = this._getLayerImage(layers[i]);
                    if (layerImage && layerImage['image']) {
                        this._drawLayerCanvasImage(layers[i], layerImage);
                    }
                    if (transformLayers && !transformed) {
                        this.context.restore();
                    }
                } else if (renderer.transform) {
                    //e.g. baseTileLayer renderered by DOM
                    renderer.transform(matrix);
                }

            }
        }
        if (!transformLayers) {
            this.context.restore();
        }

        this._drawCenterCross();
        this.map._fireEvent('renderend', {'context' : this.context});
    },

    updateMapSize:function (mSize) {
        if (!mSize || this._isCanvasContainer) { return; }
        var width = mSize['width'] + 'px',
            height = mSize['height'] + 'px';
        var panels = this.map._panels;
        panels.mapWrapper.style.width = width;
        panels.mapWrapper.style.height = height;
        panels.front.style.width = panels.frontLayer.style.width = width;
        panels.front.style.height = panels.frontLayer.style.height = height;
        panels.back.style.width = panels.layer.style.width = width;
        panels.back.style.height = panels.layer.style.height = height;
        panels.front.style.perspective = panels.back.style.perspective = height;
        this._updateCanvasSize();
    },

    getMainPanel: function () {
        if (!this.map) {
            return null;
        }
        if (this._isCanvasContainer) {
            return this.map._containerDOM;
        }
        if (this.map._panels) {
            return this.map._panels.mapWrapper;
        }
        return null;
    },

    toDataURL:function (mimeType) {
        if (!this.canvas) {
            return null;
        }
        return this.canvas.toDataURL(mimeType);
    },

    remove: function () {
        if (this._resizeInterval) {
            clearInterval(this._resizeInterval);
        }
        if (this._resizeFrame) {
            maptalks.Util.cancelAnimFrame(this._resizeFrame);
        }
        delete this.context;
        delete this.canvas;
        delete this.map;
        delete this._canvasBgRes;
        delete this._canvasBgCoord;
        delete this._canvasBg;
        delete this._zoomingMatrix;
    },

    _getLayerImage: function (layer) {
        if (layer && layer._getRenderer() && layer._getRenderer().getCanvasImage) {
            return layer._getRenderer().getCanvasImage();
        }
        return null;
    },

    _transformZooming: function (origin, scale, layersToTransform) {
        var matrix = this.map._generateMatrices(origin, scale);
        this._zoomingMatrix = matrix;
        this.transform(matrix, layersToTransform);
        return matrix;
    },

    _beforeTransform: function () {
        var map = this.map;
        // redraw the map to prepare for zoom transforming.
        // if startScale is not 1 (usually by touchZoom on mobiles), it means map is already transformed and doesn't need redraw
        if (!map.options['layerZoomAnimation']) {
            var baseLayer = map.getBaseLayer(),
                baseLayerImage = this._getLayerImage(baseLayer);
            //zoom animation with better performance, only animate baseLayer, ignore other layers.
            if (baseLayerImage) {
                this._drawLayerCanvasImage(baseLayer, baseLayerImage);
            }
        } else {
            //default zoom animation, animate all the layers.
            this.render();
        }
    },

    _afterTransform: function (matrix) {
        this.clearCanvas();
        this._applyTransform(matrix);
        this._drawBackground();
        this.context.setTransform(1, 0, 0, 1, 0, 0);
    },

    _applyTransform : function (matrix) {
        if (!matrix) {
            return;
        }
        matrix = maptalks.Browser.retina ? matrix['retina'] : matrix['container'];
        matrix.applyToContext(this.context);
    },

    _getCountOfGeosToDraw: function () {
        var layers = this._getAllLayerToTransform(),
            geos, renderer,
            total = 0;
        for (var i = layers.length - 1; i >= 0; i--) {
            renderer = layers[i]._getRenderer();
            if ((layers[i] instanceof maptalks.VectorLayer) &&
                layers[i].isVisible() && !layers[i].isEmpty() && renderer._hasPointSymbolizer) {
                geos = renderer._geosToDraw;
                if (geos) {
                    total += renderer._geosToDraw.length;
                }
            }
        }
        return total;
    },

    /**
     * initialize container DOM of panels
     */
    initContainer:function () {
        var panels = this.map._panels;
        function createContainer(name, className, cssText, enableSelect) {
            var c = maptalks.DomUtil.createEl('div', className);
            if (cssText) {
                c.style.cssText = cssText;
            }
            panels[name] = c;
            if (!enableSelect) {
                maptalks.DomUtil.preventSelection(c);
            }
            return c;
        }
        var containerDOM = this.map._containerDOM;

        if (this._isCanvasContainer) {
            //container is a <canvas> element.
            return;
        }

        containerDOM.innerHTML = '';

        var control = createContainer('control', 'maptalks-control', null, true);
        var mapWrapper = createContainer('mapWrapper', 'maptalks-wrapper', 'position:absolute;overflow:hidden;', true);
        var front = createContainer('front', 'maptalks-front', 'position:absolute;top:0px;left:0px;will-change:transform;', true);
        var ui = createContainer('ui', 'maptalks-ui', 'position:absolute;top:0px;left:0px;border:none;', true);
        var mapAllLayers = createContainer('allLayers', 'maptalks-all-layers', 'position:absolute;', true);
        var back = createContainer('back', 'maptalks-back', 'position:absolute;left:0px;top:0px;will-change:transform;');
        var layer = createContainer('layer', 'maptalks-layer', 'position:absolute;left:0px;top:0px;');
        var frontLayer = createContainer('frontLayer', 'maptalks-front-layer', 'position:absolute;left:0px;top:0px;');
        var canvasContainer = createContainer('canvasContainer', 'maptalks-layer-canvas', 'position:relative;border:none;');

        containerDOM.appendChild(mapWrapper);

        back.appendChild(layer);
        mapAllLayers.appendChild(back);
        mapAllLayers.appendChild(canvasContainer);
        front.appendChild(frontLayer);
        front.appendChild(ui);
        mapAllLayers.appendChild(front);

        mapWrapper.appendChild(mapAllLayers);
        mapWrapper.appendChild(control);

        this.createCanvas();

        this.resetContainer();
        var mapSize = this.map._getContainerDomSize();
        this.updateMapSize(mapSize);
    },

    _drawLayerCanvasImage:function (layer, layerImage) {
        if (!layer || !layerImage) {
            return;
        }
        var point = layerImage['point'].multi(maptalks.Browser.retina ? 2 : 1);
        var canvasImage = layerImage['image'];
        if (point.x + canvasImage.width <= 0 || point.y + canvasImage.height <= 0) {
            return;
        }
        //opacity of the layer image
        var op = layer.options['opacity'];
        if (!maptalks.Util.isNumber(op)) {
            op = 1;
        }
        if (op <= 0) {
            return;
        }
        var imgOp = layerImage['opacity'];
        if (!maptalks.Util.isNumber(imgOp)) {
            imgOp = 1;
        }
        if (imgOp <= 0) {
            return;
        }
        var alpha = this.context.globalAlpha;

        if (op < 1) {
            this.context.globalAlpha *= op;
        }
        if (imgOp < 1) {
            this.context.globalAlpha *= imgOp;
        }

        if (layer.options['cssFilter']) {
            this.context.filter = layer.options['cssFilter'];
        }

        if (maptalks.node) {
            var context = canvasImage.getContext('2d');
            if (context.getSvg) {
                 //canvas2svg
                canvasImage = context;
            }
        }
        if (layer.options['dx'] || layer.options['dy']) {
            point._add(layer.options['dx'], layer.options['dy']);
        }
        this.context.drawImage(canvasImage, point.x, point.y);
        this.context.globalAlpha = alpha;
        if (this.context.filter !== 'none') {
            this.context.filter = 'none';
        }
    },

    _storeBackground: function (baseLayerImage) {
        if (baseLayerImage) {
            var map = this.map;
            this._canvasBg = maptalks.DomUtil.copyCanvas(baseLayerImage['image']);
            this._canvasBgRes = map._getResolution();
            this._canvasBgCoord = map.containerPointToCoordinate(baseLayerImage['point']);
        }
    },

    _drawBackground:function () {
        var map = this.map;
        if (this._canvasBg) {
            var baseLayer = this.map.getBaseLayer();
            if (baseLayer.options['cssFilter']) {
                this.context.filter = baseLayer.options['cssFilter'];
            }
            var scale = this._canvasBgRes / map._getResolution();
            var p = map.coordinateToContainerPoint(this._canvasBgCoord)._multi(maptalks.Browser.retina ? 2 : 1);
            maptalks.Canvas.image(this.context, this._canvasBg, p.x, p.y, this._canvasBg.width * scale, this._canvasBg.height * scale);
            if (this.context.filter !== 'none') {
                this.context.filter = 'none';
            }
        }
    },

    _drawCenterCross: function () {
        if (this.map.options['centerCross']) {
            var p = new maptalks.Point(this.canvas.width / 2, this.canvas.height / 2);
            this.context.strokeStyle = '#ff0000';
            this.context.lineWidth = 2;
            this.context.beginPath();
            this.context.moveTo(p.x - 5, p.y);
            this.context.lineTo(p.x + 5, p.y);
            this.context.moveTo(p.x, p.y - 5);
            this.context.lineTo(p.x, p.y + 5);
            this.context.stroke();
        }
    },

    _getAllLayerToTransform:function () {
        return this.map._getLayers();
    },

    clearCanvas:function () {
        if (!this.canvas) {
            return;
        }
        maptalks.Canvas.clearRect(this.context, 0, 0, this.canvas.width, this.canvas.height);
    },

    _updateCanvasSize: function () {
        if (!this.canvas || this._isCanvasContainer) {
            return false;
        }
        var map = this.map;
        var mapSize = map.getSize();
        var canvas = this.canvas;
        var r = maptalks.Browser.retina ? 2 : 1;
        if (mapSize['width'] * r === canvas.width && mapSize['height'] * r === canvas.height) {
            return false;
        }
        //retina屏支持

        canvas.height = r * mapSize['height'];
        canvas.width = r * mapSize['width'];
        if (canvas.style) {
            canvas.style.width = mapSize['width'] + 'px';
            canvas.style.height = mapSize['height'] + 'px';
        }

        return true;
    },

    createCanvas:function () {
        if (this._isCanvasContainer) {
            this.canvas = this.map._containerDOM;
        } else {
            this.canvas = maptalks.DomUtil.createEl('canvas');
            this._updateCanvasSize();
            this.map._panels.canvasContainer.appendChild(this.canvas);
        }
        this.context = this.canvas.getContext('2d');
    },

    _checkSize:function () {
        maptalks.Util.cancelAnimFrame(this._resizeFrame);
        if (this.map._zooming || this.map._moving || this.map._panAnimating) {
            return;
        }
        this._resizeFrame = maptalks.Util.requestAnimFrame(
            maptalks.Util.bind(function () {
                if (this.map._moving || this.map._isBusy()) {
                    return;
                }
                this.map.checkSize();
            }, this)
        );
    },

    _registerEvents:function () {
        var map = this.map;
        map.on('_baselayerchangestart', function () {
            delete this._canvasBg;
        }, this);
        map.on('_baselayerload', function () {
            var baseLayer = map.getBaseLayer();
            if (!map.options['zoomBackground'] || baseLayer.getMask()) {
                delete this._canvasBg;
            }
        }, this);
        map.on('_resize', function () {
            delete this._canvasBg;
        }, this);
        map.on('_zoomstart', function () {
            delete this._canvasBg;
            this.clearCanvas();
        }, this);
        if (map.options['checkSize'] && !maptalks.node && (typeof window !== 'undefined')) {
            // maptalks.DomUtil.on(window, 'resize', this._checkSize, this);
            this._resizeInterval = setInterval(maptalks.Util.bind(function () {
                if (!map._containerDOM.parentNode) {
                    //is deleted
                    clearInterval(this._resizeInterval);
                } else {
                    this._checkSize();
                }
            }, this), 1000);
        }
        if (!maptalks.Browser.mobile && maptalks.Browser.canvas) {
            this._onMapMouseMove = function (param) {
                if (map._isBusy() || map._moving || !map.options['hitDetect']) {
                    return;
                }
                if (this._hitDetectTimeout) {
                    maptalks.Util.cancelAnimFrame(this._hitDetectTimeout);
                }
                this._hitDetectTimeout = maptalks.Util.requestAnimFrame(function () {
                    var vp = param['point2d'];
                    var layers = map._getLayers();
                    var hit = false,
                        cursor;
                    for (var i = layers.length - 1; i >= 0; i--) {
                        var layer = layers[i];
                        if (layer._getRenderer() && layer._getRenderer().hitDetect) {
                            if (layer.options['cursor'] !== 'default' && layer._getRenderer().hitDetect(vp)) {
                                cursor = layer.options['cursor'];
                                hit = true;
                                break;
                            }
                        }
                    }
                    if (hit) {
                        map._trySetCursor(cursor);
                    } else {
                        map._trySetCursor('default');
                    }
                });

            };
            map.on('_mousemove', this._onMapMouseMove, this);
        }
        /*map.on('_moving _moveend', function () {
            this.render();
        }, this);*/
    }
});

maptalks.Map.registerRenderer('canvas', maptalks.renderer.map.Canvas);
