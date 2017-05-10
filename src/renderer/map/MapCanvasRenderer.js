import { IS_NODE, now, isNumber, isFunction, requestAnimFrame, cancelAnimFrame } from 'core/util';
import { createEl, preventSelection, copyCanvas } from 'core/util/dom';
import Browser from 'core/Browser';
import Point from 'geo/Point';
import Canvas2D from 'core/Canvas';
import MapRenderer from './MapRenderer';
import Map from 'map/Map';

/**
 * @classdesc
 * Renderer class based on HTML5 Canvas2d for maps.
 * @class
 * @protected
 * @memberOf renderer.map
 * @name Canvas
 * @extends {renderer.map.Renderer}
 * @param {Map} map - map for the renderer
 */
export default class MapCanvasRenderer extends MapRenderer {
    constructor(map) {
        super(map);
        //container is a <canvas> element
        this._containerIsCanvas = !!map._containerDOM.getContext;
        this._registerEvents();
        this._loopTime = 0;
    }

    load() {
        this.initContainer();
    }

    /**
     * render layers in current frame
     * @return {Boolean} return false to cease frame loop
     */
    renderFrame() {
        if (!this.map) {
            this._cancelAnimationLoop();
            return false;
        }
        this.map._fireEvent('framestart');
        this.updateMap();
        this.drawLayers();
        this.drawLayerCanvas();
        // CAUTION: the order to fire frameend and layerload events
        // fire frameend before layerload, reason:
        // 1. frameend is often used internally by maptalks and plugins
        // 2. layerload is often used externally by tests or user apps
        this.map._fireEvent('frameend');
        this._fireLayerLoadEvents();
        if (this._updated) {
            this._loopTime = now();
        }
        this._needRedraw = false;
        this._updated = false;
        if (now() - this._loopTime > 100) {
            this._cancelAnimationLoop();
            return false;
        }
        return true;
    }

    updateMap() {
        const map = this.map;
        if (!map.isMoving()) {
            return;
        }
        const pre = map._mapViewCoord;
        if (!pre) {
            return;
        }
        const current = map._getPrjCenter();
        if (pre.equals(current)) {
            return;
        }
        const offset = map._prjToContainerPoint(pre).sub(map._prjToContainerPoint(current));
        map.offsetPlatform(offset);
        this._updated = true;
    }

