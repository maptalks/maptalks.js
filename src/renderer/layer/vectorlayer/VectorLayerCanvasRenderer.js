import { getExternalResources } from 'core/util/resource';
import VectorLayer from 'layer/VectorLayer';
import CanvasRenderer from '../CanvasRenderer';
import OverlayLayerCanvasRenderer from './OverlayLayerCanvasRenderer';

/**
 * @classdesc
 * Renderer class based on HTML5 Canvas2D for VectorLayers
 * @protected
 * @memberOf renderer
 * @name VectorLayerCanvasRenderer
 * @extends renderer.OverlaylayerCanvasRenderer
 * @param {VectorLayer} layer - layer to render
 */
class VectorLayerRenderer extends OverlayLayerCanvasRenderer {

    checkResources() {
        const resources = super.checkResources.apply(this, arguments);
        var style = this.layer.getStyle();
        if (style) {
            if (!Array.isArray(style)) {
                style = [style];
            }
            style.forEach(s => {
                const res = getExternalResources(s['symbol'], true);
                for (let i = 0, l = res.length; i < l; i++) {
                    if (!this.resources.isResourceLoaded(res[i])) {
                        resources.push(res[i]);
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

        const maskExtent2D = this.prepareCanvas();

        this._drawGeos(maskExtent2D);

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
        CanvasRenderer.prototype.show.apply(this, arguments);
    }

    isUpdateWhenZooming() {
        const map = this.getMap();
        const count = map._getRenderer()._getCountOfGeosToDraw();
        return ((this._hasPointSymbolizer || map.getPitch()) && count > 0 && count <= map.options['pointThresholdOfZoomAnimation']);
    }

    _drawGeos(maskExtent2D) {
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


    onZoomEnd() {
        delete this._extent2D;
        CanvasRenderer.prototype.onZoomEnd.apply(this, arguments);
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

VectorLayer.registerRenderer('canvas', VectorLayerRenderer);

export default VectorLayerRenderer;
