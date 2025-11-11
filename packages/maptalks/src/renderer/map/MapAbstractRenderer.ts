import { IS_NODE, requestAnimFrame, cancelAnimFrame, equalMapView, calCanvasSize } from '../../core/util';
import { createEl, preventSelection, computeDomPosition, removeDomNode } from '../../core/util/dom';
import { GlobalEvent, EVENT_DOC_DRAGEND, EVENT_DOC_VISIBILITY_CHANGE, EVENT_DPR_CHANGE, EVENT_DOC_DRAGSTART } from './../../core/GlobalEvent';
import Browser from '../../core/Browser';
import Point from '../../geo/Point';
import MapRenderer from './MapRenderer';
import Map, { type PanelDom } from '../../map/Map';
import CollisionIndex from '../../core/CollisionIndex';
import GlobalConfig from '../../GlobalConfig';
import type EditHandle from '../edit/EditHandle';
import type EditOutline from '../edit/EditOutline';
import type { Layer } from '../../layer';
import type Size from '../../geo/Size';
import type { WithUndef } from '../../types/typings';
import { getDefaultBBOX, pointsBBOX } from '../../core/util/bbox';

const tempCollisionIndex = new CollisionIndex();

/**
 * map 渲染器的抽象类，封装了与具体渲染无关的逻辑
 *
 * @english
 * Renderer class based on HTML5 Canvas for maps.
 * @class
 * @protected
 * @extends {renderer.MapRenderer}
 * @memberOf renderer
 */
class MapAbstractRenderer extends MapRenderer {
    //@internal
    _containerIsCanvas: boolean;
    //@internal
    _loopTime: number;
    //@internal
    _resizeTime: number;
    //@internal
    _resizeCount: number;
    //@internal
    _frameCycleRenderCount: number;
    //@internal
    _resizeEventList: ResizeObserverEntry[];

    //@internal
    _isViewChanged: WithUndef<boolean>;
    //@internal
    _spatialRefChanged: WithUndef<boolean>;
    //@internal
    _resizeObserver: ResizeObserver;
    //@internal
    _resizeInterval: number;
    //@internal
    _checkSizeInterval: number;
    //@internal
    _hitDetectFrame: number;
    //@internal
    _animationFrame: number;
    //@internal
    _mapview: MapView;
    //@internal
    _zoomMatrix: number[];
    //@internal
    _eventParam: any;
    //@internal
    _canvasIds: string[];
    //@internal
    _updatedIds: string[];
    //@internal
    _frameTimestamp: number;
    //@internal
    _checkPositionTime: number;
    //@internal
    _tops: (EditHandle | EditOutline)[];

    context: any;
    canvas: HTMLCanvasElement;
    topLayer: HTMLCanvasElement;
    topCtx: CanvasRenderingContext2D;
    ready: boolean;
    //@internal
    _bindFrameLoop: any;

