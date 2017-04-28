import { isNode, isNumber, isFunction, requestAnimFrame, cancelAnimFrame } from 'core/util';
import { createEl, preventSelection, copyCanvas } from 'core/util/dom';
import Browser from 'core/Browser';
import Point from 'geo/Point';
import Canvas2D from 'core/Canvas';
import OverlayLayer from 'layer/OverlayLayer';
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
        super();
        this.map = map;
        //container is a <canvas> element
        this._containerIsCanvas = !!map._containerDOM.getContext;
        this._registerEvents();
    }

    isCanvasRender() {
        return true;
    }

    /**
     * Renders the layers
     */
    render() {
        if (!this.map) {
            return;
        }
        /**
         * renderstart event, an event fired when map starts to render.
         * @event Map#renderstart
         * @type {Object}
         * @property {String} type                    - renderstart
         * @property {Map} target            - the map fires event
         * @property {CanvasRenderingContext2D} context  - canvas context
         */
        this.map._fireEvent('renderstart', {
            'context': this.context
        });
        if (!this.canvas) {
            this.createCanvas();
        }
        const layers = this._getAllLayerToRender();

        if (!this._updateCanvasSize()) {
            this.clearCanvas();
        }

        this._drawBackground();

        for (let i = 0, len = layers.length; i < len; i++) {
            if (!layers[i].isVisible() || !layers[i].isCanvasRender()) {
                continue;
            }
            const renderer = layers[i]._getRenderer();
            if (renderer) {
                const layerImage = this._getLayerImage(layers[i]);
                if (layerImage && layerImage['image']) {
                    this._drawLayerCanvasImage(layers[i], layerImage);
                }
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
        if (this._resizeFrame) {
            cancelAnimFrame(this._resizeFrame);
        }
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
        let hit = false, cursor;
        const limit = map.options['hitDetectLimit'] || 0;
        let counter = 0;
        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            const renderer = layer._getRenderer();
            if (layer.isEmpty && layer.isEmpty()) {
                continue;
            }
            if (renderer.isBlank && renderer.isBlank()) {
                continue;
            }
            if (renderer && renderer.hitDetect) {
                if (layer.options['cursor'] !== 'default' && renderer.hitDetect(point)) {
                    cursor = layer.options['cursor'] || 'pointer';
                    hit = true;
                    break;
                }
                counter++;
                if (limit > 0 && counter > limit) {
                    break;
                }
            }
        }
        if (hit) {
            map._trySetCursor(cursor);
        } else {
            map._trySetCursor('default');
        }
    }

    _getLayerImage(layer) {
        if (layer && layer._getRenderer() && layer._getRenderer().getCanvasImage) {
            return layer._getRenderer().getCanvasImage();
        }
        return null;
    }

    _getCountOfGeosToDraw() {
        const map = this.map;
        const layers = this._getAllLayerToRender();
        let total = 0;
        for (let i = layers.length - 1; i >= 0; i--) {
            const renderer = layers[i]._getRenderer();
            if ((layers[i] instanceof OverlayLayer) &&
                layers[i].isVisible() && !layers[i].isEmpty() && (renderer._hasPointSymbolizer || map.getPitch())) {
                const geos = renderer._geosToDraw;
                if (geos) {
                    total += renderer._geosToDraw.length;
                }
            }
        }
        return total;
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

    _drawLayerCanvasImage(layer, layerImage) {
        if (!layer || !layerImage) {
            return;
        }
        const ctx = this.context;
        const point = layerImage['point'].multi(Browser.retina ? 2 : 1);
        let canvasImage = layerImage['image'];
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

        if (layerImage['transform']) {
            ctx.save();
            ctx.setTransform.apply(ctx, layerImage['transform']);
        }

        if (isNode) {
            const context = canvasImage.getContext('2d');
            if (context.getSvg) {
                //canvas2svg
                canvasImage = context;
            }
        }

        if (layer.options['debugOutline']) {
            this.context.strokeStyle = '#0f0';
            this.context.fillStyle = '#0f0';
            this.context.lineWidth = 10;
            Canvas2D.rectangle(ctx, point, layerImage.size, 1, 0);
            ctx.fillText([layer.getId(), point.toArray().join(), layerImage.size.toArray().join(), canvasImage.width + ',' + canvasImage.height].join(' '),
                point.x + 18, point.y + 18);
        }
        // console.log(layer.getId(), point);

        ctx.drawImage(canvasImage, point.x, point.y);
        if (layerImage['transform']) {
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
        cancelAnimFrame(this._resizeFrame);
        if (!this.map || this.map.isInteracting() || this.map._panAnimating) {
            return;
        }
        this._resizeFrame = requestAnimFrame(
            () => {
                if (!this.map || this.map.isInteracting()) {
                    return;
                }
                this.map.checkSize();
            }
        );
    }

    _checkSizeLoop() {
        if (!this.map || this.map.isRemoved()) {
            //is deleted
            clearInterval(this._resizeInterval);
        } else {
            this._checkSize();
        }
    }

    _setCheckSizeInterval(interval) {
        clearInterval(this._resizeInterval);
        this._checkSizeInterval = interval;
        this._resizeInterval = setInterval(() => {
            this._checkSizeLoop();
        }, this._checkSizeInterval);
    }

    _registerEvents() {
        const map = this.map;
        map.on('_baselayerchangestart _resize _zoomstart', this._clearBackground, this);
        map.on('_baselayerload', () => {
            const baseLayer = map.getBaseLayer();
            if (!map.options['zoomBackground'] || baseLayer.getMask()) {
                this._clearBackground();
            }
        });
        if (map.options['checkSize'] && !isNode && (typeof window !== 'undefined')) {
            this._setCheckSizeInterval(1000);
        }
        if (!Browser.mobile) {
            map.on('_mousemove', this._onMapMouseMove, this);
        }
        map.on('_moving _moveend', () => {
            if (!map.getPitch()) {
                this.render();
            }
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
}

Map.registerRenderer('canvas', MapCanvasRenderer);
