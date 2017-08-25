import { isNumber, mapArrayRecursively, sign, pushIn, hasOwn } from 'core/util';
import { clipPolygon, clipLine } from 'core/util/path';
import Class from 'core/Class';
import Size from 'geo/Size';
import Point from 'geo/Point';
import PointExtent from 'geo/PointExtent';
import Canvas from 'core/Canvas';
import * as Symbolizers from 'renderer/geometry/symbolizers';

//注册的symbolizer
const registerSymbolizers = [
    Symbolizers.StrokeAndFillSymbolizer,
    Symbolizers.ImageMarkerSymbolizer,
    Symbolizers.VectorPathMarkerSymbolizer,
    Symbolizers.VectorMarkerSymbolizer,
    Symbolizers.TextMarkerSymbolizer
];


/**
 * @classdesc
 * Painter class for all geometry types except the collection types.
 * @class
 * @protected
 * @param {Geometry} geometry - geometry to paint
 */
export default class Painter extends Class {

    constructor(geometry) {
        super();
        this.geometry = geometry;
        this.symbolizers = this._createSymbolizers();
        this.height = this._getGeometryHeight();
    }

    getMap() {
        return this.geometry.getMap();
    }

    getLayer() {
        return this.geometry.getLayer();
    }

    /**
     * create symbolizers
     * @return {*} [description]
     */
    _createSymbolizers() {
        const geoSymbol = this.getSymbol(),
            symbolizers = [],
            regSymbolizers = registerSymbolizers;
        let symbols = geoSymbol;
        if (!Array.isArray(geoSymbol)) {
            symbols = [geoSymbol];
        }
        for (let ii = symbols.length - 1; ii >= 0; ii--) {
            const symbol = symbols[ii];
            for (let i = regSymbolizers.length - 1; i >= 0; i--) {
                if (regSymbolizers[i].test(symbol, this.geometry)) {
                    const symbolizer = new regSymbolizers[i](symbol, this.geometry, this);
                    symbolizers.push(symbolizer);
                    if (symbolizer instanceof Symbolizers.PointSymbolizer) {
                        this._hasPoint = true;
                    }
                }
            }
        }
        if (!symbolizers.length) {
            if (console) {
                const id = this.geometry.getId();
                console.warn('invalid symbol for geometry(' + (this.geometry ? this.geometry.getType() + (id ? ':' + id : '') : '') + ') to draw : ' + JSON.stringify(geoSymbol));
            }
            // throw new Error('no symbolizers can be created to draw, check the validity of the symbol.');
        }
        this._debugSymbolizer = new Symbolizers.DebugSymbolizer(geoSymbol, this.geometry, this);
        this._hasShadow = this.geometry.options['shadowBlur'] > 0;
        return symbolizers;
    }

    hasPoint() {
        return !!this._hasPoint;
    }

    /**
     * for point symbolizers
     * @return {Point[]} points to render
     */
    getRenderPoints(placement) {
        if (!this._renderPoints) {
            this._renderPoints = {};
        }
        if (!placement) {
            placement = 'point';
        }
        if (!this._renderPoints[placement]) {
            this._renderPoints[placement] = this.geometry._getRenderPoints(placement);
        }
        return this._renderPoints[placement];
    }

    /**
     * for strokeAndFillSymbolizer
     * @return {Object[]} resources to render vector
     */
    getPaintParams(dx, dy) {
        const map = this.getMap(),
            zoom = map.getZoom(),
            pitched = (map.getPitch() !== 0),
            rotated = (map.getBearing() !== 0);
        let params = this._paintParams;
        // remove cached points if the geometry is simplified on the zoom.
        if (!params ||
            (params._zoom !== undefined && params._zoom !== zoom) ||
            (this._pitched !== pitched && this.geometry._redrawWhenPitch()) ||
            (this._rotated !== rotated && this.geometry._redrawWhenRotate())
            ) {
            //render resources geometry returned are based on 2d points.
            params = this.geometry._getPaintParams();
            if (this.geometry._simplified) {
                params._zoom = zoom;
            }
            this._paintParams = params;
        }
        if (!params) {
            return null;
        }
        this._pitched = pitched;
        this._rotated = rotated;
        const zoomScale = map.getScale(),
            paintParams = this._paintParams,
            tPaintParams = [], // transformed params
            points = paintParams[0];

        const containerPoints = this._getContainerPoints(points, dx, dy);
        if (!containerPoints) {
            return null;
        }
        tPaintParams.push(containerPoints);
        for (let i = 1, len = paintParams.length; i < len; i++) {
            if (isNumber(paintParams[i]) || (paintParams[i] instanceof Size)) {
                if (isNumber(paintParams[i])) {
                    tPaintParams.push(paintParams[i] / zoomScale);
                } else {
                    tPaintParams.push(paintParams[i].multi(1 / zoomScale));
                }
            } else {
                tPaintParams.push(paintParams[i]);
            }
        }
        return tPaintParams;
    }

