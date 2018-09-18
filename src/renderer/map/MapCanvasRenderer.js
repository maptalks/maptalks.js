import { IS_NODE, isNumber, isFunction, requestAnimFrame, cancelAnimFrame, equalMapView } from '../../core/util';
import { createEl, preventSelection, computeDomPosition, addDomEvent, removeDomEvent } from '../../core/util/dom';
import Browser from '../../core/Browser';
import Point from '../../geo/Point';
import Canvas2D from '../../core/Canvas';
import MapRenderer from './MapRenderer';
import Map from '../../map/Map';

/**
 * @classdesc
 * Renderer class based on HTML5 Canvas for maps.
 * @class
 * @protected
 * @extends {renderer.MapRenderer}
 * @memberOf renderer
 */
class MapCanvasRenderer extends MapRenderer {
    /**
     * @param {Map} map - map for the renderer
     */
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
    renderFrame(framestamp) {
        if (!this.map) {
            return false;
        }
        const map = this.map;
        map._fireEvent('framestart');
        this.updateMapDOM();
        const layers = this._getAllLayerToRender();
        this.drawLayers(layers, framestamp);
        this.drawLayerCanvas(layers);
        // CAUTION: the order to fire frameend and layerload events
        // fire frameend before layerload, reason:
        // 1. frameend is often used internally by maptalks and plugins
        // 2. layerload is often used externally by tests or user apps
        map._fireEvent('frameend');
        this._recordView();
        // refresh map's state
        // It must be before events and frame callback, because map state may be changed in callbacks.
        this._mapview = this._getMapView();
        delete this._spatialRefChanged;
        this._fireLayerLoadEvents();
        this.executeFrameCallbacks();
        this._canvasUpdated = false;
        return true;
    }

    updateMapDOM() {
        const map = this.map;
        // when map is zooming, container is being transformed with matrix, panel doesn't need to be moved.
        if (map.isZooming()) {
            return;
        }
        const offset = map._getViewPointFrameOffset();
        if (offset) {
            map.offsetPlatform(offset);
        }
    }

