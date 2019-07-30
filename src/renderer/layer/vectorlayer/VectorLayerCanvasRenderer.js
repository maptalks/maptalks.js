import { getExternalResources } from '../../../core/util/resource';
import VectorLayer from '../../../layer/VectorLayer';
import OverlayLayerCanvasRenderer from './OverlayLayerCanvasRenderer';
import PointExtent from '../../../geo/PointExtent';
import Point from '../../../geo/Point';
import Marker from '../../../geometry/Marker';

const TEMP_EXTENT = new PointExtent();

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
        let style = this.layer.getStyle();
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

    needToRedraw() {
        const map = this.getMap();
        if (map.isInteracting() && this.layer.options['enableAltitude']) {
            return true;
        }
        // don't redraw when map is zooming without pitch and layer doesn't have any point symbolizer.
        if (map.isZooming() && !map.isRotating() && !map.getPitch() && !this._hasPoint && this.layer.constructor === VectorLayer) {
            return false;
        }
        return super.needToRedraw();
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

        this.prepareCanvas();

        this.drawGeos();

        this.completeRender();
    }

    isBlank() {
        if (!this.context) {
            return false;
        }
        return !this.context.canvas._drawn;
    }

    drawOnInteracting() {
        if (!this._geosToDraw) {
            return;
        }
        this._updateDisplayExtent();
        this._sortMarkersOnZooming();
        const markers = this._markersOnZooming;
        for (let i = 0, l = this._geosToDraw.length; i < l; i++) {
            const geo = this._geosToDraw[i];
            if (!geo.isVisible()) {
                continue;
            }
            if ((geo instanceof Marker) && markers && !markers[i]) {
                continue;
            }
            geo._paint(this._displayExtent);
        }
    }

    /**
     * Show and render
     * @override
     */
    show() {
        this.layer.forEach(function (geo) {
            geo._repaint();
        });
        super.show.apply(this, arguments);
    }

    forEachGeo(fn, context) {
        this.layer.forEach(fn, context);
    }

    drawGeos() {
        this._updateDisplayExtent();
        this.prepareToDraw();

        this.forEachGeo(this.checkGeo, this);
        for (let i = 0, len = this._geosToDraw.length; i < len; i++) {
            this._geosToDraw[i]._paint();
        }
    }

    prepareToDraw() {
        this._hasPoint = false;
        this._geosToDraw = [];
        this._markersToDraw = [];
        this._markersIdx = [];
    }

    checkGeo(geo) {
        if (!geo || !geo.isVisible() || !geo.getMap() ||
            !geo.getLayer() || (!geo.getLayer().isCanvasRender())) {
            return;
        }

        const painter = geo._getPainter();
        const extent2D = painter.get2DExtent(this.resources, TEMP_EXTENT);
        if (!extent2D || !extent2D.intersects(this._displayExtent)) {
            return;
        }
        if (painter.hasPoint()) {
            this._hasPoint = true;
        }
        this._geosToDraw.push(geo);
        if (geo instanceof Marker) {
            this._markersToDraw.push(this._geosToDraw.length - 1);
        }
    }

    onZoomStart(zoom, origin) {
        const map = this.getMap();
        this._zoomOrigin = origin || new Point(map.width / 2, map.height / 2);
        super.onZoomStart.apply(this, arguments);
    }

    onZoomEnd() {
        delete this.canvasExtent2D;
        delete this._markersOnZooming;
        delete this._zoomOrigin;
        super.onZoomEnd.apply(this, arguments);
    }

    onRemove() {
        this.forEachGeo(function (g) {
            g.onHide();
        });
        delete this._geosToDraw;
    }

    onGeometryPropertiesChange(param) {
        if (param) {
            this.layer._styleGeometry(param['target']);
        }
        super.onGeometryPropertiesChange(param);
    }

    _sortMarkersOnZooming() {
        const map = this.getMap();
        if (!this._isLimitMarkerOnZooming() || this._markersOnZooming) {
            return;
        }

        const center = map.containerPointToCoord(this._zoomOrigin);

        this._markersToDraw.sort((a, b) => {
            const marker0 = this._geosToDraw[a];
            const marker1 = this._geosToDraw[b];
            return distanceTo(marker0.getCoordinates(), center) - distanceTo(marker1.getCoordinates(), center);
        });
        const limit = this.layer.options['markerLimitOnZooming'];
        const sortedMarkers = this._markersOnZooming = {};
        for (let i = 0; i < limit; i++) {
            sortedMarkers[this._markersToDraw[i]] = 1;
        }
    }

    _isLimitMarkerOnZooming() {
        const map = this.getMap();
        const limit = this.layer.options['markerLimitOnZooming'];
        return map.isZooming() && this._zoomOrigin && limit > 0 && limit < this._markersToDraw.length;
    }

    _updateDisplayExtent() {
        let extent2D = this.canvasExtent2D;
        if (this._maskExtent) {
            if (!this._maskExtent.intersects(extent2D)) {
                this.completeRender();
                return;
            }
            extent2D = extent2D.intersection(this._maskExtent);
        }
        this._displayExtent = extent2D;
    }

    identify(coordinate, options = {}) {
        const geometries = this._geosToDraw;
        if (!geometries) {
            return [];
        }
        return this.layer._hitGeos(geometries, coordinate, options);
    }
}

VectorLayer.registerRenderer('canvas', VectorLayerRenderer);

export default VectorLayerRenderer;

function distanceTo(a, b) {
    const x = a.x - b.x,
        y = a.y - b.y;
    return Math.sqrt(x * x + y * y);
}
