import { getExternalResources } from '../../../core/util/resource';
import VectorLayer from '../../../layer/VectorLayer';
import OverlayLayerCanvasRenderer from './OverlayLayerCanvasRenderer';
import PointExtent from '../../../geo/PointExtent';
import * as vec3 from '../../../core/util/vec3';

const TEMP_EXTENT = new PointExtent();
const TEMP_VEC3 = [];
const TEMP_FIXEDEXTENT = new PointExtent();
const PLACEMENT_CENTER = 'center';
const TEMP_POINTS = [];
const TEMP_ALTITUDES = [];
const TEMP_GEOS = [];
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
            if (!this._onlyHasPoint) {
                this.forEachGeo(this.checkGeo, this);
            }
            this._drawnRes = res;
        }
        this._sortByDistanceToCamera(map.cameraPosition);
        for (let i = 0, l = this._geosToDraw.length; i < l; i++) {
            const geo = this._geosToDraw[i];
            if (!geo._isCheck) {
                if (!geo.isVisible()) {
                    geo._cPoint = undefined;
                    geo._inCurrentView = undefined;
                    continue;
                }
            }
            if (geo._dirtyCoords) {
                geo._paint(this._displayExtent);
            } else if (geo._painter) {
                geo._painter.paint(this._displayExtent);
            }
            geo._cPoint = undefined;
            geo._inCurrentView = undefined;
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
        if (!this._onlyHasPoint) {
            this.forEachGeo(this.checkGeo, this);
        }
        this._sortByDistanceToCamera(this.getMap().cameraPosition);
        for (let i = 0, len = this._geosToDraw.length; i < len; i++) {
            const geo = this._geosToDraw[i];
            if (geo._dirtyCoords) {
                geo._painter.paint();
            } else if (geo._painter) {
                geo._painter.paint();
            }
            geo._cPoint = undefined;
            geo._inCurrentView = undefined;
        }
    }

    prepareToDraw() {
        this._hasPoint = false;
        this._geosToDraw = [];
    }

    checkGeo(geo) {
        geo._isCheck = false;
        if (geo.type === 'Point') {
            if (geo._inCurrentView) {
                if (geo._painter.hasPoint()) {
                    this._hasPoint = true;
                }
                geo._isCheck = true;
                this._geosToDraw.push(geo);
            }
            return;
        }
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

    identify(coordinate, options = {}) {
        const geometries = this._geosToDraw;
        if (!geometries) {
            return [];
        }
        return this.layer._hitGeos(geometries, coordinate, options);
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
        //减少临时变量的使用
        TEMP_ALTITUDES.length = TEMP_GEOS.length = TEMP_POINTS.length = 0;
        //全局变量本域化,减少全局变量的查找
        const ALTITUDES = TEMP_ALTITUDES, GEOS = TEMP_GEOS, POINTS = TEMP_POINTS;
        const altitudeCache = {};
        const layer = this.layer;
        const layerOpts = layer.options;
        const layerAltitude = layer.getAltitude ? layer.getAltitude() : 0;
        //是否只有点要素
        this._onlyHasPoint = true;
        //Traverse all Geo
        let idx = 0;
        for (let i = 0, len = this.layer._geoList.length; i < len; i++) {
            const geo = this.layer._geoList[i];
            const type = geo.type;
            if (type === 'Point') {
                if (!geo._painter) {
                    geo._getPainter();
                }
                const painter = geo._painter;
                if (!painter) {
                    continue;
                }
                // reduce getRenderPoints function call
                //减少方法的调用
                let point;
                if (painter._renderPoints && painter._renderPoints[PLACEMENT_CENTER]) {
                    point = painter._renderPoints[PLACEMENT_CENTER][0][0];
                } else {
                    point = painter.getRenderPoints(PLACEMENT_CENTER)[0][0];
                }
                let altitude;
                if (layerOpts['enableAltitude']) {
                    altitude = geo.getAltitude();
                } else {
                    // reduce getAltitude function call
                    altitude = layerAltitude;
                }
                if (altitudeCache[altitude] == null) {
                    altitudeCache[altitude] = painter.getAltitude();
                }
                POINTS[idx] = point;
                ALTITUDES[idx] = altitudeCache[altitude];
                GEOS[idx] = geo;
                idx++;
            } else {
                this._onlyHasPoint = false;
            }
        }
        if (idx === 0) {
            return [];
        }
        const isCanvasRender = layer.isCanvasRender();
        const map = this.getMap();
        const pts = map._pointsToContainerPoints(TEMP_POINTS, glZoom, TEMP_ALTITUDES);
        const containerExtent = map.getContainerExtent();
        const { xmax, ymax, xmin, ymin } = containerExtent;
        const symbolkeyMap = {};
        for (let i = 0, len = TEMP_GEOS.length; i < len; i++) {
            const geo = TEMP_GEOS[i];
            geo._cPoint = pts[i];
            const { x, y } = pts[i];
            //Is the point in view
            geo._inCurrentView = (x >= xmin && y >= ymin && x <= xmax && y <= ymax);
            //不在视野内的，再用fixedExtent 精确判断下
            if (!geo._inCurrentView) {
                const symbolkey = geo.__symbol;
                let fixedExtent;
                if (symbolkey) {
                    //相同的symbol 不要重复计算
                    fixedExtent = symbolkeyMap[symbolkey] = (symbolkeyMap[symbolkey] || geo._painter.getFixedExtent());
                } else {
                    fixedExtent = geo._painter.getFixedExtent();
                }
                TEMP_FIXEDEXTENT.set(fixedExtent.xmin, fixedExtent.ymin, fixedExtent.xmax, fixedExtent.ymax);
                TEMP_FIXEDEXTENT._add(pts[i]);
                geo._inCurrentView = TEMP_FIXEDEXTENT.intersects(containerExtent);
            }
            //如果是点直接处理了，不用去checkGeo
            if (geo._inCurrentView) {
                if (!geo.isVisible() || !isCanvasRender) {
                    geo._inCurrentView = false;
                }
                //如果当前图层上只有点，直接将点加入_geosToDraw,整个checkGeo都不用执行了
                if (this._onlyHasPoint && geo._inCurrentView) {
                    this._hasPoint = true;
                    geo._isCheck = true;
                    this._geosToDraw.push(geo);
                }
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