    _getContainerPoints(points, dx, dy) {
        const map = this.getMap(),
            lineWidth = this.getSymbol()['lineWidth'] || 2,
            maxZoom = map.getMaxNativeZoom(),
            containerExtent = map.getContainerExtent(),
            extent2D = containerExtent.expand(lineWidth).convertTo(p => map._containerPointToPoint(p, maxZoom)),
            height = this.getHeight(),
            layerPoint = map._pointToContainerPoint(this.getLayer()._getRenderer()._northWest),
            cExtent = this.getContainerExtent();

        if (!cExtent) {
            return null;
        }
        let containerPoints;
        //convert view points to container points needed by canvas
        if (Array.isArray(points)) {
            let clipPoints = points;
            if (!cExtent.within(containerExtent) && this.geometry.options['clipToPaint']) {
                if (this.geometry.getJSONType() === 'Polygon') {
                    // clip the polygon to draw less and improve performance
                    if (!Array.isArray(points[0])) {
                        clipPoints = clipPolygon(points, extent2D);
                    } else {
                        clipPoints = [];
                        for (let i = 0; i < points.length; i++) {
                            const part = clipPolygon(points[i], extent2D);
                            if (part.length) {
                                clipPoints.push(part);
                            }
                        }
                    }
                } else if (this.geometry.getJSONType() === 'LineString') {
                    // clip the line string to draw less and improve performance
                    if (!Array.isArray(points[0])) {
                        clipPoints = clipLine(points, extent2D, true);
                    } else {
                        clipPoints = [];
                        for (let i = 0; i < points.length; i++) {
                            pushIn(clipPoints, clipLine(points[i], extent2D, true));
                        }
                    }
                }
            }
            containerPoints = mapArrayRecursively(clipPoints, point => {
                const p = map._pointToContainerPoint(point, maxZoom, height)._sub(layerPoint);
                if (dx || dy) {
                    p._add(dx, dy);
                }
                return p;
            });
        } else if (points instanceof Point) {
            containerPoints = map._pointToContainerPoint(points, maxZoom, height)._sub(layerPoint);
            if (dx || dy) {
                containerPoints._add(dx, dy);
            }
        }
        return containerPoints;
    }


    getSymbol() {
        return this.geometry._getInternalSymbol();
    }

    paint(extent) {
        if (!this.symbolizers) {
            return;
        }
        const renderer = this.getLayer()._getRenderer();
        if (!renderer || !renderer.context) {
            return;
        }
        if (extent && !extent.intersects(this.get2DExtent(renderer.resources))) {
            return;
        }
        this._beforePaint();
        const contexts = [renderer.context, renderer.resources];
        this._prepareShadow(renderer.context);
        for (let i = this.symbolizers.length - 1; i >= 0; i--) {
            this.symbolizers[i].symbolize.apply(this.symbolizers[i], contexts);
        }
        this._afterPaint();
        this._painted = true;
        this._debugSymbolizer.symbolize.apply(this._debugSymbolizer, contexts);
    }

    getSprite(resources, canvasClass) {
        if (this.geometry.type !== 'Point') {
            return null;
        }
        this._genSprite = true;
        if (!this._sprite && this.symbolizers.length > 0) {
            const extent = new PointExtent();
            this.symbolizers.forEach(s => {
                const markerExtent = s.getMarkerExtent(resources);
                extent._combine(markerExtent);
            });
            const origin = extent.getMin().multi(-1);
            const clazz = canvasClass || (this.getMap() ? this.getMap().CanvasClass : null);
            const canvas = Canvas.createCanvas(extent.getWidth(), extent.getHeight(), clazz);
            let bak;
            if (this._renderPoints) {
                bak = this._renderPoints;
            }
            const contexts = [canvas.getContext('2d'), resources];
            this._prepareShadow(canvas.getContext('2d'));
            for (let i = this.symbolizers.length - 1; i >= 0; i--) {
                const dxdy = this.symbolizers[i].getDxDy();
                this._renderPoints = {
                    'point': [
                        [origin.add(dxdy)]
                    ]
                };

                this.symbolizers[i].symbolize.apply(this.symbolizers[i], contexts);
            }
            if (bak) {
                this._renderPoints = bak;
            }
            this._sprite = {
                'canvas': canvas,
                'offset': extent.getCenter()
            };
        }
        this._genSprite = false;
        return this._sprite;
    }

    isSpriting() {
        return this._genSprite;
    }

    _prepareShadow(ctx) {
        if (this._hasShadow) {
            ctx.shadowBlur = this.geometry.options['shadowBlur'];
            ctx.shadowColor = this.geometry.options['shadowColor'];
        } else if (ctx.shadowBlur) {
            ctx.shadowBlur = null;
            ctx.shadowColor = null;
        }
    }