    drawLayers() {
        const layers = this._getAllLayerToRender();
        const map = this.map;
        const isInteracting = map.isInteracting();
        // all the visible canvas layers' ids.
        const canvasIds = [];
        // all the drawn canvas layers's ids.
        const drawnIds = [];
        const fps = map.options['fpsOnInteracting'] || 0;
        const limit = fps === 0 ? 0 : 1000 / fps;
        let t = 0;
        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            if (!layer.isVisible()) {
                continue;
            }
            if (layer.isCanvasRender()) {
                canvasIds.push(layer.getId());
            }
            const renderer = layer._getRenderer();
            if (!renderer) {
                continue;
            }
            delete renderer.__shouldZoomTransform;
            if (!renderer.isAnimating() && !renderer.needToRedraw()) {
                continue;
            }
            this._updated = true;
            if (isInteracting && renderer.isCanvasRender()) {
                if (renderer.getDrawTime) {
                    t += renderer.getDrawTime();
                }
                const inTime = limit === 0 || limit > 0 && t <= limit;
                if (inTime && renderer.drawOnInteracting) {
                    renderer.prepareRender();
                    renderer.prepareCanvas();
                    renderer.drawOnInteracting();
                } else if (map.isZooming() && !map.getPitch()) {
                    renderer.prepareRender();
                    renderer.__shouldZoomTransform = true;
                } else if (map.isDragRotating() || map.getPitch()) {
                    renderer.clearCanvas();
                }
            } else if (isInteracting && renderer.drawOnInteracting) {
                renderer.prepareRender();
                // dom layers
                renderer.drawOnInteracting();
            } else {
                renderer.render();
            }

            if (layer.isCanvasRender()) {
                drawnIds.push(layer.getId());
                this.setToRedraw();
            }
        }
        if (!this._needToRedraw()) {
            // compare:
            // 1. previous drawn layers and current drawn layers
            // 2. previous canvas layers and current canvas layers
            // set map to redraw if either changed
            const preCanvasIds = this._canvasIds || [];
            const preDrawnIds = this._drawnIds || [];
            this._canvasIds = canvasIds;
            this._drawnIds = drawnIds;
            const sep = '---';
            if (preCanvasIds.join(sep) !== canvasIds.join(sep) || preDrawnIds.join(sep) !== drawnIds.join(sep)) {
                this.setToRedraw();
            }
        }
    }

    /**
     * Fire layerload events.
     * Make sure layer are drawn on map when firing the events
     */
    _fireLayerLoadEvents() {
        if (this._drawnIds && this._drawnIds.length > 0) {
            const map = this.map;
            this._drawnIds.forEach(id => {
                const layer = map.getLayer(id);
                if (!layer) {
                    return;
                }
                const renderer = layer._getRenderer();
                if (!renderer || !renderer.canvas || !renderer.isRenderComplete()) {
                    return;
                }
                /**
                 * layerload event, fired when layer is loaded.
                 *
                 * @event Layer#layerload
                 * @type {Object}
                 * @property {String} type - layerload
                 * @property {Layer} target - layer
                 */
                layer.fire('layerload');
            });
        }

    }

    _needToRedraw() {
        return this._needRedraw;
    }

    setToRedraw() {
        this._needRedraw = true;
    }

    _canResueLayerCanvas() {
        return !this.map.getPitch() && this.map.isZooming();
    }

    /**
     * Renders the layers
     */
    drawLayerCanvas() {
        if (!this.map) {
            return;
        }
        if (!this._needToRedraw() && !this._isStateChanged()) {
            return;
        }
        if (!this.canvas) {
            this.createCanvas();
        }

        /**
         * renderstart event, an event fired when map starts to render.
         * @event Map#renderstart
         * @type {Object}
         * @property {String} type           - renderstart
         * @property {Map} target            - the map fires event
         * @property {CanvasRenderingContext2D} context  - canvas context
         */
        this.map._fireEvent('renderstart', {
            'context': this.context
        });

        const layers = this._getAllLayerToRender();

        if (!this._updateCanvasSize()) {
            this.clearCanvas();
        }

        this._drawBackground();
        const interacting = this.map.isInteracting();
        const limit = this.map.options['numOfLayersOnInteracting'];
        const len = layers.length;

        const start = interacting && len > limit ? len - limit : 0;
        for (let i = start; i < len; i++) {
            if (!layers[i].isVisible() || !layers[i].isCanvasRender()) {
                continue;
            }
            const renderer = layers[i]._getRenderer();
            if (!renderer || interacting && renderer.__isEmpty) {
                continue;
            }
            const layerImage = this._getLayerImage(layers[i]);
            if (layerImage && layerImage['image']) {
                this._drawLayerCanvasImage(layers[i], layerImage);
            }
        }

        this._drawCenterCross();
        /**
         * renderend event, an event fired when map ends rendering.
         * @event Map#renderend
         * @type {Object}
         * @property {String} type                      - renderend
         * @property {Map} target              - the map fires event
         * @property {CanvasRenderingContext2D} context - canvas context
         */
        this.map._fireEvent('renderend', {
            'context': this.context
        });
    }

    updateMapSize(size) {
        if (!size || this._containerIsCanvas) {
            return;
        }
        const width = size['width'] + 'px',
            height = size['height'] + 'px';
        const panels = this.map._panels;
        panels.mapWrapper.style.width = width;
        panels.mapWrapper.style.height = height;
        this._updateCanvasSize();
    }

    getMainPanel() {
        if (!this.map) {
            return null;
        }
        if (this._containerIsCanvas) {
            return this.map._containerDOM;
        }
        if (this.map._panels) {
            return this.map._panels.mapWrapper;
        }
        return null;
    }

    toDataURL(mimeType) {
        if (!this.canvas) {
            return null;
        }
        return this.canvas.toDataURL(mimeType);
    }

    remove() {
        if (this._resizeInterval) {
            clearInterval(this._resizeInterval);
        }
        this._cancelAnimationLoop();
        delete this.context;
        delete this.canvas;
        delete this.map;
        delete this._canvasBgRes;
        delete this._canvasBgCoord;
        delete this._canvasBg;
    }

    hitDetect(point) {
        const map = this.map;
        if (!map || !map.options['hitDetect'] || map.isInteracting()) {
            return;
        }
        const layers = map._getLayers();
        let cursor = 'default';
        const limit = map.options['hitDetectLimit'] || 0;
        let counter = 0;
        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            if (layer.isEmpty && layer.isEmpty()) {
                continue;
            }
            const renderer = layer._getRenderer();
            if (!renderer || !renderer.hitDetect) {
                continue;
            }
            if (renderer.isBlank && renderer.isBlank()) {
                continue;
            }
            if (layer.options['cursor'] !== 'default' && renderer.hitDetect(point)) {
                cursor = layer.options['cursor'] || 'pointer';
                break;
            }
            counter++;
            if (limit > 0 && counter > limit) {
                break;
            }
        }

        map._trySetCursor(cursor);
    }

    _getLayerImage(layer) {
        if (layer && layer._getRenderer() && layer._getRenderer().getCanvasImage) {
            return layer._getRenderer().getCanvasImage();
        }
        return null;
    }

    /**
     * initialize container DOM of panels
     */
    initContainer() {
        const panels = this.map._panels;

        function createContainer(name, className, cssText, enableSelect) {
            const c = createEl('div', className);
            if (cssText) {
                c.style.cssText = cssText;
            }
            panels[name] = c;
            if (!enableSelect) {
                preventSelection(c);
            }
            return c;
        }
        const containerDOM = this.map._containerDOM;

        if (this._containerIsCanvas) {
            //container is a <canvas> element.
            return;
        }

        containerDOM.innerHTML = '';

        const POSITION0 = 'position:absolute;top:0px;left:0px;';

        const control = createContainer('control', 'maptalks-control', null, true),
            mapWrapper = createContainer('mapWrapper', 'maptalks-wrapper', 'position:absolute;overflow:hidden;', true),
            mapAllLayers = createContainer('allLayers', 'maptalks-all-layers', POSITION0 + 'padding:0px;margin:0px;', true),
            frontStatic = createContainer('frontStatic', 'maptalks-front-static', POSITION0, true),
            front = createContainer('front', 'maptalks-front', POSITION0 + 'will-change:transform;', true),
            frontLayer = createContainer('frontLayer', 'maptalks-front-layer', POSITION0),
            // children's zIndex in frontLayer will be set by map.addLayer, ui container's z-index is set to 10000 to make sure it's always on the top.
            ui = createContainer('ui', 'maptalks-ui', POSITION0 + 'border:none;z-index:10000;', true),
            backStatic = createContainer('backStatic', 'maptalks-back-static', POSITION0, true),
            back = createContainer('back', 'maptalks-back', POSITION0 + 'will-change:transform;'),
            backLayer = createContainer('backLayer', 'maptalks-back-layer', POSITION0),
            canvasContainer = createContainer('canvasContainer', 'maptalks-canvas-layer', 'position:relative;border:none;');

        containerDOM.appendChild(mapWrapper);

        mapAllLayers.appendChild(backStatic);
        back.appendChild(backLayer);
        mapAllLayers.appendChild(back);
        mapAllLayers.appendChild(canvasContainer);
        front.appendChild(frontLayer);
        mapAllLayers.appendChild(frontStatic);
        mapAllLayers.appendChild(front);
        front.appendChild(ui);

        mapWrapper.appendChild(mapAllLayers);
        mapWrapper.appendChild(control);

        this.createCanvas();

        this.resetContainer();
        const mapSize = this.map._getContainerDomSize();
        this.updateMapSize(mapSize);
    }

    /**
     * Is current map's state changed?
     * @return {Boolean}
     */
    _isStateChanged() {
        const map = this.map;
        const previous = this._state;
        const center = map.getCenter();
        this._state = {
            x : center.x,
            y : center.y,
            zoom : map.getZoom(),
            pitch : map.getPitch(),
            bearing : map.getBearing()
        };
        if (!previous || !equalState(previous, this._state)) {
            return true;
        }
        return false;
    }

    startFrameLoop() {
        if (this._animationFrame) {
            return;
        }
        this._animationLoop();
    }

    /**
    * Main animation loop
    */
    _animationLoop() {
        if (!this.map) {
            this._cancelAnimationLoop();
            return;
        }
        const goon = this.renderFrame();
        if (!goon) {
            return;
        }
        // Keep registering ourselves for the next animation frame
        this._animationFrame = requestAnimFrame(() => { this._animationLoop(); });
    }

    _cancelAnimationLoop() {
        if (this._animationFrame) {
            cancelAnimFrame(this._animationFrame);
            delete this._animationFrame;
        }
    }

    _drawLayerCanvasImage(layer, layerImage) {
        if (!layer || !layerImage) {
            return;
        }
        const ctx = this.context;
        const point = layerImage['point'].multi(Browser.retina ? 2 : 1);
        const canvasImage = layerImage['image'];
        if (point.x + canvasImage.width <= 0 || point.y + canvasImage.height <= 0) {
            return;
        }
        //opacity of the layer image
        let op = layer.options['opacity'];
        if (!isNumber(op)) {
            op = 1;
        }
        if (op <= 0) {
            return;
        }
        let imgOp = layerImage['opacity'];
        if (!isNumber(imgOp)) {
            imgOp = 1;
        }
        if (imgOp <= 0) {
            return;
        }
        const alpha = ctx.globalAlpha;

        if (op < 1) {
            ctx.globalAlpha *= op;
        }
        if (imgOp < 1) {
            ctx.globalAlpha *= imgOp;
        }
        if (layer.options['cssFilter']) {
            ctx.filter = layer.options['cssFilter'];
        }
        const matrix = this._zoomMatrix;
        const shouldTransform = !!layer._getRenderer().__shouldZoomTransform;
        if (matrix && shouldTransform) {
            ctx.save();
            ctx.setTransform.apply(ctx, matrix);
        }

        if (layer.options['debugOutline']) {
            this.context.strokeStyle = '#0f0';
            this.context.fillStyle = '#0f0';
            this.context.lineWidth = 10;
            Canvas2D.rectangle(ctx, point, layerImage.size, 1, 0);
            ctx.fillText([layer.getId(), point.toArray().join(), layerImage.size.toArray().join(), canvasImage.width + ',' + canvasImage.height].join(' '),
                point.x + 18, point.y + 18);
        }

        ctx.drawImage(canvasImage, point.x, point.y);
        if (matrix && shouldTransform) {
            ctx.restore();
        }
        if (ctx.filter !== 'none') {
            ctx.filter = 'none';
        }
        ctx.globalAlpha = alpha;
    }

    _storeBackground(baseLayerImage) {
        if (baseLayerImage) {
            const map = this.map;
            this._canvasBg = copyCanvas(baseLayerImage['image']);
            this._canvasBgRes = map._getResolution();
            this._canvasBgCoord = map.containerPointToCoordinate(baseLayerImage['point']);
        }
    }

    _drawBackground() {
        const map = this.map;
        if (this._canvasBg) {
            const baseLayer = this.map.getBaseLayer();
            if (baseLayer.options['cssFilter']) {
                this.context.filter = baseLayer.options['cssFilter'];
            }
            const scale = this._canvasBgRes / map._getResolution();
            const p = map.coordinateToContainerPoint(this._canvasBgCoord)._multi(Browser.retina ? 2 : 1);
            Canvas2D.image(this.context, this._canvasBg, p.x, p.y, this._canvasBg.width * scale, this._canvasBg.height * scale);
            if (this.context.filter !== 'none') {
                this.context.filter = 'none';
            }
        }
    }

    _drawCenterCross() {
        const cross = this.map.options['centerCross'];
        if (cross) {
            const ctx = this.context;
            const p = new Point(this.canvas.width / 2, this.canvas.height / 2);
            if (isFunction(cross)) {
                cross(ctx, p);
            } else {
                Canvas2D.drawCross(this.context, p, 2, '#f00');
            }
        }
    }

    _getAllLayerToRender() {
        return this.map._getLayers();
    }

    clearCanvas() {
        if (!this.canvas) {
            return;
        }
        Canvas2D.clearRect(this.context, 0, 0, this.canvas.width, this.canvas.height);
    }

    _updateCanvasSize() {
        if (!this.canvas || this._containerIsCanvas) {
            return false;
        }
        const map = this.map;
        const mapSize = map.getSize();
        const canvas = this.canvas;
        const r = Browser.retina ? 2 : 1;
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
    }

    createCanvas() {
        if (this._containerIsCanvas) {
            this.canvas = this.map._containerDOM;
        } else {
            this.canvas = createEl('canvas');
            this._updateCanvasSize();
            this.map._panels.canvasContainer.appendChild(this.canvas);
        }
        this.context = this.canvas.getContext('2d');
    }

    _checkSize() {
        if (!this.map || this.map.isInteracting()) {
            return;
        }
        this.map.checkSize();
    }

    _setCheckSizeInterval(interval) {
        clearInterval(this._resizeInterval);
        this._checkSizeInterval = interval;
        this._resizeInterval = setInterval(() => {
            if (!this.map || this.map.isRemoved()) {
                //is deleted
                clearInterval(this._resizeInterval);
            } else {
                this._checkSize();
            }
        }, this._checkSizeInterval);
    }

    _registerEvents() {
        const map = this.map;
        // map.on('_baselayerchangestart _resize _zoomstart', this._clearBackground, this);
        // map.on('_baselayerload', () => {
        //     const baseLayer = map.getBaseLayer();
        //     if (!map.options['zoomBackground'] || baseLayer.getMask()) {
        //         this._clearBackground();
        //     }
        // });
        map.on('_movestart _zoomstart _dragrotatestart', this.startFrameLoop, this);
        if (map.options['checkSize'] && !IS_NODE && (typeof window !== 'undefined')) {
            this._setCheckSizeInterval(1000);
        }
        if (!Browser.mobile) {
            map.on('_mousemove', this._onMapMouseMove, this);
        }
        // map.on('_moving', () => {
        //     if (!map.getPitch()) {
        //         this.render();
        //     } else {
        //         this.renderOnInteracting();
        //     }
        // });

        map.on('_moveend', () => {
            this.setToRedraw();
        });

        map.on('_zooming', (param) => {
            if (!map.getPitch()) {
                this._zoomMatrix = param['matrix']['container'];
            }
            // this.renderOnInteracting();
        });

        // map.on('_dragrotating', () => {
        //     this.renderOnInteracting();
        // });

        map.on('_zoomend', () => {
            delete this._zoomMatrix;
            this.setToRedraw();
        });
    }

    _clearBackground() {
        delete this._canvasBg;
    }

    _onMapMouseMove(param) {
        const map = this.map;
        if (map.isInteracting() || !map.options['hitDetect']) {
            return;
        }
        if (this._hitDetectFrame) {
            cancelAnimFrame(this._hitDetectFrame);
        }
        this._hitDetectFrame = requestAnimFrame(() => {
            this.hitDetect(param['containerPoint']);
        });
    }

    _getCanvasLayers() {
        return this.map._getLayers(layer => layer.isCanvasRender());
    }
}

Map.registerRenderer('canvas', MapCanvasRenderer);

function equalState(obj1, obj2) {
    for (const p in obj1) {
        if (obj1[p] !== obj2[p]) {
            return false;
        }
    }
    return true;
}
