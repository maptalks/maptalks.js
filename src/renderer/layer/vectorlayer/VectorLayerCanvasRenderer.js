import { getExternalResources } from '../../../core/util/resource';
import VectorLayer from '../../../layer/VectorLayer';
import OverlayLayerCanvasRenderer from './OverlayLayerCanvasRenderer';
import PointExtent from '../../../geo/PointExtent';
import * as vec3 from '../../../core/util/vec3';

const TEMP_EXTENT = new PointExtent();
const TEMP_VEC3 = [];
const TEMP_FIXEDEXTENT = new PointExtent();
const PLACEMENT_CENTER = 'center';

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
        this._updateMapStateCache();
        this._updateDisplayExtent();
        const map = this.getMap();
        //refresh geometries on zooming
        const count = this.layer.getCount();
        const res = this.mapStateCache.resolution;
        if (map.isZooming() &&
            map.options['seamlessZoom'] && this._drawnRes !== undefined && res > this._drawnRes * 1.5 &&
            this._geosToDraw.length < count || map.isMoving() || map.isInteracting()) {
            this.prepareToDraw();
            this._batchConversionMarkers(this.mapStateCache.glZoom);
            this.forEachGeo(this.checkGeo, this);
            this._drawnRes = res;
        }
        this._sortByDistanceToCamera(map.cameraPosition);
        for (let i = 0, l = this._geosToDraw.length; i < l; i++) {
            const geo = this._geosToDraw[i];
            if (!geo._isCheck) {
                if (!geo.isVisible()) {
                    delete geo._cPoint;
                    delete geo._inCurrentView;
                    continue;
                }
            }
            geo._paint(this._displayExtent);
            delete this._geosToDraw[i]._cPoint;
            delete this._geosToDraw[i]._inCurrentView;
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
        this._updateMapStateCache();
        this._drawnRes = this.mapStateCache.resolution;
        this._updateDisplayExtent();
        this.prepareToDraw();
        this._batchConversionMarkers(this.mapStateCache.glZoom);
        this.forEachGeo(this.checkGeo, this);
        this._sortByDistanceToCamera(this.getMap().cameraPosition);
        for (let i = 0, len = this._geosToDraw.length; i < len; i++) {
            this._geosToDraw[i]._paint();
            delete this._geosToDraw[i]._cPoint;
            delete this._geosToDraw[i]._inCurrentView;
        }
    }

    prepareToDraw() {
        this._hasPoint = false;
        this._geosToDraw = [];
    }

    checkGeo(geo) {
        geo._isCheck = false;
        if (!geo || !geo.isVisible() || !geo.getMap() ||
            !geo.getLayer() || (!geo.getLayer().isCanvasRender())) {
            return;
        }

        const painter = geo._getPainter();
        let inCurrentView = true;
        if (geo._inCurrentView) {
            inCurrentView = true;
        } else if (geo._inCurrentView === false) {
            inCurrentView = false;
        } else {
            const extent2D = painter.get2DExtent(this.resources, TEMP_EXTENT);
            if (!extent2D || !extent2D.intersects(this._displayExtent)) {
                inCurrentView = false;
            }
        }
        if (!inCurrentView) {
            return;
        }
        if (painter.hasPoint()) {
            this._hasPoint = true;
        }
        geo._isCheck = true;
        this._geosToDraw.push(geo);
    }

    onZoomEnd() {
        delete this.canvasExtent2D;
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

    identifyAtPoint(point, options = {}) {
        const geometries = this._geosToDraw;
        if (!geometries) {
            return [];
        }
        return this.layer._hitGeos(geometries, point, options);
    }

    _updateMapStateCache() {
        const map = this.getMap();
        const offset = map._pointToContainerPoint(this.southWest)._add(0, -map.height);
        const resolution = map.getResolution();
        const pitch = map.getPitch();
        const bearing = map.getBearing();
        const glScale = map.getGLScale();
        const glZoom = map.getGLZoom();
        const containerExtent = map.getContainerExtent();
        const _2DExtent = map._get2DExtent();
        const glExtent = map._get2DExtent(glZoom);
        this.mapStateCache = {
            resolution,
            pitch,
            bearing,
            glScale,
            glZoom,
            _2DExtent,
            glExtent,
            containerExtent,
            offset
        };
        return this;
    }

    // Better performance of batch coordinate conversion
    // 优化前 11fps
    // 优化后 15fps
    _batchConversionMarkers(glZoom) {
        const cPoints = [];
        const markers = [];
        const altitudes = [];
        const altitudeCache = {};
        //Traverse all Geo
        let idx = 0;
        for (let i = 0, len = this.layer._geoList.length; i < len; i++) {
            const geo = this.layer._geoList[i];
            const type = geo.getType();
            if (type === 'Point') {
                const painter = geo._painter;
                if (!painter) {
                    continue;
                }
                const point = painter.getRenderPoints(PLACEMENT_CENTER)[0][0];
                const altitude = geo.getAltitude();
                //减少方法的调用
                if (altitudeCache[altitude] === undefined) {
                    altitudeCache[altitude] = painter.getAltitude();
                }
                cPoints[idx] = point;
                altitudes[idx] = altitudeCache[altitude];
                markers[idx] = geo;
                idx++;
            }
        }
        if (idx === 0) {
            return [];
        }
        const map = this.getMap();
        const pts = map._pointsToContainerPoints(cPoints, glZoom, altitudes);
        const containerExtent = map.getContainerExtent();
        const { xmax, ymax, xmin, ymin } = containerExtent;
        const extentCache = {};
        for (let i = 0, len = markers.length; i < len; i++) {
            const geo = markers[i];
            geo._cPoint = pts[i];
            const { x, y } = pts[i];
            //Is the point in view
            geo._inCurrentView = (x >= xmin && y >= ymin && x <= xmax && y <= ymax);
            //不在视野内的，再用fixedExtent 精确判断下
            if (!geo._inCurrentView) {
                const symbolkey = geo._symbolHash;
                let fixedExtent;
                if (symbolkey) {
                    //相同的symbol 不要重复计算
                    fixedExtent = extentCache[symbolkey] = (extentCache[symbolkey] || geo._painter.getFixedExtent());
                } else {
                    fixedExtent = geo._painter.getFixedExtent();
                }
                TEMP_FIXEDEXTENT.set(fixedExtent.xmin, fixedExtent.ymin, fixedExtent.xmax, fixedExtent.ymax);
                TEMP_FIXEDEXTENT._add(pts[i]);
                geo._inCurrentView = TEMP_FIXEDEXTENT.intersects(containerExtent);
            }
        }
        return pts;
    }

    _sortByDistanceToCamera(cameraPosition) {
        if (!this.layer.options['sortByDistanceToCamera']) {
            return;
        }
        if (!this._geosToDraw.length) {
            return;
        }
        const map = this.getMap();
        const p = map.distanceToPoint(1000, 0, map.getGLScale()).x;
        const meterScale = p / 1000;
        const placement = 'center';
        this._geosToDraw.sort((a, b) => {
            const type0 = a.getType();
            const type1 = b.getType();
            if (type0 !== 'Point' || type1 !== 'Point') {
                return 0;
            }
            const painter0 = a._painter;
            const painter1 = b._painter;
            if (!painter0 || !painter1) {
                return 0;
            }
            const point0 = painter0.getRenderPoints(placement)[0][0];
            const point1 = painter1.getRenderPoints(placement)[0][0];
            const alt0 = painter0.getAltitude() * meterScale;
            const alt1 = painter1.getAltitude() * meterScale;
            vec3.set(TEMP_VEC3, point0.x, point0.y, alt0);
            const dist0 = vec3.distance(TEMP_VEC3, cameraPosition);
            vec3.set(TEMP_VEC3, point1.x, point1.y, alt1);
            const dist1 = vec3.distance(TEMP_VEC3, cameraPosition);
            return dist1 - dist0;
        });
    }
}

VectorLayer.registerRenderer('canvas', VectorLayerRenderer);

export default VectorLayerRenderer;
