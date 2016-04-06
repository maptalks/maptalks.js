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
    initialize:function(map) {
        this.map = map;
        //container is a <canvas> element
        this._isCanvasContainer = !!map._containerDOM.getContext;
        this._registerEvents();
    },

    isCanvasRender:function() {
        return true;
    },

    /**
     * 获取图层渲染容器
     * @param  {Layer} layer 图层
     * @return {Dom}       容器Dom对象
     */
    getLayerRendererContainer:function(layer) {
        if (!this._canvas) {
            this._createCanvas();
        }
        return this._canvas;
    },

    /**
     * 基于Canvas的渲染方法, layers总定义了要渲染的图层
     */
    render:function() {

        if (!this._canvas) {
            this._createCanvas();
        }
        var zoom = this.map.getZoom();
        var layers = this._getAllLayerToCanvas();

        if (!this._updateCanvasSize()) {
            this._clearCanvas();
        }

        var mwidth = this._canvas.width,
            mheight = this._canvas.height;
        this._drawBackground();

        for (var i = 0, len=layers.length; i < len; i++) {
            if (!layers[i].isVisible()) {
                continue;
            }
            var renderer = layers[i]._getRenderer();
            if (renderer && renderer.getRenderZoom() === zoom) {
                var layerImage = renderer.getCanvasImage();
                if (layerImage && layerImage['image']) {
                    this._drawLayerCanvasImage(layers[i], layerImage, mwidth, mheight);
                }
            }
        }
    },

    onZoomStart:function(startScale, endScale, transOrigin, duration, fn) {
        if (Z.Browser.ielt9) {
            fn.call(this);
            return;
        }
        var map = this.map;
        var me = this;

        this._clearCanvas();
        var baseLayer = map.getBaseLayer();
        var baseLayerImage;
        if (baseLayer && baseLayer._getRenderer()) {
            baseLayerImage =  baseLayer._getRenderer().getCanvasImage();
            if (baseLayerImage) {
                this._canvasBg = Z.DomUtil.copyCanvas(baseLayerImage['image']);
                this._canvasBgRes = map._getResolution();
                this._canvasBgCoord = map.containerPointToCoordinate(baseLayerImage['point']);
            }
        }
        if (map.options['zoomAnimation'] && this._context) {
            this._context.save();

            var width = this._canvas.width,
                height = this._canvas.height;
            var layersToTransform;
            if (!map.options['layerZoomAnimation']) {
                //zoom animation with better performance, only animate baseLayer, ignore other layers.
                if (baseLayerImage) {
                    this._drawLayerCanvasImage(baseLayer, baseLayerImage, width, height);
                }
                layersToTransform = [baseLayer];
            } else {
                //default zoom animation, animate all the layers.
                this.render();
            }
            var player = Z.Animation.animate(
                {
                    'scale' : [startScale, endScale]
                },
                {
                    'easing' : 'out',
                    'speed' : duration
                },
                Z.Util.bind(function(frame) {
                    var matrixes = this.getZoomMatrix(frame.styles['scale'], transOrigin);
                    if (player.playState === 'finished') {
                        delete this._transMatrix;
                        this._clearCanvas();
                        //only draw basetile layer
                        matrixes[1].applyToContext(this._context);
                        if (baseLayerImage) {
                            this._drawLayerCanvasImage(baseLayer, baseLayerImage, width, height);
                        }
                        this._context.restore();
                        fn.call(me);
                    } else if (player.playState === 'running'){
                        this.transform(matrixes[0], matrixes[1], layersToTransform);
                    }
                }, this)
            );
            player.play();
        } else {
            fn.call(me);
        }



    },

    /**
     * 对图层进行仿射变换
     * @param  {Matrix} matrix 变换矩阵
     * @param  {Matrix} retinaMatrix retina屏时,用来绘制图层canvas的变换矩阵
     * @param  {maptalks.Layer[]} layersToTransform 参与变换和绘制的图层
     */
    transform:function(matrix, retinaMatrix, layersToTransform) {
        var mwidth = this._canvas.width,
            mheight = this._canvas.height;
        var layers = layersToTransform || this._getAllLayerToCanvas();
        this._transMatrix = matrix;
        var scale = matrix.decompose()['scale'];
        this._transMatrix._scale = scale;
        if (!retinaMatrix) {
            retinaMatrix = matrix;
        }

        //automatically enable updatePointsWhileTransforming with mobile browsers.
        var updatePoints = Z.Browser.mobile || this.map.options['updatePointsWhileTransforming'];
        this._clearCanvas();
        if (updatePoints) {
            this._context.save();
            retinaMatrix.applyToContext(this._context);
        }

        for (var i = 0, len=layers.length; i < len; i++) {
            if (!layers[i].isVisible()) {
                continue;
            }
            var renderer = layers[i]._getRenderer();
            if (renderer) {
                if (!updatePoints) {
                    this._context.save();
                    if ((layers[i] instanceof Z.VectorLayer) && !renderer.shouldUpdateWhileTransforming()) {
                        //redraw all the geometries with transform matrix
                        //this may bring low performance if number of geometries is large.
                        renderer.draw();
                    } else {
                        retinaMatrix.applyToContext(this._context);
                    }
                }

                var layerImage = renderer.getCanvasImage();
                if (layerImage && layerImage['image']) {
                    this._drawLayerCanvasImage(layers[i], layerImage, mwidth, mheight);
                }
                if (!updatePoints) {
                    this._context.restore();
                }
            }
        }
        if (updatePoints) {
            this._context.restore();
        }
    },

    /**
     * 获取底图当前的仿射矩阵
     * @return {Matrix} 仿射矩阵
     */
    getTransform:function() {
        return this._transMatrix;
    },

    updateMapSize:function(mSize) {
        if (!mSize || this._isCanvasContainer) {return;}
        var width = mSize['width'],
            height = mSize['height'];
        var panels = this.map._panels;
        panels.mapWrapper.style.width = width + 'px';
        panels.mapWrapper.style.height = height + 'px';
        panels.mapMask.style.width = width + 'px';
        panels.mapMask.style.height = height + 'px';
        panels.controlWrapper.style.width = width + 'px';
        panels.controlWrapper.style.height = height + 'px';
    },

    getPanel: function() {
        if (this._isCanvasContainer) {
            return this.map._containerDOM;
        }
        return this.map._panels.mapWrapper;
    },

    toDataURL:function(mimeType) {
        return this._canvas.toDataURL(mimeType);
    },

    /**
     * initialize container DOM of panels
     */
    initContainer:function() {
        var panels = this.map._panels;
        function createContainer(name, className, cssText) {
            var c = Z.DomUtil.createEl('div', className);
            if (cssText) {
                c.style.cssText = cssText;
            }
            panels[name] = c;
            return c;
        }
        var containerDOM = this.map._containerDOM;

        if (this._isCanvasContainer) {
            //container is a <canvas> element.
            return;
        }

        containerDOM.innerHTML = '';

        var controlWrapper = createContainer('controlWrapper', 'MAP_CONTROL_WRAPPER');
        var mapWrapper = createContainer('mapWrapper','MAP_WRAPPER', 'position:absolute;overflow:hidden;');
        var mapPlatform = createContainer('mapPlatform', 'MAP_PLATFORM', 'position:absolute;top:0px;left:0px;');
        var mapViewPort = createContainer('mapViewPort', 'MAP_VIEWPORT', 'position:absolute;top:0px;left:0px;z-index:10;-moz-user-select:none;-webkit-user-select: none;');
        var uiContainer = createContainer('uiContainer', 'MAP_UI_CONTAINER', 'position:absolute;top:0px;left:0px;border:none;');
        var canvasContainer = createContainer('canvasContainer', 'MAP_CANVAS_CONTAINER', 'position:absolute;top:0px;left:0px;border:none;');
        var mapMask = createContainer('mapMask', 'MAP_MASK', 'position:absolute;top:0px;left:0px;');

        canvasContainer.style.zIndex=1;
        mapMask.style.zIndex = 200;
        mapPlatform.style.zIndex = 300;
        controlWrapper.style.zIndex = 400;

        containerDOM.appendChild(mapWrapper);

        mapPlatform.appendChild(uiContainer);
        mapWrapper.appendChild(mapMask);
        mapWrapper.appendChild(mapPlatform);
        mapWrapper.appendChild(controlWrapper);
        mapWrapper.appendChild(canvasContainer);

        //解决ie下拖拽矢量图形时，底图div会选中变成蓝色的bug
        if (Z.Browser.ie) {
            controlWrapper['onselectstart'] = function(e) {
                return false;
            };
            controlWrapper['ondragstart'] = function(e) { return false; };
            controlWrapper.setAttribute('unselectable', 'on');
            mapWrapper.setAttribute('unselectable', 'on');
            mapPlatform.setAttribute('unselectable', 'on');
        }
        //初始化mapPlatform的偏移量, 适用css3 translate时设置初始值
        this.offsetPlatform(new Z.Point(0,0));
        var mapSize = this.map._getContainerDomSize();
        this.updateMapSize(mapSize);
    },

    _registerEvents:function() {
        var map = this.map;
        map.on('_baselayerchangestart _baselayerload',function(param) {
            var baseLayer = map.getBaseLayer();
            if (!map.options['zoomBackground'] || baseLayer.getMask()) {
                delete this._canvasBg;
            }
        },this);
        map.on('_moving', function() {
            this.render();
        },this);
        map.on('_zoomstart',function() {
            delete this._canvasBg;
            this._clearCanvas();
        },this);
        if (typeof window !== 'undefined' ) {
            Z.DomUtil.on(window, 'resize', this._onResize, this);
        }
        if (!Z.Browser.mobile && Z.Browser.canvas) {
             this._onMapMouseMove=function(param) {
                if (map._isBusy() || !map.options['hitDetect']) {
                    return;
                }
                var vp = param['viewPoint'];
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
            };
            map.on('_mousemove',this._onMapMouseMove,this);
        }

    },


    _drawLayerCanvasImage:function(layer, layerImage, mwidth, mheight) {
        if (!layer || !layerImage || mwidth === 0 || mheight === 0){
            return;
        }
        var point = layerImage['point'],
            size = layerImage['size'];
        if (point.x + size['width'] <= 0 || point.y + size['height'] <= 0) {
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
        var alpha = this._context.globalAlpha;

        if (op < 1) {
            this._context.globalAlpha *= op;
        }
        if (imgOp < 1) {
            this._context.globalAlpha *= imgOp;
        }
        var canvasImage = layerImage['image'];
        if (Z.node) {
            var context = canvasImage.getContext('2d');
            if (context.getSvg) {
                 //canvas2svg
                canvasImage = context;
            }
        }
        this._context.drawImage(canvasImage, point.x, point.y);
        this._context.globalAlpha = alpha;
    },

    _drawBackground:function() {
        var map = this.map,
            size = map.getSize();
        if (this._canvasBg) {
            var scale = this._canvasBgRes/map._getResolution();
            var p = map.coordinateToContainerPoint(this._canvasBgCoord);
            var bSize = size._multi(scale);
            Z.Canvas.image(this._context, this._canvasBg, p.x, p.y, bSize['width'], bSize['height']);
        }
    },

    _getAllLayerToCanvas:function() {
        var layers = this.map._getLayers(function(layer) {
            if (layer && layer.isCanvasRender()) {
                return true;
            }
            return false;
        });
        return layers;
    },

    _clearCanvas:function() {
        if (!this._canvas) {
            return;
        }
        Z.Canvas.clearRect(this._context, 0, 0, this._canvas.width, this._canvas.height);
    },

    _updateCanvasSize: function() {
        if (!this._canvas || this._isCanvasContainer) {
            return;
        }
        var map = this.map;
        var mapSize = map.getSize();
        var canvas = this._canvas;
        var r = Z.Browser.retina ? 2:1;
        if (mapSize['width']*r === canvas.width && mapSize['height']*r === canvas.height) {
            return false;
        }
        //retina屏支持

        canvas.height = r * mapSize['height'];
        canvas.width = r * mapSize['width'];
        if (canvas.style) {
            canvas.style.width = mapSize['width']+'px';
            canvas.style.height = mapSize['height']+'px';
        }
        return true;
    },

    _createCanvas:function() {
        if (this._isCanvasContainer) {
            this._canvas = this.map._containerDOM;
        } else {
            this._canvas = Z.DomUtil.createEl('canvas');
            this._canvas.style.cssText = 'position:absolute;top:0px;left:0px;';
            this._updateCanvasSize();
            this.map._panels.canvasContainer.appendChild(this._canvas);
        }
        this._context = this._canvas.getContext('2d');
        if (Z.Browser.retina) {
            this._context.scale(2, 2);
        }

    },

    /**
     * 设置地图的watcher, 用来监视地图容器的大小变化
     * @ignore
     */
    _onResize:function() {
        this.map.checkSize();
    }
});

Z.Map.registerRenderer('canvas', Z.renderer.map.Canvas);