    /**
     * @param map - map for the renderer
     */
    constructor(map: Map) {
        super(map);
        //container is a <canvas> element
        this.ready = false;
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

    _updateMapCurrentViewGLInfo() {
        const map = this.map;
        if (!map) {
            return this;
        }
        map._currentViewGLInfo = null;
        const containerExtent = map.getContainerExtent();
        if (!containerExtent) {
            return this;
        }
        const bufferSize = 100;
        const { xmin, ymin, xmax, ymax } = containerExtent

        const p1 = new Point(xmin, ymin);
        const p2 = new Point(xmax, ymin);
        const p3 = new Point(xmax + bufferSize, ymax + bufferSize);
        const p4 = new Point(xmin - bufferSize, ymax + bufferSize);
        const scale = map._getResolution() / map.getGLRes();
        let ring = [p1, p2, p3, p4].map(p => {
            return map._containerPointToPoint(p)._multi(scale);
        })
        const RB = ring[2];
        const LB = ring[3];
        ring = ring.sort((a, b) => {
            return b.y - a.y;
        });

        const [lp1, lp2, rp1, rp2] = ring;
        let lt, lb, rt, rb;
        if (lp1.x < lp2.x) {
            lt = lp1;
            rt = lp2;
        } else {
            lt = lp2;
            rt = lp1;
        }
        if (rp1.x < rp2.x) {
            lb = rp1;
            rb = rp2;
        } else {
            lb = rp2;
            rb = rp1;
        }
        const bbox = getDefaultBBOX();
        pointsBBOX(ring, bbox);
        const [minx, miny, maxx, maxy] = bbox;
        const center = new Point((minx + maxx) / 2, (miny + maxy) / 2);
        /**
         *  LT---------------RT
         *   \               /
         *    \             /
         *     \           /
         *       LB------RB
         *      camera behind
         *
         */
        map._currentViewGLInfo = {
            lt,
            rt,
            rb,
            lb,
            center,
            RB,
            LB
        };
    }

    /**
     * render layers in current frame
     * @returns return false to cease frame loop
     */
    renderFrame(framestamp: number): boolean {
        this._updateMapCurrentViewGLInfo();
        const map = this.map;
        if (!map || !map.options['renderable']) {
            return false;
        }
        this._handleResizeEventList(framestamp);
        //not render anything when map container is hide
        if (map.options['stopRenderOnOffscreen'] && this._containerIsOffscreen()) {
            return false;
        }
        this._updateDomPosition(framestamp);
        delete this._isViewChanged;
        map._fireEvent('framestart');
        this.updateMapDOM();
        map.clearCollisionIndex();
        const layers = this._getAllLayerToRender();
        const updated = this.drawLayers(layers, framestamp);
        // const updated = this.drawLayerCanvas(layers);
        if (updated) {
            // when updated is false, should escape drawing tops and centerCross to keep handle's alpha
            this.drawTops();
        }
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
        this._fireLayerLoadEvents(layers);
        this.executeFrameCallbacks();
        //loop ui Collides
        map.uiCollides();
        return true;
    }

    getFrameTimestamp() {
        return this._frameTimestamp || 0;
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

    //need redraw all layer,cause by collision/crs change/view change etc...
    checkIfNeedToRedrawLayers(layers: Layer[]) {
        if (this.isSpatialReferenceChanged()) {
            return true;
        }
        for (let i = 0, len = layers.length; i < len; i++) {
            if (this._checkLayerRedraw(layers[i])) {
                return true;
            }
        }
        return false;
    }

    drawLayers(layers: Layer[], framestamp: number) {
        const needRedraw = this.checkIfNeedToRedrawLayers(layers);
        if (!needRedraw && !this.map.options['forceRedrawPerFrame']) {
            return false;
        }
        this.clearCanvas();
        const map = this.map,
            isInteracting = map.isInteracting(),
            l = layers.length;
        for (let i = 0; i < l; i++) {
            const layer = layers[i];
            if (!layer.isVisible()) {
                continue;
            }
            const isCanvas = layer.isCanvasRender();
            const renderer = layer._getRenderer();
            if (!renderer) {
                continue;
            }
            if (isCanvas) {
                this.clearLayerCanvasContext(layer);
            }
            if (isInteracting && isCanvas) {
                this._drawCanvasLayerOnInteracting(layer, 0, 0, framestamp);
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
            }
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

    /**
     * check if need to call layer's draw/drawInteracting
     * @param layer
     */
    //@internal
    _checkLayerRedraw(layer: Layer): boolean {
        if (this.isSpatialReferenceChanged()) {
            return true;
        }
        const map = this.map;
        const renderer = layer._getRenderer();
        if (!renderer) {
            return false;
        }
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
    //@internal
    _drawCanvasLayerOnInteracting(layer: Layer, t: number, timeLimit: number, framestamp: number): number {
        const renderer = layer._getRenderer();
        if (renderer.mustRenderOnInteracting && renderer.mustRenderOnInteracting()) {
            renderer.render(framestamp);
        } else if (renderer.drawOnInteracting) {
            // call drawOnInteracting to redraw the layer
            renderer.prepareRender();
            const canvas = renderer.prepareCanvas();
            if (renderer.checkAndDraw) {
                // for canvas renderers
                renderer.checkAndDraw(renderer.drawOnInteracting, this._eventParam, framestamp);
            } else {
                renderer.drawOnInteracting(this._eventParam, framestamp);
            }
            return canvas;
        }
        return null;
    }

    /**
     * Fire layerload events.
     * Make sure layer are drawn on map when firing the events
     * @private
     */
    //@internal
    _fireLayerLoadEvents(layers: Layer[]) {
        //firing order as FIFO, painting as FILO, so the order needs to be reversed
        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            const renderer = layer._getRenderer();
            if (!renderer || renderer.isRenderComplete && !renderer.isRenderComplete()) {
                continue;
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
            this.createCanvas();
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

    //@internal
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

    //@internal
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

    //@internal
    _lockFrameRenderEnable() {
        const { maxFPS } = this.map.options || {};
        if (maxFPS <= 0 || GlobalConfig.maxFPS <= maxFPS) {
            return true;
        }
        const count = Math.ceil(GlobalConfig.maxFPS / maxFPS);
        return this._frameCycleRenderCount >= count;
    }

    onLoad() {
        this._frameLoop(0);
    }

    /**
    * Main frame loop
    */
    //@internal
    _frameLoop(framestamp: number) {
        if (!this.map) {
            this._cancelFrameLoop();
            return;
        }
        if (!this._bindFrameLoop) {
            this._bindFrameLoop = this._frameLoop.bind(this);
        }
        if (!this.ready) {
            this._animationFrame = requestAnimFrame(this._bindFrameLoop);
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
            console.log('skip framing, frameCycleRenderCount:', this._frameCycleRenderCount);
        }
        // Keep registering ourselves for the next animation frame
        this._animationFrame = requestAnimFrame(this._bindFrameLoop);
    }

    //@internal
    _cancelFrameLoop() {
        delete this._bindFrameLoop;
        if (this._animationFrame) {
            cancelAnimFrame(this._animationFrame);
        }
    }


    //@internal
    _updateCanvasSize() {
        if (!this.canvas || this._containerIsCanvas) {
            return;
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
        if (width !== canvas.width || height !== canvas.height) {
            canvas.width = width;
            canvas.height = height;
        }
        const topLayer = this.topLayer;
        if (topLayer && (width !== topLayer.width || height !== topLayer.height)) {
            topLayer.width = width;
            topLayer.height = height;
            topLayer.style.width = cssWidth;
            topLayer.style.height = cssHeight;
        }
    }

    createCanvas() {
        if (this._containerIsCanvas) {
            this.canvas = this.map.getContainer() as HTMLCanvasElement;
        } else {
            this.canvas = createEl('canvas') as HTMLCanvasElement;
            const panels = this.map.getPanels();
            const canvasContainer = panels.canvasContainer;
            canvasContainer.appendChild(this.canvas);
            this._updateCanvasSize();
        }
        this.createContext().then(() => {
            this.ready = true;
        });
    }

    async createContext() {
        // should be implemented by child class
    }

    clearLayerCanvasContext(_layer) {
        // should be implemented by child class
    }

    clearCanvas() {
        // should be implemented by child class
    }

    // canvas for tops
    createTopCanvas() {
        const topLayer = createEl('canvas') as HTMLCanvasElement;
        this.topLayer = topLayer;
        topLayer.width = this.canvas.width;
        topLayer.height = this.canvas.height;
        topLayer.style.position = 'absolute';
        topLayer.style.top = '0px';
        topLayer.style.left = '0px';
        topLayer.style.width = this.canvas.style.width;
        topLayer.style.height = this.canvas.style.height;
        const panels = this.map.getPanels();
        const canvasContainer = panels.canvasContainer;
        canvasContainer.insertBefore(topLayer, this.canvas);
        this.topCtx = topLayer.getContext('2d');
    }

    removeTopCanvas() {
        removeDomNode(this.topLayer);
        delete this.topLayer;
        delete this.topCtx;
    }

    //@internal
    _updateDomPosition(framestamp: number) {
        if (this._checkPositionTime === undefined) {
            this._checkPositionTime = 0;
        }
        const dTime = Math.abs(framestamp - this._checkPositionTime);
        if (dTime >= 500) {
            // refresh map's dom position
            computeDomPosition(this.map.getContainer());
            this._checkPositionTime = framestamp;
        }
        return this;
    }

    //@internal
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

    //@internal
    _checkSize() {
        if (!this.map) {
            return;
        }
        this.map.checkSize();
    }

    //@internal
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

    //@internal
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

    //@internal
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

    //@internal
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
            const zIndex1 = (top1.options || {}).zIndex || 0;
            const zIndex2 = (top2.options || {}).zIndex || 0;
            return zIndex2 - zIndex1;
        });
    }

    drawTops() {
        const tops = this.getTopElements();
        if (tops.length) {
            if (!this.topCtx) {
                this.createTopCanvas();
            }
        } else {
            if (this.topCtx) {
                this.removeTopCanvas();
            }
            return;
        }
        this.drawTopElements();
    }

    drawTopElements() {
        const tops = this.getTopElements();
        // clear topLayer
        this.topCtx.clearRect(0, 0, this.topLayer.width, this.topLayer.height);
        const collisionIndex = tempCollisionIndex;
        collisionIndex.clear();
        this.map.fire('drawtopstart');
        this.map.fire('drawtops');

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
        if (updated && this.context && this.context.drawImage) {
            this.context.drawImage(this.topLayer, 0, 0);
        }
        this.map.fire('drawtopsend');
    }

    isWebGL() {
        return false;
    }

    isWebGPU() {
        return false;
    }
}

export type MapView = {
    x: number;
    y: number;
    zoom: number;
    pitch: number;
    bearing: number;
    width: number;
    height: number;
}

export default MapAbstractRenderer;


