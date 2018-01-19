import { isNumber, sign, pushIn, hasOwn } from '../../core/util';
import { clipPolygon, clipLine } from '../../core/util/path';
import Class from '../../core/Class';
import Size from '../../geo/Size';
import Point from '../../geo/Point';
import PointExtent from '../../geo/PointExtent';
import Canvas from '../../core/Canvas';
import * as Symbolizers from './symbolizers';
import { interpolate } from '../../core/util/util';

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
            geometry = this.geometry,
            res = map.getResolution(),
            pitched = (map.getPitch() !== 0),
            rotated = (map.getBearing() !== 0);
        let params = this._cachedParams;

        const paintAsPath = geometry._paintAsPath && geometry._paintAsPath();
        if (paintAsPath && this._unsimpledParams && res <= this._unsimpledParams._res) {
            //if res is smaller, return unsimplified params directly
            params = this._unsimpledParams;
        } else if (!params ||
            // refresh paint params
            // simplified, but not same zoom
            params._res !== map.getResolution() ||
            // refresh if requested by geometry
            this._pitched !== pitched && geometry._redrawWhenPitch() ||
            this._rotated !== rotated && geometry._redrawWhenRotate()
        ) {
            //render resources geometry returned are based on 2d points.
            params = geometry._getPaintParams();
            if (!params) {
                return null;
            }
            params._res = res;

            if (!geometry._simplified && paintAsPath) {
                if (!this._unsimpledParams) {
                    this._unsimpledParams = params;
                }
                if (res > this._unsimpledParams._res) {
                    this._unsimpledParams._res = res;
                }
            }
            this._cachedParams = params;
        }
        if (!params) {
            return null;
        }
        this._pitched = pitched;
        this._rotated = rotated;
        const zoomScale = map.getGLScale(),
            // paintParams = this._paintParams,
            tr = [], // transformed params
            points = params[0];

        const cPoints = this._pointContainerPoints(points, dx, dy, ignoreAltitude);
        if (!cPoints) {
            return null;
        }
        tr.push(cPoints);
        for (let i = 1, l = params.length; i < l; i++) {
            if (isNumber(params[i]) || (params[i] instanceof Size)) {
                if (isNumber(params[i])) {
                    tr.push(params[i] / zoomScale);
                } else {
                    tr.push(params[i].multi(1 / zoomScale));
                }
            } else {
                tr.push(params[i]);
            }
        }
        return tr;
    }

    _pointContainerPoints(points, dx, dy, ignoreAltitude, noClip) {
        const cExtent = this.getContainerExtent();
        if (!cExtent) {
            return null;
        }
        const map = this.getMap(),
            glZoom = map.getGLZoom(),
            layerPoint = map._pointToContainerPoint(this.getLayer()._getRenderer()._southWest)._add(0, -map.height);
        let cPoints;
        function pointContainerPoint(point, alt) {
            const p = map._pointToContainerPoint(point, glZoom, alt)._sub(layerPoint);
            if (dx || dy) {
                p._add(dx || 0, dy || 0);
            }
            return p;
        }

        let altitude = this.getAltitude();

        //convert 2d points to container points needed by canvas
        if (Array.isArray(points)) {
            const geometry = this.geometry;
            let clipped;
            if (!noClip && geometry.options['enableClip'] && !geometry.options['smoothness']) {
                clipped = this._clip(points, altitude);
            } else {
                clipped = {
                    points : points,
                    altitude : altitude
                };
            }
            const clipPoints = clipped.points;
            altitude = clipped.altitude;
            if (ignoreAltitude) {
                altitude = 0;
            }
            let alt = altitude;
            cPoints = clipPoints.map((c, idx) => {
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
        } else if (points instanceof Point) {
            if (ignoreAltitude) {
                altitude = 0;
            }
            cPoints = map._pointToContainerPoint(points, glZoom, altitude)._sub(layerPoint);
            if (dx || dy) {
                cPoints._add(dx, dy);
            }
        }
        return cPoints;
    }

    _clip(points, altitude) {
        const map = this.getMap(),
            glZoom = map.getGLZoom();
        let lineWidth = this.getSymbol()['lineWidth'];
        if (!isNumber(lineWidth)) {
            lineWidth = 4;
        }
        const containerExtent = map.getContainerExtent();
        let extent2D = containerExtent.expand(lineWidth).convertTo(p => map._containerPointToPoint(p, glZoom));
        if (map.getPitch() > 0 && altitude) {
            const c = map.cameraLookAt;
            const pos = map.cameraPosition;
            //add [1px, 1px] towards camera's lookAt
            extent2D = extent2D.combine(new Point(pos)._add(sign(c[0] - pos[0]), sign(c[1] - pos[1])));
        }
        const e = this.get2DExtent();
        let clipPoints = points;
        if (e.within(extent2D)) {
            // if (this.geometry.getJSONType() === 'LineString') {
            //     // clip line with altitude
            //     return this._clipLineByAlt(clipPoints, altitude);
            // }
            return {
                points : clipPoints,
                altitude : altitude
            };
        }
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
            //interpolate line's segment's altitude if altitude is an array
            return this._interpolateSegAlt(clipPoints, points, altitude);
            // const segs = this._interpolateSegAlt(clipPoints, points, altitude);
            // return this._clipLineByAlt(segs.points, segs.altitude);
        }

        return {
            points : clipPoints,
            altitude : altitude
        };
    }

    // _clipLineByAlt(clipSegs, altitude) {
    //     const frustumAlt = this.getMap().getFrustumAltitude();
    //     if (!Array.isArray(altitude) || this.maxAltitude <= frustumAlt) {
    //         return {
    //             points : clipSegs,
    //             altitude : altitude
    //         };
    //     }
    //     return clipByALt(clipSegs, altitude, frustumAlt);
    // }

    /**
     * interpolate clipped line segs's altitude
     * @param {Point[]|Point[][]} clipSegs
     * @param {Point[]|Point[][]} orig
     * @param {Number|Number[]} altitude
     * @private
     */
    _interpolateSegAlt(clipSegs, orig, altitude) {
        if (!Array.isArray(altitude)) {
            const fn = cc => cc.point;
            return {
                points : clipSegs.map(c => {
                    if (Array.isArray(c)) {
                        return c.map(fn);
                    }
                    return c.point;
                }),
                altitude : altitude
            };
        }
        const segsWithAlt = interpolateAlt(clipSegs, orig, altitude);
        altitude = [];
        const points = segsWithAlt.map(p => {
            if (Array.isArray(p)) {
                const alt = [];
                const cp = p.map(pp => {
                    alt.push(pp.altitude);
                    return pp.point;
                });
                altitude.push(alt);
                return cp;
            }
            altitude.push(p.altitude);
            return p.point;
        });
        return {
            points : points,
            altitude : altitude
        };
    }

    getSymbol() {
        return this.geometry._getInternalSymbol();
    }

    paint(extent, context) {
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
        const minAltitude = this.getMinAltitude();
        const frustumAlt = map.getFrustumAltitude();
        if (minAltitude && frustumAlt && frustumAlt < minAltitude) {
            return;
        }
        this._beforePaint();
        const ctx = context || renderer.context;
        const contexts = [ctx, renderer.resources];
        for (let i = this.symbolizers.length - 1; i >= 0; i--) {
            this._prepareShadow(ctx, this.symbolizers[i].symbol);
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
            const ctx = canvas.getContext('2d');
            const contexts = [ctx, resources];
            for (let i = this.symbolizers.length - 1; i >= 0; i--) {
                const dxdy = this.symbolizers[i].getDxDy();
                this._renderPoints = {
                    'point': [
                        [origin.add(dxdy)]
                    ]
                };
                this._prepareShadow(ctx, this.symbolizers[i].symbol);
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

    _prepareShadow(ctx, symbol) {
        if (symbol['shadowBlur']) {
            ctx.shadowBlur = symbol['shadowBlur'];
            ctx.shadowColor = symbol['shadowColor'] || 'black';
            ctx.shadowOffsetX = symbol['shadowOffsetX'] || 0;
            ctx.shadowOffsetY = symbol['shadowOffsetY'] || 0;
        } else if (ctx.shadowBlur) {
            ctx.shadowBlur = null;
            ctx.shadowColor = null;
            ctx.shadowOffsetX = null;
            ctx.shadowOffsetY = null;
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
        const frustumAlt = map.getFrustumAltitude();
        if (altitude && frustumAlt && frustumAlt < altitude) {
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
        const layer = this.getLayer();
        if (!layer) {
            return;
        }
        const renderer = layer.getRenderer();
        if (!renderer || !renderer.setToRedraw()) {
            return;
        }
        renderer.setToRedraw();
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
        delete this._cachedParams;
        delete this._unsimpledParams;
        if (this.geometry) {
            delete this.geometry[Symbolizers.TextMarkerSymbolizer.CACHE_KEY];
        }
    }

    getAltitude() {
        const propAltitude = this._getAltitudeProperty();
        if (propAltitude !== this._propAlt) {
            this._altAtMaxZ = this._getGeometryAltitude();
        }
        if (!this._altAtMaxZ) {
            return 0;
        }
        return this._altAtMaxZ;
    }

    getMinAltitude() {
        if (!this.minAltitude) {
            return 0;
        }
        return this.minAltitude;
    }

    _getGeometryAltitude() {
        const map = this.getMap();
        if (!map) {
            return 0;
        }
        const altitude = this._getAltitudeProperty();
        this._propAlt = altitude;
        if (!altitude) {
            this.minAltitude = this.maxAltitude = 0;
            return 0;
        }
        const center = this.geometry.getCenter();
        if (Array.isArray(altitude)) {
            this.minAltitude = Number.MAX_VALUE;
            this.maxAltitude = Number.MIN_VALUE;
            return altitude.map(alt => {
                const a = this._meterToPoint(center, alt);
                if (a < this.minAltitude) {
                    this.minAltitude = a;
                }
                if (a > this.maxAltitude) {
                    this.maxAltitude = a;
                }
                return a;
            });
        } else {
            this.minAltitude = this.maxAltitude = this._meterToPoint(center, altitude);
            return this.minAltitude;
        }
    }

    _meterToPoint(center, altitude) {
        const map = this.getMap();
        const z = map.getGLZoom();
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

function interpolateAlt(points, orig, altitude) {
    if (!Array.isArray(altitude)) {
        return points;
    }
    const parts = [];
    for (let i = 0, l = points.length; i < l; i++) {
        if (Array.isArray(points[i])) {
            parts.push(interpolateAlt(points[i], orig, altitude));
        } else {
            const p = points[i];
            if (!p.point.equals(orig[p.index])) {
                let w0, w1;
                if (p.index === 0) {
                    w0 = p.index;
                    w1 = p.index + 1;
                } else {
                    w0 = p.index - 1;
                    w1 = p.index;
                }

                const t0 = p.point.distanceTo(orig[w1]);
                const t = t0 / (t0 + orig[w0].distanceTo(p.point));
                const alt = interpolate(altitude[w0], altitude[w1], 1 - t);
                p.altitude = alt;
                parts.push(p);
            } else {
                p.altitude = altitude[p.index];
                parts.push(p);
            }
        }
    }
    return parts;
}

// function interpolatePoint(p0, p1, t) {
//     const x = interpolate(p0.x, p1.x, t),
//         y = interpolate(p0.y, p1.y, t);
//     return new Point(x, y);
// }

// function clipByALt(clipSegs, altitude, topAlt) {
//     const points = [];
//     const alt = [];
//     let preAlt;
//     // clip lines with camera altitude
//     for (let i = 0, l = clipSegs.length; i < l; i++) {
//         if (Array.isArray(clipSegs[i])) {
//             const r = clipByALt(clipSegs[i], altitude[i], topAlt);
//             if (!r) {
//                 continue;
//             }
//             points.push(r.points);
//             alt.push(r.altitude);
//         } else if (i === 0) {
//             preAlt = altitude[0];
//             points.push(clipSegs[i]);
//             alt.push(preAlt < topAlt ? preAlt : topAlt);
//         } else {
//             // i > 0
//             const a = altitude[i];
//             if (a >= topAlt) {
//                 if (preAlt >= topAlt) {
//                     points.push(clipSegs[i]);
//                     alt.push(topAlt);
//                 } else {
//                     //ascending interpolate
//                     const p = interpolatePoint(clipSegs[i - 1], clipSegs[i], (topAlt - preAlt) / (a - preAlt));
//                     points.push(p);
//                     alt.push(topAlt);
//                     points.push(clipSegs[i]);
//                     alt.push(topAlt);
//                 }
//                 // a < topAlt
//             } else if (preAlt < topAlt) {
//                 points.push(clipSegs[i]);
//                 alt.push(a);
//             } else {
//                 //descending interpolate
//                 const p = interpolatePoint(clipSegs[i - 1], clipSegs[i], (preAlt - topAlt) / (preAlt - a));
//                 points.push(p);
//                 alt.push(topAlt);
//                 points.push(clipSegs[i]);
//                 alt.push(a);
//             }
//             preAlt = a;
//         }
//     }
//     return {
//         points : points,
//         altitude : alt
//     };
// }

export default Painter;