    drawLayers(layers, framestamp) {
        const map = this.map,
            isInteracting = map.isInteracting(),
            // all the visible canvas layers' ids.
            canvasIds = [],
            // all the updated canvas layers's ids.
            updatedIds = [],
            fps = map.options['fpsOnInteracting'] || 0,
            timeLimit = fps === 0 ? 0 : 1000 / fps,
            // time of layer drawing
            layerLimit = this.map.options['layerCanvasLimitOnInteracting'],
            l = layers.length;
        const baseLayer = map.getBaseLayer();
        let t = 0;
        for (let i = 0; i < l; i++) {
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
            if (isCanvas && renderer.isCanvasUpdated()) {
                // don't need to call layer's draw/drawOnInteracting but need to redraw layer's updated canvas
                if (!needsRedraw) {
                    updatedIds.push(layer.getId());
                }
                this.setLayerCanvasUpdated();
            }
            delete renderer.__shouldZoomTransform;
            if (!needsRedraw) {
                if (isCanvas && isInteracting) {
                    if (map.isZooming() && !map.getPitch()) {
                        // transform layer's current canvas when zooming
                        renderer.prepareRender();
                        renderer.__shouldZoomTransform = true;
                    } else if (map.getPitch() || map.isRotating()) {
                        // when map is pitching or rotating, clear the layer canvas
                        // otherwise, leave layer's canvas unchanged
                        renderer.clearCanvas();
                    }
                }
                continue;
            }

            if (isInteracting && isCanvas) {
                if (layerLimit > 0 && l - 1 - i > layerLimit && layer !== baseLayer) {
                    layer._getRenderer().clearCanvas();
                    continue;
                }
                t += this._drawCanvasLayerOnInteracting(layer, t, timeLimit, framestamp);
            } else if (isInteracting && renderer.drawOnInteracting) {
                // dom layers
                if (renderer.prepareRender) {
                    renderer.prepareRender();
                }
                renderer.drawOnInteracting(this._eventParam, framestamp);
            } else {
                // map is not interacting, call layer's render
                renderer.render(framestamp);
            }

            if (isCanvas) {
                updatedIds.push(layer.getId());
                this.setLayerCanvasUpdated();
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
        if (!this.isLayerCanvasUpdated()) {
            const sep = '---';
            if (preCanvasIds.join(sep) !== canvasIds.join(sep) || preUpdatedIds.join(sep) !== updatedIds.join(sep)) {
                this.setLayerCanvasUpdated();
            }
        }
    }

    /**
     * check if need to call layer's draw/drawInteracting
     * @param  {Layer} layer
     * @return {Boolean}
     */
    _checkLayerRedraw(layer) {
        if (this.isSpatialReferenceChanged()) {
            return true;
        }
        const map = this.map;
        const renderer = layer._getRenderer();
        if (layer.isCanvasRender()) {
            return renderer.testIfNeedRedraw();
        } else {
            if (renderer.needToRedraw && renderer.needToRedraw()) {
                return true;
            }
            // dom layers, redraw it if map is interacting or state is changed
            return map.isInteracting() || this.isViewChanged();
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
    _drawCanvasLayerOnInteracting(layer, t, timeLimit, framestamp) {
        const map = this.map,
            renderer = layer._getRenderer(),
            drawTime = renderer.getDrawTime(),
            inTime = timeLimit === 0 || timeLimit > 0 && t + drawTime <= timeLimit;
        if (renderer.mustRenderOnInteracting && renderer.mustRenderOnInteracting()) {
            renderer.render(framestamp);
        } else if (renderer.drawOnInteracting &&
            (layer === map.getBaseLayer() || inTime ||
            map.isZooming() && layer.options['forceRenderOnZooming'] ||
            map.isMoving() && layer.options['forceRenderOnMoving'] ||
            map.isRotating() && layer.options['forceRenderOnRotating'])
        ) {
            // call drawOnInteracting to redraw the layer
            renderer.prepareRender();
            renderer.prepareCanvas();
            renderer.drawOnInteracting(this._eventParam, framestamp);
            return drawTime;
        } else if (map.isZooming() && !map.getPitch() && !map.isRotating()) {
            // when:
            // 1. layer's renderer doesn't have drawOnInteracting
            // 2. timeLimit is exceeded
            // then:
            // transform layer's current canvas when zooming
            renderer.prepareRender();
            renderer.__shouldZoomTransform = true;
        } else if (map.getPitch() || map.isRotating()) {
            // when map is pitching or rotating, clear the layer canvas
            // otherwise, leave layer's canvas unchanged
            renderer.clearCanvas();
        }
        if (renderer.drawOnInteracting && !inTime) {
            renderer.onSkipDrawOnInteracting(this._eventParam, framestamp);
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
                if (!renderer || !renderer.isRenderComplete()) {
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

    isLayerCanvasUpdated() {
        return this._canvasUpdated;
    }

    setLayerCanvasUpdated() {
        this._canvasUpdated = true;
    }

    /**
     * Renders the layers
     */
    drawLayerCanvas(layers) {
        const map = this.map;
        if (!map) {
            return;
        }
        if (!this.isLayerCanvasUpdated() && !this.isViewChanged()) {
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
        map._fireEvent('renderstart', {
            'context': this.context
        });

        if (!this._updateCanvasSize()) {
            this.clearCanvas();
        }

        const interacting = map.isInteracting(),
            limit = map.options['layerCanvasLimitOnInteracting'];
        let len = layers.length;

        let baseLayerImage;
        const images = [];
        for (let i = 0; i < len; i++) {
            if (!layers[i].isVisible() || !layers[i].isCanvasRender()) {
                continue;
            }
            const renderer = layers[i]._getRenderer();
            if (!renderer) {
                continue;
            }
            const layerImage = this._getLayerImage(layers[i]);
            if (layerImage && layerImage['image']) {
                if (layers[i] === map.getBaseLayer()) {
                    baseLayerImage = [layers[i], layerImage];
                } else {
                    images.push([layers[i], layerImage]);
                }
            }
        }

        if (baseLayerImage) {
            this._drawLayerCanvasImage(baseLayerImage[0], baseLayerImage[1]);
            this._drawFog();
        }

        len = images.length;
        const start = interacting && limit >= 0 && len > limit ? len - limit : 0;
        for (let i = start; i < len; i++) {
            this._drawLayerCanvasImage(images[i][0], images[i][1]);
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
        map._fireEvent('renderend', {
            'context': this.context
        });
    }

    setToRedraw() {
        const layers = this._getAllLayerToRender();
        for (let i = 0, l = layers.length; i < l; i++) {
            const renderer = layers[i].getRenderer();
            if (renderer && renderer.canvas && renderer.setToRedraw) {
                //to fix lost webgl context
                renderer.setToRedraw();
            }
        }
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
        if (Browser.webgl && typeof document !== 'undefined') {
            removeDomEvent(document, 'visibilitychange', this._onVisibilitychange, this);
        }
        if (this._resizeInterval) {
            clearInterval(this._resizeInterval);
        }
        delete this.context;
        delete this.canvas;
        delete this.map;
        delete this._spatialRefChanged;
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
        const renderer = layer._getRenderer();
        if (renderer.getCanvasImage) {
            return renderer.getCanvasImage();
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

        const mapWrapper = createContainer('mapWrapper', 'maptalks-wrapper', 'position:absolute;overflow:hidden;', true),
            mapAllLayers = createContainer('allLayers', 'maptalks-all-layers', POSITION0 + 'padding:0px;margin:0px;z-index:0;overflow:visible;', true),
            backStatic = createContainer('backStatic', 'maptalks-back-static', POSITION0 + 'z-index:0;', true),
            back = createContainer('back', 'maptalks-back', POSITION0 + 'z-index:1;'),
            backLayer = createContainer('backLayer', 'maptalks-back-layer', POSITION0),
            canvasContainer = createContainer('canvasContainer', 'maptalks-canvas-layer', POSITION0 + 'border:none;z-index:2;'),
            frontStatic = createContainer('frontStatic', 'maptalks-front-static', POSITION0 + 'z-index:3;', true),
            front = createContainer('front', 'maptalks-front', POSITION0 + 'z-index:4;', true),
            frontLayer = createContainer('frontLayer', 'maptalks-front-layer', POSITION0 + 'z-index:0;'),
            // children's zIndex in frontLayer will be set by map.addLayer, ui container's z-index is set to 10000 to make sure it's always on the top.
            ui = createContainer('ui', 'maptalks-ui', POSITION0 + 'border:none;z-index:1;', true),
            control = createContainer('control', 'maptalks-control', 'z-index:1', true);

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
    isViewChanged() {
        const previous = this._mapview;
        const view = this._getMapView();
        if (!previous || !equalMapView(previous, view)) {
            return true;
        }
        return false;
    }

    _recordView() {
        const map = this.map;
        if (!map._onViewChange || map.isInteracting() || map.isAnimating()) {
            return;
        }
        if (!equalMapView(map.getView(), map._getCurrentView())) {
            map._onViewChange(map.getView());
        }
    }

    isSpatialReferenceChanged() {
        return this._spatialRefChanged;
    }

    _getMapView() {
        const map = this.map;
        const center = map._getPrjCenter();
        return {
            x       : center.x,
            y       : center.y,
            zoom    : map.getZoom(),
            pitch   : map.getPitch(),
            bearing : map.getBearing(),
            width   : map.width,
            height  : map.height
        };
    }

    /**
    * Main frame loop
    */
    _frameLoop(framestamp) {
        if (!this.map) {
            this._cancelFrameLoop();
            return;
        }
        this.renderFrame(framestamp);
        // Keep registering ourselves for the next animation frame
        this._animationFrame = requestAnimFrame((framestamp) => { this._frameLoop(framestamp); });
    }

    _cancelFrameLoop() {
        if (this._animationFrame) {
            cancelAnimFrame(this._animationFrame);
        }
    }

    _drawLayerCanvasImage(layer, layerImage) {
        const ctx = this.context;
        const point = layerImage['point'].round();
        if (Browser.retina) {
            point._multi(2);
        }
        const canvasImage = layerImage['image'];
        const width = canvasImage.width, height = canvasImage.height;
        if (point.x + width <= 0 || point.y + height <= 0) {
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
        const renderer = layer.getRenderer();
        const clipped = renderer.clipCanvas(this.context);
        if (matrix && shouldTransform) {
            ctx.save();
            ctx.setTransform.apply(ctx, matrix);
        }

        /*let outlineColor = layer.options['debugOutline'];
        if (outlineColor) {
            if (outlineColor === true) {
                outlineColor = '#0f0';
            }
            this.context.strokeStyle = outlineColor;
            this.context.fillStyle = outlineColor;
            this.context.lineWidth = 10;
            Canvas2D.rectangle(ctx, point, layerImage.size, 1, 0);
            ctx.fillText([layer.getId(), point.toArray().join(), layerImage.size.toArray().join(), canvasImage.width + ',' + canvasImage.height].join(' '),
                point.x + 18, point.y + 18);
        }*/

        ctx.drawImage(canvasImage, 0, 0, width, height, point.x, point.y, width, height);
        if (matrix && shouldTransform) {
            ctx.restore();
        }
        if (clipped) {
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

    _drawFog() {
        const map = this.map;
        if (map.getPitch() <= map.options['maxVisualPitch'] || !map.options['fog']) {
            return;
        }
        const fogThickness = 30,
            r = Browser.retina ? 2 : 1;
        const ctx = this.context,
            clipExtent = map.getContainerExtent();
        let top = (map.height - map._getVisualHeight(75)) * r;
        if (top < 0) top = 0;
        const bottom = clipExtent.ymin * r,
            h = Math.ceil(bottom - top),
            color = map.options['fogColor'].join();
        const gradient = ctx.createLinearGradient(0, top, 0, bottom + fogThickness);
        const landscape = 1 - fogThickness / (h + fogThickness);
        gradient.addColorStop(0, `rgba(${color}, 0)`);
        gradient.addColorStop(0.3, `rgba(${color}, 0.3)`);
        gradient.addColorStop(landscape, `rgba(${color}, 1)`);
        gradient.addColorStop(1, `rgba(${color}, 0)`);
        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.fillRect(0, top, Math.ceil(clipExtent.getWidth()) * r, Math.ceil(h + fogThickness));
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
        const map = this.map,
            mapSize = map.getSize(),
            canvas = this.canvas,
            r = Browser.retina ? 2 : 1;
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

        map.on('_spatialreferencechange', () => {
            this._spatialRefChanged = true;
        });

        if (Browser.webgl && typeof document !== 'undefined') {
            addDomEvent(document, 'visibilitychange', this._onVisibilitychange, this);
        }
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

    _onVisibilitychange() {
        if (document.visibilityState !== 'visible') {
            return;
        }
        this.setToRedraw();
    }
}

Map.registerRenderer('canvas', MapCanvasRenderer);

Map.mergeOptions({
    'fog' : true,
    'fogColor' : [233, 233, 233]
});

export default MapCanvasRenderer;
