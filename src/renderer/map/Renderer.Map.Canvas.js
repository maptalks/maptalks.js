/**
 * @classdesc
 * Renderer class based on HTML5 Canvas2d for maps.
 * @class
 * @protected
 * @memberOf maptalks.renderer.map
 * @name Canvas
 * @extends {Z.renderer.map.Renderer}
 * @param {maptalks.Map} map - map for the renderer
 */
Z.renderer.map.Canvas = Z.renderer.map.Renderer.extend(/** @lends Z.renderer.map.Canvas.prototype */{
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
        if (Z.Browser.ielt9) {
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

        if (this.context) { this.context.save(); }
        var player = Z.Animation.animate(
            {
                'scale'  : [options.startScale, options.endScale]
            },
            {
                'easing' : 'out',
                'speed'  : options.duration
            },
            Z.Util.bind(function (frame) {
                if (player.playState === 'finished') {
                    this._afterTransform(matrix);
                    if (this.context) { this.context.restore(); }
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
        var transformLayers = !Z.Browser.mobile && this.map.options['layerTransforming'];
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
        var width = mSize['width'],
            height = mSize['height'];
        var panels = this.map._panels;
        panels.mapWrapper.style.width = width + 'px';
        panels.mapWrapper.style.height = height + 'px';
        // panels.mapPlatform.style.width = width + 'px';
        // panels.mapPlatform.style.height = height + 'px';
        panels.canvasContainer.style.width = width + 'px';
        panels.canvasContainer.style.height = height + 'px';
        // panels.control.style.width = width + 'px';
        // panels.control.style.height = height + 'px';
        this._updateCanvasSize();
    },

    getMainPanel: function () {
        if (this._isCanvasContainer) {
            return this.map._containerDOM;
        }
        return this.map._panels.mapWrapper;
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
            Z.Util.cancelAnimFrame(this._resizeFrame);
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
    },

    _applyTransform : function (matrix) {
        if (!matrix) {
            return;
        }
        matrix = Z.Browser.retina ? matrix['retina'] : matrix['container'];
        matrix.applyToContext(this.context);
    },

    _getCountOfGeosToDraw: function () {
        var layers = this._getAllLayerToTransform(),
            geos, renderer,
            total = 0;
        for (var i = layers.length - 1; i >= 0; i--) {
            renderer = layers[i]._getRenderer();
            if ((layers[i] instanceof Z.VectorLayer) &&
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
            var c = Z.DomUtil.createEl('div', className);
            if (cssText) {
                c.style.cssText = cssText;
            }
            panels[name] = c;
            if (!enableSelect) {
                Z.DomUtil.preventSelection(c);
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
        var mapPlatform = createContainer('mapPlatform', 'maptalks-platform', 'position:absolute;top:0px;left:0px;', true);
        var ui = createContainer('ui', 'maptalks-ui', 'position:absolute;top:0px;left:0px;border:none;', true);
        var layer = createContainer('layer', 'maptalks-layer', 'position:absolute;left:0px;top:0px;');
        var frontLayer = createContainer('frontLayer', 'maptalks-front-layer', 'position:absolute;left:0px;top:0px;');
        var canvasContainer = createContainer('canvasContainer', 'maptalks-layer-canvas', 'position:absolute;top:0px;left:0px;border:none;');

        mapPlatform.style.zIndex = 300;
        frontLayer.style.zIndex = 201;
        canvasContainer.style.zIndex = 200;
        layer.style.zIndex = 100;
        ui.style.zIndex = 300;
        control.style.zIndex = 400;

        containerDOM.appendChild(mapWrapper);

        mapPlatform.appendChild(ui);
        mapWrapper.appendChild(mapPlatform);
        mapWrapper.appendChild(canvasContainer);
        mapWrapper.appendChild(layer);
        mapWrapper.appendChild(frontLayer);
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
        var point = layerImage['point'].multi(Z.Browser.retina ? 2 : 1);
        var canvasImage = layerImage['image'];
        if (point.x + canvasImage.width <= 0 || point.y + canvasImage.height <= 0) {
            return;
        }
        //opacity of the layer image
        var op = layer.options['opacity'];
        if (!Z.Util.isNumber(op)) {
            op = 1;
        }
        if (op <= 0) {
            return;
        }
        var imgOp = layerImage['opacity'];
        if (!Z.Util.isNumber(imgOp)) {
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

        if (Z.node) {
            var context = canvasImage.getContext('2d');
            if (context.getSvg) {
                 //canvas2svg
                canvasImage = context;
            }
        }
        this.context.drawImage(canvasImage, point.x, point.y);
        this.context.globalAlpha = alpha;
    },

    _storeBackground: function (baseLayerImage) {
        if (baseLayerImage) {
            var map = this.map;
            this._canvasBg = Z.DomUtil.copyCanvas(baseLayerImage['image']);
            this._canvasBgRes = map._getResolution();
            this._canvasBgCoord = map.containerPointToCoordinate(baseLayerImage['point']);
        }
    },

    _drawBackground:function () {
        var map = this.map;
        if (this._canvasBg) {
            var scale = this._canvasBgRes / map._getResolution();
            var p = map.coordinateToContainerPoint(this._canvasBgCoord)._multi(Z.Browser.retina ? 2 : 1);
            Z.Canvas.image(this.context, this._canvasBg, p.x, p.y, this._canvasBg.width * scale, this._canvasBg.height * scale);
        }
    },

    _drawCenterCross: function () {
        if (this.map.options['centerCross']) {
            var p = new Z.Point(this.canvas.width / 2, this.canvas.height / 2);
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
        Z.Canvas.clearRect(this.context, 0, 0, this.canvas.width, this.canvas.height);
    },

    _updateCanvasSize: function () {
        if (!this.canvas || this._isCanvasContainer) {
            return false;
        }
        var map = this.map;
        var mapSize = map.getSize();
        var canvas = this.canvas;
        var r = Z.Browser.retina ? 2 : 1;
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
            this.canvas = Z.DomUtil.createEl('canvas');
            this._updateCanvasSize();
            this.map._panels.canvasContainer.appendChild(this.canvas);
        }
        this.context = this.canvas.getContext('2d');
    },

    _checkSize:function () {
        Z.Util.cancelAnimFrame(this._resizeFrame);
        this._resizeFrame = Z.Util.requestAnimFrame(
            Z.Util.bind(function () {
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
        if (map.options['checkSize'] && !Z.node && (typeof window !== 'undefined')) {
            // Z.DomUtil.on(window, 'resize', this._checkSize, this);
            this._resizeInterval = setInterval(Z.Util.bind(function () {
                if (!map._containerDOM.parentNode) {
                    //is deleted
                    clearInterval(this._resizeInterval);
                } else {
                    this._checkSize();
                }
            }, this), 1000);
        }
        if (!Z.Browser.mobile && Z.Browser.canvas) {
            this._onMapMouseMove = function (param) {
                if (map._isBusy() || map._moving || !map.options['hitDetect']) {
                    return;
                }
                if (this._hitDetectTimeout) {
                    Z.Util.cancelAnimFrame(this._hitDetectTimeout);
                }
                this._hitDetectTimeout = Z.Util.requestAnimFrame(function () {
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
        map.on('_moveend', function () {
            if (Z.Browser.mobile) {
                Z.DomUtil.offsetDom(this.canvas, map.offsetPlatform().multi(-1));
            }
            this.render();
        }, this);
        if (!Z.Browser.mobile) {
            map.on('_moving', function () {
                this.render();
            }, this);
        } else {
            map.on('_zoomend', function () {
                Z.DomUtil.offsetDom(this.canvas, new Z.Point(0, 0));
            }, this);
        }
    }
});

Z.Map.registerRenderer('canvas', Z.renderer.map.Canvas);
