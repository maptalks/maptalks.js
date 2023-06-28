import { getExternalResources } from '../../../core/util/resource';
import VectorLayer from '../../../layer/VectorLayer';
import OverlayLayerCanvasRenderer from './OverlayLayerCanvasRenderer';
import PointExtent from '../../../geo/PointExtent';
import * as vec3 from '../../../core/util/vec3';
import { now } from '../../../core/util/common';
import { getPointsResultPts } from '../../../core/util';
import CollisionIndex from '../../../core/CollisionIndex';
const TEMP_EXTENT = new PointExtent();
const TEMP_VEC3 = [];
const TEMP_FIXEDEXTENT = new PointExtent();
const PLACEMENT_CENTER = 'center';
const collisionIndex = new CollisionIndex();


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

    _geoIsCollision(geo) {
        if (!geo) {
            return false;
        }
        const collision = geo.options.collision;
        if (!collision) {
            return false;
        }
        const type = geo.getType();
        if (type === 'Point' && geo.getContainerExtent) {
            if (!geo.bbox) {
                geo.bbox = [0, 0, 0, 0];
            }
            const bufferSize = this.layer.options['collisionBufferSize'];
            const extent = geo.getContainerExtent();
            if (!extent) {
                return false;
            }
            geo.bbox[0] = extent.xmin - bufferSize;
            geo.bbox[1] = extent.ymin - bufferSize;
            geo.bbox[2] = extent.xmax + bufferSize;
            geo.bbox[3] = extent.ymax + bufferSize;
            if (collisionIndex.collides(geo.bbox)) {
                return true;
            }
            collisionIndex.insertBox(geo.bbox);
        }
        return false;
    }

    getImageData() {
        //如果不开启geometry event 或者 渲染频率很高 不要取缓存了，因为getImageData是个很昂贵的操作
        if (!this.layer.options['geometryEvents'] || (!this._lastRenderTime) || (now() - this._lastRenderTime) < 32) {
            return null;
        }
        if (!this.context || !this.context.canvas) {
            return null;
        }
        if (!this._imageData) {
            const { width, height } = this.context.canvas;
            try {
                this._imageData = this.context.getImageData(0, 0, width, height);
            } catch (error) {
                console.warn('hit detect failed with tainted canvas, some geometries have external resources in another domain:\n', error);
            }
        }
        return this._imageData;
    }

    clearImageData() {
        //每次渲染完成清除缓存的imageData
        this._imageData = null;
        delete this._imageData;
        this._lastRenderTime = now();
    }

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
            this._batchConversionMarkers(this.mapStateCache.glRes);
            if (!this._onlyHasPoint) {
                this.forEachGeo(this.checkGeo, this);
            }
            this._drawnRes = res;
        }
        this._sortByDistanceToCamera(map.cameraPosition);
        const { collision, collisionDelay } = this.layer.options;
        if (collision) {
            const time = now();
            if (!this._lastCollisionTime) {
                this._lastCollisionTime = time;
            }
            if (time - this._lastCollisionTime <= collisionDelay) {
                this._geosToDraw = this._lastGeosToDraw || this._geosToDraw;
            } else {
                this._collidesGeos();
                this._lastCollisionTime = time;
            }
        }

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
            // https://richardartoul.github.io/jekyll/update/2015/04/26/hidden-classes.html
            // https://juejin.cn/post/6972702293636415519
            this._geosToDraw[i]._cPoint = undefined;
            this._geosToDraw[i]._inCurrentView = undefined;
        }
        this.clearImageData();
        this._lastGeosToDraw = this._geosToDraw;
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
        this._batchConversionMarkers(this.mapStateCache.glRes);
        if (!this._onlyHasPoint) {
            this.forEachGeo(this.checkGeo, this);
        }
        this._sortByDistanceToCamera(this.getMap().cameraPosition);
        this._collidesGeos();
        for (let i = 0, len = this._geosToDraw.length; i < len; i++) {
            this._geosToDraw[i]._paint();
            this._geosToDraw[i]._cPoint = undefined;
            this._geosToDraw[i]._inCurrentView = undefined;
        }
        this.clearImageData();
        this._lastGeosToDraw = this._geosToDraw;
        this._setDrawGeosDrawTime();
    }

    prepareToDraw() {
        this.layer._drawTime = now();
        this._hasPoint = false;
        this._geosToDraw = [];
        return this;
    }

    _setDrawGeosDrawTime() {
        const drawTime = this.layer._drawTime;
        for (let i = 0, len = this._geosToDraw.length; i < len; i++) {
            const geo = this._geosToDraw[i];
            const painter = geo._painter;
            if (painter && painter._setDrawTime) {
                painter._setDrawTime(drawTime);
            }
        }
        return this;
    }

    checkGeo(geo) {
        //点的话已经在批量处理里判断过了
        if (geo.type === 'Point' && this._onlyHasPoint !== undefined) {
            if (geo._inCurrentView) {
                this._hasPoint = true;
                geo._isCheck = true;
                this._geosToDraw.push(geo);
            }
            return;
        }
        // LineString ,Polygon,Circle etc
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

    _collidesGeos() {
        const collision = this.layer.options['collision'];
        if (!collision) {
            return this;
        }
        collisionIndex.clear();
        const geos = this._geosToDraw;
        this._geosToDraw = [];
        for (let i = 0, len = geos.length; i < len; i++) {
            if (this._geoIsCollision(geos[i])) {
                continue;
            }
            this._geosToDraw.push(geos[i]);
        }
        return this;
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
        const glRes = map.getGLRes();
        const containerExtent = map.getContainerExtent();
        const _2DExtent = map._get2DExtent();
        const glExtent = map._get2DExtentAtRes(glRes);
        this.mapStateCache = {
            resolution,
            pitch,
            bearing,
            glScale,
            glRes,
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
    _batchConversionMarkers(glRes) {
        this._onlyHasPoint = undefined;
        if (!this._constructorIsThis()) {
            return [];
        }
        const cPoints = [];
        const markers = [];
        const altitudes = [];
        const altitudeCache = {};
        const layer = this.layer;
        const layerOpts = layer.options;
        const layerAltitude = layer.getAltitude ? layer.getAltitude() : 0;
        const isCanvasRender = layer.isCanvasRender();
        this._onlyHasPoint = true;
        //Traverse all Geo
        let idx = 0;
        for (let i = 0, len = this.layer._geoList.length; i < len; i++) {
            const geo = this.layer._geoList[i];
            const type = geo.getType();
            if (type === 'Point') {
                let painter = geo._painter;
                if (!painter) {
                    painter = geo._getPainter();
                }
                const point = painter.getRenderPoints(PLACEMENT_CENTER)[0][0];
                const altitude = layerOpts['enableAltitude'] ? geo._getAltitude() : layerAltitude;
                //减少方法的调用
                if (altitudeCache[altitude] === undefined) {
                    altitudeCache[altitude] = painter.getAltitude();
                }
                cPoints[idx] = point;
                altitudes[idx] = altitudeCache[altitude];
                markers[idx] = geo;
                idx++;
            } else {
                this._onlyHasPoint = false;
            }
        }
        if (idx === 0) {
            return [];
        }
        const map = this.getMap();
        let pts = getPointsResultPts(cPoints, '_pt');
        pts = map._pointsAtResToContainerPoints(cPoints, glRes, altitudes, pts);
        const containerExtent = map.getContainerExtent();
        const { xmax, ymax, xmin, ymin } = containerExtent;
        const extentCache = {};
        for (let i = 0, len = markers.length; i < len; i++) {
            const geo = markers[i];
            geo._cPoint = pts[i];
            if (!geo._cPoint) {
                geo._inCurrentView = false;
                continue;
            }
            const { x, y } = pts[i];
            //Is the point in view
            geo._inCurrentView = (x >= xmin && y >= ymin && x <= xmax && y <= ymax);
            //不在视野内的，再用fixedExtent 精确判断下
            if (!geo._inCurrentView) {
                const symbolkey = geo.getSymbolHash();
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
            if (geo._inCurrentView) {
                if (!geo.isVisible() || !isCanvasRender) {
                    geo._inCurrentView = false;
                }
                //如果当前图层上只有点，整个checkGeo都不用执行了,这里已经把所有的点都判断了
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

    _constructorIsThis() {
        return this.constructor === VectorLayerRenderer;
    }
}

VectorLayer.registerRenderer('canvas', VectorLayerRenderer);

export default VectorLayerRenderer;
