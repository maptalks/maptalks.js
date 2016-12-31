import { isArray } from 'core/util';
import { getExternalResources } from 'core/util/resource';
// import VectorLayer from 'layer/VectorLayer';
import CanvasRenderer from '../CanvasRenderer';
import OverlayLayerRenderer from './OverlayLayerRenderer';

/**
 * @classdesc
 * Renderer class based on HTML5 Canvas2D for VectorLayers
 * @class
 * @protected
 * @memberOf renderer.vectorlayer
 * @name Canvas
 * @extends {renderer.overlaylayer.Canvas}
 * @param {VectorLayer} layer - layer of the renderer
 */
export default class VectorLayerRenderer extends OverlayLayerRenderer {

    constructor(layer) {
        super();
        this.layer = layer;
    }

    checkResources() {
        var me = this;
        var resources = OverlayLayerRenderer.prototype.checkResources.apply(this, arguments);
        var style = this.layer.getStyle();
        if (style) {
            if (!isArray(style)) {
                style = [style];
            }
            style.forEach(function (s) {
                var res = getExternalResources(s['symbol'], true);
                if (res) {
                    for (var ii = 0; ii < res.length; ii++) {
                        if (!me.resources.isResourceLoaded(res[ii])) {
                            resources.push(res[ii]);
                        }
                    }
                }
            });
        }
        return resources;
    }

    /**
     * render layer
     * @param  {Geometry[]} geometries   geometries to render
     * @param  {Boolean} ignorePromise   whether escape step of promise
     */
    draw() {
        if (!this.getMap()) {
            return;
        }
        if (!this.layer.isVisible() || this.layer.isEmpty()) {
            this.clearCanvas();
            this.completeRender();
            return;
        }

        this._drawGeos();

        this.completeRender();
    }

    drawOnZooming() {
        for (var i = 0, len = this._geosToDraw.length; i < len; i++) {
            this._geosToDraw[i]._paint();
        }
    }

    isBlank() {
        return this._isBlank;
    }

    /**
     * Show and render
     * @override
     */
    show() {
        this.layer.forEach(function (geo) {
            geo._repaint();
        });
        OverlayLayerRenderer.prototype.show.apply(this, arguments);
    }

    isUpdateWhenZooming() {
        var map = this.getMap();
        var count = map._getRenderer()._getCountOfGeosToDraw();
        return (this._hasPointSymbolizer && count > 0 && count <= map.options['pointThresholdOfZoomAnimation']);
    }

    _drawGeos() {
        var map = this.getMap();
        if (!map) {
            return;
        }
        var layer = this.layer;
        if (layer.isEmpty()) {
            this.fireLoadedEvent();
            return;
        }
        if (!layer.isVisible()) {
            this.fireLoadedEvent();
            return;
        }

        var maskExtent2D = this.prepareCanvas();
        var extent2D = this._extent2D;
        if (maskExtent2D) {
            if (!maskExtent2D.intersects(extent2D)) {
                this.fireLoadedEvent();
                return;
            }
            extent2D = extent2D.intersection(maskExtent2D);
        }
        this._prepareToDraw();
        this._displayExtent = extent2D;
        this._forEachGeo(this._checkGeo, this);
        for (var i = 0, len = this._geosToDraw.length; i < len; i++) {
            this._geosToDraw[i]._paint();
        }
    }

    _prepareToDraw() {
        this._isBlank = true;
        this._hasPointSymbolizer = false;
        this._geosToDraw = [];
    }

    _checkGeo(geo) {
        if (!geo || !geo.isVisible() || !geo.getMap() ||
            !geo.getLayer() || (!geo.getLayer().isCanvasRender())) {
            return;
        }
        var painter = geo._getPainter(),
            extent2D = painter.get2DExtent(this.resources);
        if (!extent2D || !extent2D.intersects(this._displayExtent)) {
            return;
        }
        this._isBlank = false;
        if (painter.hasPointSymbolizer()) {
            this._hasPointSymbolizer = true;
        }
        this._geosToDraw.push(geo);
    }

    _forEachGeo(fn, context) {
        this.layer.forEach(fn, context);
    }

    onZooming() {
        var map = this.getMap();
        if (this.layer.isVisible() && (map._pitch || this.isUpdateWhenZooming())) {
            this._geosToDraw.forEach(function (geo) {
                geo._removeZoomCache();
            });
        }
        OverlayLayerRenderer.prototype.onZooming.apply(this, arguments);
    }

    onZoomEnd() {
        delete this._extent2D;
        if (this.layer.isVisible()) {
            this.layer.forEach(function (geo) {
                geo._removeZoomCache();
            });
        }
        OverlayLayerRenderer.prototype.onZoomEnd.apply(this, arguments);
    }

    onRemove() {
        this._forEachGeo(function (g) {
            g.onHide();
        });
        delete this._geosToDraw;
    }

    onGeometryPropertiesChange(param) {
        if (param) {
            this.layer._styleGeometry(param['target']);
        }
    }
}

// VectorLayer.registerRenderer('canvas', VectorLayerRenderer);
