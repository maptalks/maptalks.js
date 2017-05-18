import { IS_NODE, isNumber, isFunction, requestAnimFrame, cancelAnimFrame } from 'core/util';
import { createEl, preventSelection, computeDomPosition } from 'core/util/dom';
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
            return false;
        }
        this.map._fireEvent('framestart');
        this.updateMapDOM();
        const layers = this._getAllLayerToRender();
        this.drawLayers(layers);
        this.drawLayerCanvas(layers);
        // CAUTION: the order to fire frameend and layerload events
        // fire frameend before layerload, reason:
        // 1. frameend is often used internally by maptalks and plugins
        // 2. layerload is often used externally by tests or user apps
        this.map._fireEvent('frameend');
        this._fireLayerLoadEvents();
        this.executeFrameCallbacks();
        this._needRedraw = false;
        return true;
    }

    updateMapDOM() {
        const map = this.map;
        if (map.isInteracting() && !map.isMoving()) {
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
    }

    drawLayers(layers) {
        const map = this.map;
        const isInteracting = map.isInteracting();
        // all the visible canvas layers' ids.
        const canvasIds = [];
        // all the updated canvas layers's ids.
        const updatedIds = [];
        const fps = map.options['fpsOnInteracting'] || 0;
        const timeLimit = fps === 0 ? 0 : 1000 / fps;
        // time of layer drawing
        const layerLimit = this.map.options['layerCanvasLimitOnInteracting'];
        let t = 0;
        this._lastUpdatedId = -1;
        const l = layers.length;
        for (let i = l - 1; i >= 0; i--) {
            const layer = layers[i];
            if (!layer.isVisible()) {
                continue;
            }
            const isCanvas = layer.isCanvasRender();
            if (isCanvas) {
                canvasIds.push(layer.getId());
            }
            const renderer = layer._getRenderer();
            if (!renderer) {
                continue;
            }
            // if need to call layer's draw/drawInteracting
            const needsRedraw = this._checkLayerRedraw(layer);
            if (renderer.isCanvasUpdated && renderer.isCanvasUpdated()) {
                // don't need to call layer's draw/drawOnInteracting but need to redraw layer's updated canvas
                if (!needsRedraw) {
                    updatedIds.push(layer.getId());
                    this._lastUpdatedId = i;
                }
                this.setToRedraw();
            }
            delete renderer.__shouldZoomTransform;
            if (!needsRedraw) {
                continue;
            }

            if (isInteracting && isCanvas) {
                if (layerLimit > 0 && l - 1 - i > layerLimit) {
                    continue;
                }
                t += this._drawCanvasLayerOnInteracting(layer, t, timeLimit);
            } else if (isInteracting && renderer.drawOnInteracting) {
                // dom layers
                if (renderer.prepareRender) {
                    renderer.prepareRender();
                }
                renderer.drawOnInteracting(this._eventParam);
            } else {
                // map is not interacting, call layer's render
                renderer.render();
            }

            if (isCanvas) {
                updatedIds.push(layer.getId());
                this._lastUpdatedId = i;
                this.setToRedraw();
            }
        }
        // compare:
        // 1. previous drawn layers and current drawn layers
        // 2. previous canvas layers and current canvas layers
        // set map to redraw if either changed
        const preCanvasIds = this._canvasIds || [];
        const preUpdatedIds = this._updatedIds || [];
        this._canvasIds = canvasIds;
        this._updatedIds = updatedIds;
        if (!this._needToRedraw()) {
            const sep = '---';
            if (preCanvasIds.join(sep) !== canvasIds.join(sep) || preUpdatedIds.join(sep) !== updatedIds.join(sep)) {
                this.setToRedraw();
            }
        }
    }

    /**
     * check if need to call layer's draw/drawInteracting
     * @param  {Layer} layer
     * @return {Boolean}
     */
    _checkLayerRedraw(layer) {
        const map = this.map;
        const renderer = layer._getRenderer();
        if (layer.isCanvasRender()) {
            return renderer.isAnimating && renderer.isAnimating() || renderer.needToRedraw();
        } else {
            if (renderer.needToRedraw && renderer.needToRedraw()) {
                return true;
            }
            // dom layers, redraw it if map is interacting or state is changed
            return map.isInteracting() || this.isStateChanged();
        }
    }

    /**
     * Draw canvas rendered layer when map is interacting
     * @param  {Layer} layer
     * @param  {Number} t     current consumed time of layer drawing
     * @param  {Number} timeLimit time limit for layer drawing
     * @return {Number}       time to draw this layer
     * @private
     */
    _drawCanvasLayerOnInteracting(layer, t, timeLimit) {
        const map = this.map;
        const renderer = layer._getRenderer();
        const drawTime = renderer.getDrawTime();
        const inTime = timeLimit === 0 || timeLimit > 0 && t + drawTime <= timeLimit;
        if (renderer.drawOnInteracting &&
            (inTime ||
            map.isZooming() && layer.options['forceRenderOnZooming'] ||
            map.isMoving() && layer.options['forceRenderOnMoving'] ||
            map.isDragRotating() && layer.options['forceRenderOnDragRotating'])
            ) {
            // call drawOnInteracting to redraw the layer
            renderer.prepareRender();
            renderer.prepareCanvas();
            renderer.drawOnInteracting(this._eventParam);
            return drawTime;
        } else if (map.isZooming() && !map.getPitch()) {
            // when:
            // 1. layer's renderer doesn't have drawOnInteracting
            // 2. timeLimit is exceeded
            // then:
            // transform layer's current canvas when zooming
            renderer.prepareRender();
            renderer.__shouldZoomTransform = true;
        } else if (renderer.drawOnDragRotating && inTime && !map.getPitch() && map.isDragRotating()) {
            // This is a special case for TileLayerCanvasRenderer
            // when:
            // 1. layer's renderer doesn't have drawOnInteracting method
            // 2. layer's renderer has a drawOnDragRotating method
            // then:
            // call drawOnDragRotating when map is dragRotating without any pitch
            renderer.prepareRender();
            renderer.prepareCanvas();
            renderer.drawOnDragRotating();
            return drawTime;
        } else if (map.getPitch() || map.isDragRotating()) {
            // when map is pitching or rotating, clear the layer canvas
            // otherwise, leave layer's canvas unchanged
            renderer.clearCanvas();
        }
        return 0;
    }

    /**
     * Fire layerload events.
     * Make sure layer are drawn on map when firing the events
     * @private
     */
    _fireLayerLoadEvents() {
        if (this._updatedIds && this._updatedIds.length > 0) {
            const map = this.map;
            //firing order as FIFO, painting as FILO, so the order needs to be reversed
            this._updatedIds.reverse().forEach(id => {
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

    /**
     * Renders the layers
     */
    drawLayerCanvas(layers) {
        if (!this.map) {
            return;
        }
        if (!this._needToRedraw() && !this.isStateChanged()) {
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

        if (!this._updateCanvasSize()) {
            this.clearCanvas();
        }

        const interacting = this.map.isInteracting();
        const limit = this.map.options['layerCanvasLimitOnInteracting'];
        const len = layers.length;

        const start = interacting && limit >= 0 && len > limit ? len - limit : 0;
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
        delete this.context;
        delete this.canvas;
        delete this.map;

        this._cancelFrameLoop();
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
    isStateChanged() {
        const map = this.map;
        const previous = this._state;
        const center = map.getCenter();
        this._state = {
            x       : center.x,
            y       : center.y,
            zoom    : map.getZoom(),
            pitch   : map.getPitch(),
            bearing : map.getBearing(),
            width   : map.width,
            height  : map.height
        };
        if (!previous || !equalState(previous, this._state)) {
            return true;
        }
        return false;
    }

    /**
    * Main frame loop
    */
    _frameLoop() {
        if (!this.map) {
            this._cancelFrameLoop();
            return;
        }
        this.renderFrame();
        // Keep registering ourselves for the next animation frame
        this._animationFrame = requestAnimFrame(() => { this._frameLoop(); });
    }

    _cancelFrameLoop() {
        if (this._animationFrame) {
            cancelAnimFrame(this._animationFrame);
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
        // refresh map's dom position
        computeDomPosition(this.map._containerDOM);
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

        if (map.options['checkSize'] && !IS_NODE && (typeof window !== 'undefined')) {
            this._setCheckSizeInterval(1000);
        }
        if (!Browser.mobile) {
            map.on('_mousemove', this._onMapMouseMove, this);
        }

        map.on('_dragrotatestart _dragrotating _dragrotateend _movestart _moving _moveend _zoomstart', (param) => {
            this._eventParam = param;
        });

        map.on('_zooming', (param) => {
            if (!map.getPitch()) {
                this._zoomMatrix = param['matrix']['container'];
            }
            this._eventParam = param;
        });

        map.on('_zoomend', (param) => {
            this._eventParam = param;
            delete this._zoomMatrix;
        });
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
