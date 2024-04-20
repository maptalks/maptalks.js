import { IS_NODE, isNumber, isFunction, requestAnimFrame, cancelAnimFrame, equalMapView, calCanvasSize } from '../../core/util';
import { createEl, preventSelection, computeDomPosition } from '../../core/util/dom';
import { GlobalEvent, EVENT_DOC_DRAGEND, EVENT_DOC_VISIBILITY_CHANGE, EVENT_DPR_CHANGE, EVENT_DOC_DRAGSTART } from './../../core/GlobalEvent';
import Browser from '../../core/Browser';
import Point from '../../geo/Point';
import Canvas2D from '../../core/Canvas';
import MapRenderer from './MapRenderer';
import Map, { type PanelDom } from '../../map/Map';
import CollisionIndex from '../../core/CollisionIndex';
import GlobalConfig from '../../GlobalConfig';
import type EditHandle from '../edit/EditHandle';
import type EditOutline from '../edit/EditOutline';
import type { Layer } from '../../layer';
import type Size from '../../geo/Size';
import type { WithUndef } from '../../types/typings';

const tempCollisionIndex = new CollisionIndex();

/**
 * 基于 Canvas2D 的 map 渲染器
 *
 * @english
 * Renderer class based on HTML5 Canvas for maps.
 * @class
 * @protected
 * @extends {renderer.MapRenderer}
 * @memberOf renderer
 */
class MapCanvasRenderer extends MapRenderer {
    _containerIsCanvas: boolean;
    _loopTime: number;
    _resizeTime: number;
    _resizeCount: number;
    _frameCycleRenderCount: number;
    _resizeEventList: ResizeObserverEntry[];

    _needClear: boolean;
    _canvasUpdated: boolean;
    _isViewChanged: WithUndef<boolean>;
    _spatialRefChanged: WithUndef<boolean>;
    _resizeObserver: ResizeObserver;
    _resizeInterval: number;
    _checkSizeInterval: number;
    _hitDetectFrame: number;
    _animationFrame: number;
    _mapview: MapView;
    _zoomMatrix: number[];
    _eventParam: any;
    _canvasIds: string[];
    _updatedIds: string[];
    _frameTimestamp: number;
    _checkPositionTime: number;
    _tops: (EditHandle | EditOutline)[];

    context: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;
    topLayer: HTMLCanvasElement;
    topCtx: CanvasRenderingContext2D;

    /**
     * @param map - map for the renderer
     */
    constructor(map: Map) {
        super(map);
        //container is a <canvas> element
        this._containerIsCanvas = !!(map.getContainer() as HTMLCanvasElement).getContext;
        this._registerEvents();
        this._loopTime = 0;
        this._resizeEventList = [];
        this._resizeTime = -Infinity;
        this._frameCycleRenderCount = 0;
    }

    load() {
        this.initContainer();
    }

    /**
     * render layers in current frame
     * @returns return false to cease frame loop
     */
    renderFrame(framestamp: number): boolean {
        const map = this.map;
        if (!map || !map.options['renderable']) {
            return false;
        }
        this._handleResizeEventList(framestamp);
        //not render anything when map container is hide
        if (map.options['stopRenderOnOffscreen'] && this._containerIsOffscreen()) {
            return true;
        }
        this._updateDomPosition(framestamp);
        delete this._isViewChanged;
        map._fireEvent('framestart');
        this.updateMapDOM();
        map.clearCollisionIndex();
        const layers = this._getAllLayerToRender();
        this.drawLayers(layers, framestamp);
        const updated = this.drawLayerCanvas(layers);
        if (updated) {
            // when updated is false, should escape drawing tops and centerCross to keep handle's alpha
            this.drawTops();
            this._drawCenterCross();
            if (map.options['debugSky']) {
                this._debugSky();
            }
        }
        this._needClear = false;
        // this._drawContainerExtent();
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
        //loop ui Collides
        map.uiCollides();
        return true;
    }