    _eachSymbolizer(fn, context) {
        if (!this.symbolizers) {
            return;
        }
        if (!context) {
            context = this;
        }
        for (let i = this.symbolizers.length - 1; i >= 0; i--) {
            fn.apply(context, [this.symbolizers[i]]);
        }
    }

    get2DExtent(resources) {
        this._verifyProjection();
        const map = this.getMap();
        resources = resources || this.getLayer()._getRenderer().resources;
        const zoom = map.getZoom();
        if (!this._extent2D || this._extent2D._zoom !== zoom) {
            delete this._extent2D;
            delete this._markerExtent;
            if (this.symbolizers) {
                const extent = this._extent2D = new PointExtent();
                const markerExt = this._markerExtent = new PointExtent();
                for (let i = this.symbolizers.length - 1; i >= 0; i--) {
                    const symbolizer = this.symbolizers[i];
                    extent._combine(symbolizer.get2DExtent());
                    if (symbolizer.getMarkerExtent) {
                        markerExt._combine(symbolizer.getMarkerExtent(resources));
                    }
                }
                extent._zoom = zoom;
            }
        }
        return this._extent2D.add(this._markerExtent);
    }

    getContainerExtent() {
        this._verifyProjection();
        const map = this.getMap();
        const zoom = map.getZoom();
        if (!this._extent2D || this._extent2D._zoom !== zoom) {
            this.get2DExtent();
        }
        const extent = this._extent2D.convertTo(c => map._pointToContainerPoint(c, zoom, this.height));
        if (extent) {
            extent._add(this._markerExtent);
        }
        return extent;
    }

    setZIndex(change) {
        this._eachSymbolizer(function (symbolizer) {
            symbolizer.setZIndex(change);
        });
    }

    show() {
        if (!this._painted) {
            const layer = this.getLayer();
            if (!layer.isCanvasRender()) {
                this.paint();
            }
        } else {
            this.removeCache();
            this._eachSymbolizer(function (symbolizer) {
                symbolizer.show();
            });
        }
    }

    hide() {
        this._eachSymbolizer(function (symbolizer) {
            symbolizer.hide();
        });
    }

    repaint() {
        this.removeCache();
    }

    /**
     * refresh symbolizers when symbol changed
     */
    refreshSymbol() {
        this.removeCache();
        this._removeSymbolizers();
        this.symbolizers = this._createSymbolizers();
    }

    remove() {
        this.removeCache();
        this._removeSymbolizers();
    }

    _removeSymbolizers() {
        this._eachSymbolizer(function (symbolizer) {
            delete symbolizer.painter;
            symbolizer.remove();
        });
        delete this.symbolizers;
    }

    /**
     * delete painter's caches
     */
    removeCache() {
        delete this._renderPoints;
        delete this._paintParams;
        delete this._sprite;
        delete this._extent2D;
        delete this._markerExtent;
    }

    getHeight() {
        const propHeight = this._getHeightProperty();
        if (propHeight !== this._propHeight) {
            this.height = this._getGeometryHeight();
        }
        if (!this.height) {
            return 0;
        }
        const scale = this.getMap().getScale();
        return this.height / scale;
    }

    _getGeometryHeight() {
        const map = this.getMap();
        if (!map) {
            return 0;
        }
        const height = this._getHeightProperty();
        this._propHeight = height;
        if (!height) {
            return 0;
        }
        const geometry = this.geometry;
        const z = map.getMaxNativeZoom(),
            center = geometry.getCenter(),
            target = map.locate(center, height, 0);
        const p0 = map.coordinateToPoint(center, z),
            p1 = map.coordinateToPoint(target, z);
        return Math.abs(p1.x - p0.x) * sign(height);
    }

    _getHeightProperty() {
        const geometry = this.geometry,
            layerOpts = geometry.getLayer().options,
            properties = geometry.getProperties();
        const height = layerOpts['enableHeight'] ? properties ? properties[layerOpts['heightProperty']] : 0 : 0;
        return height;
    }

    _verifyProjection() {
        const projection = this.geometry._getProjection();
        if (this._projCode && this._projCode !== projection.code) {
            this.removeCache();
        }
        this._projCode = projection.code;
    }

    _beforePaint() {
        const textcache = this.geometry[Symbolizers.TextMarkerSymbolizer.CACHE_KEY];
        if (!textcache) {
            return;
        }
        for (const p in textcache) {
            if (hasOwn(textcache, p)) {
                textcache[p].active = false;
            }
        }
    }

    _afterPaint() {
        const textcache = this.geometry[Symbolizers.TextMarkerSymbolizer.CACHE_KEY];
        if (!textcache) {
            return;
        }
        for (const p in textcache) {
            if (hasOwn(textcache, p)) {
                if (!textcache[p].active) {
                    delete textcache[p];
                }
            }
        }
    }
}
