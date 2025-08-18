import {  isNumber, isFunction, calCanvasSize, pushIn } from '../../core/util';
import { createEl } from '../../core/util/dom';
import Point from '../../geo/Point';
import Canvas2D from '../../core/Canvas';
import Map from '../../map/Map';
import type { Layer } from '../../layer';
import MapAbstractRenderer from './MapAbstractRenderer';

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
class MapCanvasRenderer extends MapAbstractRenderer {


    //@internal
    _needClear: boolean;
    //@internal
    _canvasUpdated: boolean;
    context: CanvasRenderingContext2D;



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

    //need redraw all layer,cause by collision/crs change/view change etc...
    //@internal
    _needRedrawAllLayers(layers: Layer[]) {
        if (this.isSpatialReferenceChanged()) {
            return true;
        }
        const needRedrawLayers: Layer[] = [];
        layers.forEach(layer => {
            if (!layer) {
                return;
            }
            //always check layer need to redraw
            const needsRedraw = layer._toRedraw = this._checkLayerRedraw(layer);
            if (needsRedraw) {
                needRedrawLayers.push(layer);
                const childLayers = layer.getLayers && layer.getLayers();
                if (childLayers && Array.isArray(childLayers)) {
                    pushIn(needRedrawLayers, childLayers);
                }
            }
        });
        for (let i = 0, len = needRedrawLayers.length; i < len; i++) {
            const layer = needRedrawLayers[i];
            const layerOptions = layer && layer.options;
            if (layerOptions && layerOptions.collision && layerOptions.collisionScope === 'map') {
                return true;
            }
            //other condition if need
        }
        return false;
    }

    drawLayers(layers: Layer[], framestamp: number) {
        const needRedrawAllLayers = this._needRedrawAllLayers(layers);

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
            const needsRedraw = needRedrawAllLayers || layer._toRedraw;
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
        return true;
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
            renderer.onSkipDrawOnInteracting(this._eventParam, framestamp);
        }
        return 0;
    }

    /**
     * Fire layerload events.
     * Make sure layer are drawn on map when firing the events
     * @private
     */
    //@internal
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


    remove() {

        delete this.context;
        super.remove();
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

    //@internal
    _getLayerImage(layer: Layer) {
        const renderer = layer._getRenderer();
        if (renderer.getCanvasImage) {
            return renderer.getCanvasImage();
        }
        return null;
    }


    //@internal
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

    //@internal
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

    //@internal
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

    //@internal
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

    //@internal
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

    clearCanvas() {
        if (!this.canvas) {
            return;
        }
        Canvas2D.clearRect(this.context, 0, 0, this.canvas.width, this.canvas.height);
    }

    //@internal
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
        this.ready = true;
    }


    drawTops() {
        super.drawTopElements();
    }

    isWebGPU() {
        return false;
    }
}

Map.registerRenderer<typeof MapCanvasRenderer>('canvas', MapCanvasRenderer);

Map.mergeOptions({
    'fog': false,
    'fogColor': [233, 233, 233]
});

export default MapCanvasRenderer;