    updateMapDOM() {
        const map = this.map;
        // when map is zooming, container is being transformed with matrix, panel doesn't need to be moved.
        if (map.isZooming()) {
            return;
        }
        const offset = map.getViewPointFrameOffset();
        if (offset) {
            map.offsetPlatform(offset);
        } else if (this.domChanged()) {
            this.offsetPlatform(null, true);
        }
    }

    drawLayers(layers: Layer[], framestamp: number) {
        const map = this.map,
            isInteracting = map.isInteracting(),
            // all the visible canvas layers' ids.
            canvasIds: string[] = [],
            // all the updated canvas layers's ids.
            updatedIds: string[] = [],
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
            const transformMatrix = renderer.__zoomTransformMatrix;
            delete renderer.__zoomTransformMatrix;
            if (!needsRedraw) {
                if (isCanvas && isInteracting) {
                    if (map.isZooming() && !map.getPitch()) {
                        // transform layer's current canvas when zooming
                        renderer.prepareRender();
                        renderer.__zoomTransformMatrix = this._zoomMatrix;
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
                if (renderer.checkAndDraw) {
                    // for canvas renderers
                    renderer.checkAndDraw(renderer.drawOnInteracting, this._eventParam, framestamp);
                } else {
                    renderer.drawOnInteracting(this._eventParam, framestamp);
                }
            } else {
                // map is not interacting, call layer's render
                renderer.render(framestamp);
                //地图缩放完以后，如果下一次render需要载入资源，仍需要设置transformMatrix
                //防止在资源载入完成之前，缺少transformMatrix导致的绘制错误
                if (isCanvas && transformMatrix && renderer.isLoadingResource()) {
                    renderer.__zoomTransformMatrix = transformMatrix;
                }
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
     * @param layer
     */
    _checkLayerRedraw(layer: Layer): boolean {
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
     * @param layer
     * @param t     current consumed time of layer drawing
     * @param timeLimit time limit for layer drawing
     * @param framestamp
     * @returns time to draw this layer
     * @private
     */
    _drawCanvasLayerOnInteracting(layer: Layer, t: number, timeLimit: number, framestamp: number): number {
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
            if (renderer.checkAndDraw) {
                // for canvas renderers
                renderer.checkAndDraw(renderer.drawOnInteracting, this._eventParam, framestamp);
            } else {
                renderer.drawOnInteracting(this._eventParam, framestamp);
            }
            return drawTime;
        } else if (map.isZooming() && !map.getPitch() && !map.isRotating()) {
            // when:
            // 1. layer's renderer doesn't have drawOnInteracting
            // 2. timeLimit is exceeded
            // then:
            // transform layer's current canvas when zooming
            renderer.prepareRender();
            renderer.__zoomTransformMatrix = this._zoomMatrix;
        } else if (map.getPitch() || map.isRotating()) {
            // when map is pitching or rotating, clear the layer canvas
            // otherwise, leave layer's canvas unchanged
            renderer.clearCanvas();
        }
        if (renderer.drawOnInteracting && !inTime) {
            // @ts-expect-error 我也不知道怎么办，不敢乱动，可能插件里需要？
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
    drawLayerCanvas(layers: Layer[]) {
        const map = this.map;
        if (!map) {
            return false;
        }
        if (!this.isLayerCanvasUpdated() && !this.isViewChanged() && this._needClear === false) {
            return false;
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

        const targetWidth = this.canvas.width;
        const targetHeight = this.canvas.height;
        if (baseLayerImage) {
            this._drawLayerCanvasImage(baseLayerImage[0], baseLayerImage[1], targetWidth, targetHeight);
            this._drawFog();
        }

        len = images.length;
        const start = interacting && limit >= 0 && len > limit ? len - limit : 0;
        for (let i = start; i < len; i++) {
            this._drawLayerCanvasImage(images[i][0], images[i][1], targetWidth, targetHeight);
        }

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
        return true;
    }

    setToRedraw() {
        const layers = this._getAllLayerToRender();
        //set maprender for clear canvas
        this._needClear = true;
        for (let i = 0, l = layers.length; i < l; i++) {
            const renderer = layers[i].getRenderer();
            if (renderer && renderer.canvas && renderer.setToRedraw) {
                //to fix lost webgl context
                renderer.setToRedraw();
            }
        }
    }

    updateMapSize(size: Size) {
        if (!size || this._containerIsCanvas) {
            return;
        }
        const width = size['width'] + 'px',
            height = size['height'] + 'px';
        const panels = this.map.getPanels();
        panels.mapWrapper.style.width = width;
        panels.mapWrapper.style.height = height;
        this._updateCanvasSize();
    }

    getMainPanel() {
        if (!this.map) {
            return null;
        }
        if (this._containerIsCanvas) {
            return this.map.getContainer();
        }
        if (this.map.getPanels()) {
            return this.map.getPanels().mapWrapper;
        }
        return null;
    }

    toDataURL(mimeType: string, quality?: number) {
        if (!this.canvas) {
            return null;
        }
        return this.canvas.toDataURL(mimeType, quality);
    }

    remove() {
        if (Browser.webgl && typeof document !== 'undefined') {
            GlobalEvent.off(EVENT_DPR_CHANGE, this._thisDocDPRChange, this);
            GlobalEvent.off(EVENT_DOC_VISIBILITY_CHANGE, this._thisDocVisibilitychange, this);
            GlobalEvent.off(EVENT_DOC_DRAGSTART, this._thisDocDragStart, this);
            GlobalEvent.off(EVENT_DOC_DRAGEND, this._thisDocDragEnd, this);
            // removeDomEvent(document, 'visibilitychange', this._thisDocVisibilitychange, this);
            // removeDomEvent(document, 'dragstart', this._thisDocDragStart, this);
            // removeDomEvent(document, 'dragend', this._thisDocDragEnd, this);
        }
        if (this._resizeInterval) {
            clearInterval(this._resizeInterval);
        }
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
        }
        delete this.context;
        delete this.canvas;
        delete this.map;
        delete this._spatialRefChanged;
        this._cancelFrameLoop();
    }

    hitDetect(point: Point) {
        const map = this.map;
        if (!map || !map.options['hitDetect'] || map.isInteracting()) {
            return;
        }
        const layers = map._getLayers();
        let cursor = 'default';
        const limit = map.options['hitDetectLimit'] || 0;
        let counter = 0;
        if (point && point._round) {
            // map size is decimal,containerPoint.x/containerPoint.y is decimal
            point._round();
        }
        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            // 此处如果未开启，无需执行后面判断
            if (!layer.options['hitDetect'] || (layer.isEmpty && layer.isEmpty()) || !layer.options['geometryEvents']) {
                continue;
            }
            const renderer = layer._getRenderer();
            if (!renderer || !renderer.hitDetect) {
                continue;
            }
            if (renderer.isBlank && renderer.isBlank()) {
                continue;
            }
            // renderer.hitDetect(point)) .  This can't ignore the shadows.
            /**
             * TODO
             *  This requires a better way to judge
             */
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

    _getLayerImage(layer: Layer) {
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
        const panels = this.map.getPanels();

        function createContainer(name: string, className: string, cssText: string, enableSelect?: boolean): PanelDom {
            const c = createEl('div', className) as PanelDom;
            if (cssText) {
                c.style.cssText = cssText;
            }
            panels[name] = c;
            if (!enableSelect) {
                preventSelection(c);
            }
            return c;
        }
        const containerDOM = this.map.getContainer();

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
        back.layerDOM = backLayer;
        mapAllLayers.appendChild(back);
        mapAllLayers.appendChild(canvasContainer);
        front.appendChild(frontLayer);
        front.layerDOM = frontLayer;
        front.uiDOM = ui;
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
     */
    isViewChanged() {
        if (this._isViewChanged !== undefined) {
            return this._isViewChanged;
        }
        const previous = this._mapview;
        const view = this._getMapView();
        this._isViewChanged = !previous || !equalMapView(previous, view);
        return this._isViewChanged;
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

    _getMapView(): MapView {
        const map = this.map;
        const center = map._getPrjCenter();
        return {
            x: center.x,
            y: center.y,
            zoom: map.getZoom(),
            pitch: map.getPitch(),
            bearing: map.getBearing(),
            width: map.width,
            height: map.height
        };
    }

    _lockFrameRenderEnable() {
        const { maxFPS } = this.map.options || {};
        if (maxFPS <= 0 || GlobalConfig.maxFPS <= maxFPS) {
            return true;
        }
        const count = Math.ceil(GlobalConfig.maxFPS / maxFPS);
        return this._frameCycleRenderCount >= count;
    }

    /**
    * Main frame loop
    */
    _frameLoop(framestamp: number) {
        if (!this.map) {
            this._cancelFrameLoop();
            return;
        }
        this._frameCycleRenderCount++;
        if (this._lockFrameRenderEnable()) {
            framestamp = framestamp || 0;
            this._frameTimestamp = framestamp;
            this._resizeCount = 0;
            this.renderFrame(framestamp);
            this._frameCycleRenderCount = 0;
        } else if (this.map.options.debug) {
            console.log('skip frame ing,frameCycleRenderCount:', this._frameCycleRenderCount);
        }
        // Keep registering ourselves for the next animation frame
        this._animationFrame = requestAnimFrame((framestamp: number) => { this._frameLoop(framestamp); });
    }

    _cancelFrameLoop() {
        if (this._animationFrame) {
            cancelAnimFrame(this._animationFrame);
        }
    }

    _drawLayerCanvasImage(layer: Layer, layerImage: any, targetWidth?: number, targetHeight?: number) {
        const ctx = this.context;
        const point = layerImage['point'].round();
        const dpr = this.map.getDevicePixelRatio();
        if (dpr !== 1) {
            point._multi(dpr);
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
        const renderer = layer.getRenderer();
        const matrix = renderer.__zoomTransformMatrix;
        const clipped = renderer.clipCanvas(this.context as any);
        if (matrix) {
            ctx.save();
            ctx.setTransform(...(matrix as any));
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

        ctx.drawImage(canvasImage, 0, 0, width, height, point.x, point.y, targetWidth, targetHeight);
        if (matrix) {
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
                Canvas2D.drawCross(this.context, p.x, p.y, 2, '#f00');
            }
        }
    }

    _drawContainerExtent() {
        const { cascadePitches } = this.map.options;
        const h30 = this.map.height - this.map._getVisualHeight(cascadePitches[0]);
        const h60 = this.map.height - this.map._getVisualHeight(cascadePitches[1]);

        const extent = this.map.getContainerExtent();
        const ctx = this.context;
        ctx.beginPath();
        ctx.moveTo(0, extent.ymin);
        ctx.lineTo(extent.xmax, extent.ymin);
        ctx.stroke();


        ctx.beginPath();
        ctx.moveTo(0, h30);
        ctx.lineTo(extent.xmax, h30);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, h60);
        ctx.lineTo(extent.xmax, h60);
        ctx.stroke();
        // console.log(extent.ymin, h30, h60);
    }

    _drawFog() {
        const map = this.map;
        if (map.getPitch() <= map.options['maxVisualPitch'] || !map.options['fog']) {
            return;
        }
        const fogThickness = 30;
        const r = map.getDevicePixelRatio();
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

    _debugSky() {
        const map = this.map;
        if (!map) {
            return this;
        }
        const height = map.getContainerExtent().ymin;
        if (height <= 0) {
            return this;
        }
        const ctx = this.context;
        ctx.strokeStyle = 'red';
        ctx.strokeRect(0, 0, map.width, height);
        return this;
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
            r = map.getDevicePixelRatio();
        // width/height不变并不意味着 css width/height 不变
        const { width, height, cssWidth, cssHeight } = calCanvasSize(mapSize, r);
        if (canvas.style && (canvas.style.width !== cssWidth || canvas.style.height !== cssHeight)) {
            canvas.style.width = cssWidth;
            canvas.style.height = cssHeight;
        }
        if (width === canvas.width && height === canvas.height) {
            return false;
        }
        //retina屏支持

        canvas.height = height;
        canvas.width = width;
        this.topLayer.width = canvas.width;
        this.topLayer.height = canvas.height;
        return true;
    }

    createCanvas() {
        this.topLayer = createEl('canvas') as HTMLCanvasElement;
        this.topCtx = this.topLayer.getContext('2d');
        if (this._containerIsCanvas) {
            this.canvas = this.map.getContainer() as HTMLCanvasElement;
        } else {
            this.canvas = createEl('canvas') as HTMLCanvasElement;
            this._updateCanvasSize();
            this.map.getPanels().canvasContainer.appendChild(this.canvas);
        }
        this.context = this.canvas.getContext('2d');
    }

    _updateDomPosition(framestamp: number) {
        if (this._checkPositionTime === undefined) {
            this._checkPositionTime = -Infinity;
        }
        const dTime = Math.abs(framestamp - this._checkPositionTime);
        if (dTime >= 500) {
            // refresh map's dom position
            computeDomPosition(this.map.getContainer());
            this._checkPositionTime = Math.min(framestamp, this._checkPositionTime);
        }
        return this;
    }

    _handleResizeEventList(time: number) {
        if (!this._resizeEventList) {
            return this;
        }
        const len = this._resizeEventList.length;
        if (len === 0) {
            return this;
        }
        if (this._resizeTime && time - this._resizeTime < 60) {
            return this;
        }
        const contentRect = this._resizeEventList[len - 1].contentRect;
        this.map.setContainerDomRect(contentRect);
        this._resizeEventList = [];
        this._checkSize();
        this._resizeCount = this._resizeCount || 0;
        //force render all layers,这两句代码不能颠倒，因为要先重置所有图层的size，才能正确的渲染所有图层
        this.renderFrame((this._frameTimestamp || 0) + (++this._resizeCount) / 100);
        this._resizeTime = time;
        return this;
    }

    _checkSize() {
        if (!this.map) {
            return;
        }
        this.map.checkSize();
    }

    _setCheckSizeInterval(interval: number) {
        // ResizeObserver priority of use
        // https://developer.mozilla.org/zh-CN/docs/Web/API/ResizeObserver
        if (Browser.resizeObserver) {
            if (this._resizeObserver) {
                this._resizeObserver.disconnect();
            }
            if (this.map) {
                // eslint-disable-next-line no-unused-vars
                this._resizeObserver = new ResizeObserver((entries) => {
                    if (!this.map || this.map.isRemoved()) {
                        this._resizeObserver.disconnect();
                    } else if (entries.length) {
                        this._resizeEventList = this._resizeEventList || [];
                        this._resizeEventList.push(entries[0]);
                    }
                });
                this._resizeObserver.observe(this.map.getContainer());
            }
        } else {
            clearInterval(this._resizeInterval);
            this._checkSizeInterval = interval;
            this._resizeInterval = setInterval(() => {
                if (!this.map || this.map.isRemoved()) {
                    //is deleted
                    clearInterval(this._resizeInterval);
                } else {
                    this._checkSize();
                }
            }, this._checkSizeInterval) as unknown as number;
        }
    }

    _registerEvents() {
        const map = this.map;

        if (map.options['checkSize'] && !IS_NODE && (typeof window !== 'undefined')) {
            this._setCheckSizeInterval(map.options['checkSizeInterval']);
        }
        if (!Browser.mobile) {
            map.on('_mousemove', this._onMapMouseMove, this);
        }

        map.on('_dragrotatestart _dragrotating _dragrotateend _movestart _moving _moveend _zoomstart', (param: any) => {
            this._eventParam = param;
        });

        map.on('_zooming', (param: any) => {
            if (!map.getPitch()) {
                this._zoomMatrix = param['matrix']['container'];
            }
            this._eventParam = param;
        });

        map.on('_zoomend', (param: any) => {
            this._eventParam = param;
            delete this._zoomMatrix;
        });

        map.on('_spatialreferencechange', () => {
            this._spatialRefChanged = true;
        });

        if (Browser.webgl && typeof document !== 'undefined') {
            GlobalEvent.on(EVENT_DPR_CHANGE, this._thisDocDPRChange, this);
            GlobalEvent.on(EVENT_DOC_VISIBILITY_CHANGE, this._thisDocVisibilitychange, this);
            GlobalEvent.on(EVENT_DOC_DRAGSTART, this._thisDocDragStart, this);
            GlobalEvent.on(EVENT_DOC_DRAGEND, this._thisDocDragEnd, this);

            // addDomEvent(document, 'visibilitychange', this._thisDocVisibilitychange, this);
            // addDomEvent(document, 'dragstart', this._thisDocDragStart, this);
            // addDomEvent(document, 'dragend', this._thisDocDragEnd, this);
        }
    }

    _onMapMouseMove(param: any) {
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

    //----------- top elements methods -------------
    // edit handles or edit outlines
    addTopElement(e: EditHandle | EditOutline) {
        if (!this._tops) {
            this._tops = [];
        }
        this._tops.push(e);
    }

    removeTopElement(e: EditHandle | EditOutline) {
        if (!this._tops) {
            return;
        }
        const idx = this._tops.indexOf(e);
        if (idx >= 0) {
            this._tops.splice(idx, 1);
        }
    }

    getTopElements() {
        return this._tops || [];
    }

    sortTopElements() {
        this._tops = this._tops.sort((top1, top2) => {
            const zIndex1 = top1.options.zIndex || 0;
            const zIndex2 = top2.options.zIndex || 0;
            return zIndex2 - zIndex1;
        });
    }

    drawTops() {
        // clear topLayer
        this.topCtx.clearRect(0, 0, this.topLayer.width, this.topLayer.height);
        const collisionIndex = tempCollisionIndex;
        collisionIndex.clear();
        this.map.fire('drawtopstart');
        this.map.fire('drawtops');
        const tops = this.getTopElements();
        let updated = false;
        const dpr = this.map.getDevicePixelRatio();
        const geos = [];
        for (let i = 0; i < tops.length; i++) {
            const top = tops[i];
            if (top.needCollision && top.needCollision()) {
                const bbox = top.getRenderBBOX(dpr);
                if (bbox) {
                    if (collisionIndex.collides(bbox)) {
                        const geometry = top.target && top.target._geometry;
                        if (geometry && geos.indexOf(geometry) === -1) {
                            geos.push(geometry);
                            geometry.fire('handlecollision');
                        }
                        continue;
                    } else {
                        collisionIndex.insertBox(bbox);
                    }
                }
            }
            if (top.render(this.topCtx)) {
                updated = true;
            }
        }
        if (updated) {
            this.context.drawImage(this.topLayer, 0, 0);
        }
        this.map.fire('drawtopsend');
    }
}

Map.registerRenderer<typeof MapCanvasRenderer>('canvas', MapCanvasRenderer);

Map.mergeOptions({
    'fog': false,
    'fogColor': [233, 233, 233]
});

export type MapView = {
    x: number;
    y: number;
    zoom: number;
    pitch: number;
    bearing: number;
    width: number;
    height: number;
}

export default MapCanvasRenderer;
