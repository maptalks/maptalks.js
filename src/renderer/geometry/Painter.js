import { isNumber, sign, pushIn, hasOwn } from 'core/util';
import { clipPolygon, clipLine } from 'core/util/path';
import Class from 'core/Class';
import Size from 'geo/Size';
import Point from 'geo/Point';
import PointExtent from 'geo/PointExtent';
import Canvas from 'core/Canvas';
import * as Symbolizers from 'renderer/geometry/symbolizers';

//registered symbolizers
//the latter will paint at the last
const registerSymbolizers = [
    Symbolizers.DrawAltitudeSymbolizer,
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
 * @private
 */
class Painter extends Class {

    /**
     *  @param {Geometry} geometry - geometry to paint
     */
    constructor(geometry) {
        super();
        this.geometry = geometry;
        this.symbolizers = this._createSymbolizers();
        this._altAtMaxZ = this._getGeometryAltitude();
    }

    getMap() {
        return this.geometry.getMap();
    }

    getLayer() {
        return this.geometry.getLayer();
    }

    /**
     * create symbolizers
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
    getPaintParams(dx, dy, ignoreAltitude) {
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

        const containerPoints = this._pointContainerPoints(points, dx, dy, ignoreAltitude);
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

    _pointContainerPoints(points, dx, dy, ignoreAltitude) {

        const cExtent = this.getContainerExtent();
        if (!cExtent) {
            return null;
        }
        const map = this.getMap(),
            maxZoom = map.getMaxNativeZoom(),
            layerPoint = map._pointToContainerPoint(this.getLayer()._getRenderer()._northWest);
        let containerPoints;
        function pointContainerPoint(point, alt) {
            const p = map._pointToContainerPoint(point, maxZoom, alt)._sub(layerPoint);
            if (dx || dy) {
                p._add(dx || 0, dy || 0);
            }
            return p;
        }

        let altitude = this.getAltitude();
        // clip will cause wrong paint when altitude is an array
        const isClip = !Array.isArray(altitude);
        if (ignoreAltitude) {
            altitude = 0;
        }
        //convert 2d points to container points needed by canvas
        if (Array.isArray(points)) {
            let clipPoints = points;
            if (isClip) {
                clipPoints = this._clip(points, altitude);
            }
            let alt = altitude;
            containerPoints = clipPoints.map((c, idx) => {
                if (Array.isArray(c)) {
                    return c.map((cc, cidx) => {
                        if (Array.isArray(altitude)) {
                            if (altitude[idx]) {
                                alt = altitude[idx][cidx];
                            } else {
                                alt = 0;
                            }
                        }
                        return pointContainerPoint(cc, alt);
                    });
                } else {
                    if (Array.isArray(altitude)) {
                        alt = altitude[idx];
                    }
                    return pointContainerPoint(c, alt);
                }
            });
            // containerPoints = mapArrayRecursively(clipPoints, point => pointContainerPoint(point, altitude));
        } else if (points instanceof Point) {
            containerPoints = map._pointToContainerPoint(points, maxZoom, altitude)._sub(layerPoint);
            if (dx || dy) {
                containerPoints._add(dx, dy);
            }
        }
        return containerPoints;
    }

    _clip(points, altitude) {
        const map = this.getMap(),
            maxZoom = map.getMaxNativeZoom();
        let lineWidth = this.getSymbol()['lineWidth'];
        if (!isNumber(lineWidth)) {
            lineWidth = 4;
        }
        const containerExtent = map.getContainerExtent();
        //TODO map.height / 4 is a magic number to draw complete polygon with altitude after clipping
        const extent2D = containerExtent.expand(altitude ? map.height / 4 : lineWidth).convertTo(p => map._containerPointToPoint(p, maxZoom));
        const e = this.get2DExtent();
        let clipPoints = points;
        if (!e.within(map._get2DExtent()) && this.geometry.options['clipToPaint']) {
            // if (this.geometry instanceof Polygon) {
            if (this.geometry.getShell && this.geometry.getHoles) {
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
                    clipPoints = clipLine(points, extent2D);
                } else {
                    clipPoints = [];
                    for (let i = 0; i < points.length; i++) {
                        pushIn(clipPoints, clipLine(points[i], extent2D));
                    }
                }
            }
        }
        return clipPoints;
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
        //reduce geos to paint when drawOnInteracting
        if (extent && !extent.intersects(this.get2DExtent(renderer.resources))) {
            return;
        }
        const map = this.getMap();
        const altitude = this.getMinAltitude();
        if (altitude && map.cameraAltitude && map.cameraAltitude < altitude) {
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
        const altitude = this.getMinAltitude();
        if (map.cameraAltitude && map.cameraAltitude < altitude) {
            return null;
        }
        const extent = this._extent2D.convertTo(c => map._pointToContainerPoint(c, zoom, altitude));
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

    getAltitude() {
        const propAltitude = this._getAltitudeProperty();
        if (propAltitude !== this._propAlt) {
            this._altAtMaxZ = this._getGeometryAltitude();
        }
        if (!this._altAtMaxZ) {
            return 0;
        }
        const scale = this.getMap().getScale();
        if (Array.isArray(this._altAtMaxZ)) {
            return this._altAtMaxZ.map(alt => alt / scale);
        } else {
            return this._altAtMaxZ / scale;
        }
    }

    getMinAltitude() {
        if (!this.minAltitude) {
            return 0;
        }
        const scale = this.getMap().getScale();
        return this.minAltitude / scale;
    }

    _getGeometryAltitude() {
        const map = this.getMap();
        if (!map) {
            return 0;
        }
        const altitude = this._getAltitudeProperty();
        this._propAlt = altitude;
        if (!altitude) {
            return 0;
        }
        const center = this.geometry.getCenter();
        if (Array.isArray(altitude)) {
            this.minAltitude = Number.MAX_VALUE;
            return altitude.map(alt => {
                const a = this._meterToPoint(center, alt);
                if (a < this.minAltitude) {
                    this.minAltitude = a;
                }
                return a;
            });
        } else {
            this.minAltitude = this._meterToPoint(center, altitude);
            return this.minAltitude;
        }
    }

    _meterToPoint(center, altitude) {
        const map = this.getMap();
        const z = map.getMaxNativeZoom();
        const target = map.locate(center, altitude, 0);
        const p0 = map.coordToPoint(center, z),
            p1 = map.coordToPoint(target, z);
        return Math.abs(p1.x - p0.x) * sign(altitude);
    }

    _getAltitudeProperty() {
        const geometry = this.geometry,
            layerOpts = geometry.getLayer().options,
            properties = geometry.getProperties();
        const altitude = layerOpts['enableAltitude'] ? properties ? properties[layerOpts['altitudeProperty']] : 0 : 0;
        return altitude;
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

export default Painter;
