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


let testCanvas;

const TEMP_POINT0 = new Point(0, 0);
const TEMP_PAINT_EXTENT = new PointExtent();
const TEMP_EXTENT = new PointExtent();
const TEMP_FIXED_EXTENT = new PointExtent();
const TEMP_CLIP_EXTENT0 = new PointExtent();
const TEMP_CLIP_EXTENT1 = new PointExtent();
// const TEMP_CONTAINER_EXTENT = new PointExtent();

const TEMP_BBOX = {
    minx: Infinity,
    miny: Infinity,
    maxx: -Infinity,
    maxy: -Infinity
};

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
        this._altAtGLZoom = this._getGeometryAltitude();
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
            placement = 'center';
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
        const renderer = this.getLayer()._getRenderer();
        const mapStateCache = renderer.mapStateCache;
        let resolution, pitch, bearing, glScale, containerExtent;
        const map = this.getMap();
        if (mapStateCache && (!this._hitPoint)) {
            resolution = mapStateCache.resolution;
            pitch = mapStateCache.pitch;
            bearing = mapStateCache.bearing;
            glScale = mapStateCache.glScale;
            containerExtent = mapStateCache.containerExtent;
        } else {
            resolution = map.getResolution();
            pitch = map.getPitch();
            bearing = map.getBearing();
            glScale = map.getGLScale();
            containerExtent = map.getContainerExtent();
        }
        const geometry = this.geometry,
            res = resolution,
            pitched = (pitch !== 0),
            rotated = (bearing !== 0);
        let params = this._cachedParams;

        const paintAsPath = geometry._paintAsPath && geometry._paintAsPath();
        if (paintAsPath && this._unsimpledParams && res <= this._unsimpledParams._res) {
            //if res is smaller, return unsimplified params directly
            params = this._unsimpledParams;
        } else if (!params ||
            // refresh paint params
            // simplified, but not same zoom
            params._res !== resolution ||
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
        const zoomScale = glScale,
            // paintParams = this._paintParams,
            tr = [], // transformed params
            points = params[0];

        const mapExtent = containerExtent;
        const cPoints = this._pointContainerPoints(points, dx, dy, ignoreAltitude, this._hitPoint && !mapExtent.contains(this._hitPoint));
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

    _pointContainerPoints(points, dx, dy, ignoreAltitude, disableClip, pointPlacement) {
        if (this._aboveCamera()) {
            return null;
        }
        const renderer = this.getLayer()._getRenderer();
        const mapStateCache = renderer.mapStateCache;

        const map = this.getMap(),
            containerOffset = this.containerOffset;
        let glZoom;
        if (mapStateCache) {
            glZoom = mapStateCache.glZoom;
        } else {
            glZoom = map.getGLZoom();
        }
        let cPoints;
        const roundPoint = this.getLayer().options['roundPoint'];
        let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
        function pointsContainerPoints(viewPoints = [], alts = []) {
            const pts = map._pointsToContainerPoints(viewPoints, glZoom, alts);
            for (let i = 0, len = pts.length; i < len; i++) {
                const p = pts[i];
                p._sub(containerOffset);
                if (dx || dy) {
                    p._add(dx || 0, dy || 0);
                }
                if (roundPoint) {
                    //使用 round 会导致左右波动，用floor,ceil 要好点
                    p.x = Math.ceil(p.x);
                    p.y = Math.ceil(p.y);
                }
                minx = Math.min(p.x, minx);
                miny = Math.min(p.y, miny);
                maxx = Math.max(p.x, maxx);
                maxy = Math.max(p.y, maxy);
            }
            return pts;
        }

        let altitude = this.getAltitude();

        //convert 2d points to container points needed by canvas
        if (Array.isArray(points)) {
            const geometry = this.geometry;
            let clipped;
            if (!disableClip && geometry.options['enableClip']) {
                clipped = this._clip(points, altitude);
            } else {
                clipped = {
                    points: points,
                    altitude: altitude
                };
            }
            const clipPoints = clipped.points;
            altitude = clipped.altitude;
            if (ignoreAltitude) {
                altitude = 0;
            }
            let alt = altitude;
            cPoints = [];
            const alts = [];
            const altitudeIsNumber = isNumber(altitude);
            for (let i = 0, l = clipPoints.length; i < l; i++) {
                const c = clipPoints[i];
                if (Array.isArray(c)) {
                    // const cring = [];
                    //polygon rings or clipped line string
                    if (altitudeIsNumber) {
                        const cring = pointsContainerPoints(c, altitude);
                        cPoints.push(cring);
                        continue;
                    }
                    const altArray = [];
                    for (let ii = 0, ll = c.length; ii < ll; ii++) {
                        // const cc = c[ii];
                        if (Array.isArray(altitude)) {
                            if (altitude[i]) {
                                alt = altitude[i][ii];
                            } else {
                                alt = 0;
                            }
                        }
                        altArray.push(alt);
                    }
                    const cring = pointsContainerPoints(c, altArray);
                    cPoints.push(cring);
                } else {
                    //line string
                    if (Array.isArray(altitude)) {
                        // altitude of different placement for point symbolizers
                        if (pointPlacement === 'vertex-last') {
                            alt = altitude[altitude.length - 1 - i];
                        } else if (pointPlacement === 'line') {
                            alt = (altitude[i] + altitude[i + 1]) / 2;
                        } else {
                            //vertex, vertex-first
                            alt = altitude[i];
                        }
                    }
                    alts.push(alt);
                }
            }
            if (alts.length) {
                cPoints = pointsContainerPoints(clipPoints, alts);
            }
        } else if (points instanceof Point) {
            if (ignoreAltitude) {
                altitude = 0;
            }
            cPoints = map._pointToContainerPoint(points, glZoom, altitude)._sub(containerOffset);
            if (dx || dy) {
                cPoints._add(dx, dy);
            }
        }
        //cache geometry bbox
        TEMP_BBOX.minx = minx;
        TEMP_BBOX.miny = miny;
        TEMP_BBOX.maxx = maxx;
        TEMP_BBOX.maxy = maxy;
        this._containerBbox = TEMP_BBOX;
        return cPoints;
    }

    _clip(points, altitude) {
        // linestring polygon clip
        if (isNumber(altitude) && altitude !== 0) {
            return {
                points,
                altitude
            };
        }
        if (Array.isArray(altitude)) {
            let hasAltitude = false;
            for (let i = 0, len = altitude.length; i < len; i++) {
                if (altitude[i] !== 0) {
                    hasAltitude = true;
                    break;
                }
            }
            if (hasAltitude) {
                return {
                    points,
                    altitude
                };
            }
        }
        const map = this.getMap(),
            geometry = this.geometry;
        let lineWidth = this.getSymbol()['lineWidth'];
        if (!isNumber(lineWidth)) {
            lineWidth = 4;
        }
        const renderer = this.getLayer()._getRenderer();
        const mapStateCache = renderer.mapStateCache;
        let _2DExtent, glExtent, pitch;
        if (mapStateCache) {
            _2DExtent = mapStateCache._2DExtent;
            glExtent = mapStateCache.glExtent;
            pitch = mapStateCache.pitch;
        } else {
            _2DExtent = map._get2DExtent();
            glExtent = map._get2DExtent(map.getGLZoom());
            pitch = map.getPitch();
        }
        let extent2D = _2DExtent._expand(lineWidth);
        if (pitch > 0 && altitude) {
            const c = map.cameraLookAt;
            const pos = map.cameraPosition;
            //add [1px, 1px] towards camera's lookAt
            TEMP_POINT0.set(pos.x, pos.y);
            extent2D = extent2D._combine(TEMP_POINT0._add(sign(c[0] - pos[0]), sign(c[1] - pos[1])));
        }
        const e = this.get2DExtent(null, TEMP_CLIP_EXTENT1);
        let clipPoints = points;
        if (e.within(extent2D)) {
            // if (this.geometry.getJSONType() === 'LineString') {
            //     // clip line with altitude
            //     return this._clipLineByAlt(clipPoints, altitude);
            // }
            return {
                points: clipPoints,
                altitude: altitude
            };
        }
        const glExtent2D = glExtent._expand(lineWidth * map._glScale);
        const { xmin, ymin, xmax, ymax } = glExtent2D;
        const dx = Math.abs(xmax - xmin), dy = Math.abs(ymax - ymin);
        const maxEdge = Math.max(dx, dy);
        const r = maxEdge / 2;
        TEMP_CLIP_EXTENT0.xmin = glExtent2D.xmin - r;
        TEMP_CLIP_EXTENT0.xmax = glExtent2D.xmax + r;
        TEMP_CLIP_EXTENT0.ymin = glExtent2D.ymin - r;
        TEMP_CLIP_EXTENT0.ymax = glExtent2D.ymax + r;

        const smoothness = geometry.options['smoothness'];
        // if (this.geometry instanceof Polygon) {
        if (geometry.getShell && this.geometry.getHoles && !smoothness) {
            // clip the polygon to draw less and improve performance
            if (!Array.isArray(points[0])) {
                clipPoints = clipPolygon(points, TEMP_CLIP_EXTENT0);
            } else {
                clipPoints = [];
                for (let i = 0; i < points.length; i++) {
                    const part = clipPolygon(points[i], TEMP_CLIP_EXTENT0);
                    if (part.length) {
                        clipPoints.push(part);
                    }
                }
            }
        } else if (geometry.getJSONType() === 'LineString' && !smoothness) {
            // clip the line string to draw less and improve performance
            if (!Array.isArray(points[0])) {
                clipPoints = clipLine(points, TEMP_CLIP_EXTENT0, false, !!smoothness);
            } else {
                clipPoints = [];
                for (let i = 0; i < points.length; i++) {
                    pushIn(clipPoints, clipLine(points[i], TEMP_CLIP_EXTENT0, false, !!smoothness));
                }
            }
            //interpolate line's segment's altitude if altitude is an array
            return this._interpolateSegAlt(clipPoints, points, altitude);
            // const segs = this._interpolateSegAlt(clipPoints, points, altitude);
            // return this._clipLineByAlt(segs.points, segs.altitude);
        }

        return {
            points: clipPoints,
            altitude: altitude
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
                points: clipSegs.map(c => {
                    if (Array.isArray(c)) {
                        return c.map(fn);
                    }
                    return c.point;
                }),
                altitude: altitude
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
            points: points,
            altitude: altitude
        };
    }

    getSymbol() {
        return this.geometry._getInternalSymbol();
    }

    paint(extent, context, offset) {
        if (!this.symbolizers) {
            return;
        }
        const renderer = this.getLayer()._getRenderer();
        if (!renderer || !renderer.context && !context) {
            return;
        }
        const mapStateCache = renderer.mapStateCache || {};
        //reduce geos to paint when drawOnInteracting
        if (!this.geometry._isCheck) {
            if (extent && !extent.intersects(this.get2DExtent(renderer.resources, TEMP_PAINT_EXTENT))) {
                return;
            }
        }
        const map = this.getMap();
        const minAltitude = this.getMinAltitude();
        const frustumAlt = map.getFrustumAltitude();
        if (minAltitude && frustumAlt && frustumAlt < minAltitude) {
            return;
        }
        //Multiplexing offset
        this.containerOffset = offset || mapStateCache.offset || map._pointToContainerPoint(renderer.southWest)._add(0, -map.height);
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
        this._spriting = true;
        if (!this._sprite && this.symbolizers.length > 0) {
            const extent = new PointExtent();
            this.symbolizers.forEach(s => {
                const markerExtent = s.getFixedExtent(resources);
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
                    'center': [
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
        this._spriting = false;
        return this._sprite;
    }

    isSpriting() {
        return !!this._spriting;
    }

    hitTest(cp, tolerance) {
        if (!tolerance || tolerance < 0.5) {
            tolerance = 0.5;
        }
        if (!testCanvas) {
            const canvasClass = this.getMap() ? this.getMap().CanvasClass : null;
            testCanvas = Canvas.createCanvas(1, 1, canvasClass);
        }
        Canvas.setHitTesting(true);
        testCanvas.width = testCanvas.height = 2 * tolerance;
        const ctx = testCanvas.getContext('2d');
        this._hitPoint = cp.sub(tolerance, tolerance);
        try {
            this.paint(null, ctx, this._hitPoint);
        } catch (e) {
            throw e;
        } finally {
            Canvas.setHitTesting(false);
        }
        delete this._hitPoint;
        const imgData = ctx.getImageData(0, 0, testCanvas.width, testCanvas.height).data;
        for (let i = 3, l = imgData.length; i < l; i += 4) {
            if (imgData[i] > 0) {
                return true;
            }
        }
        return false;
    }

    isHitTesting() {
        return !!this._hitPoint;
    }

    _prepareShadow(ctx, symbol) {
        if (symbol['shadowBlur']) {
            //Ignore shadows when hit detection
            ctx.shadowBlur = (this.isHitTesting() ? 0 : symbol['shadowBlur']);
            ctx.shadowColor = symbol['shadowColor'] || '#000';
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

    get2DExtent(resources, out) {
        this._verifyProjection();
        const map = this.getMap();
        resources = resources || this.getLayer()._getRenderer().resources;
        const zoom = map.getZoom();
        const isDynamicSize = this._isDynamicSize();
        if (!this._extent2D || this._extent2D._zoom !== zoom || !this._fixedExtent) {
            if (this._extent2D && this._extent2D._zoom !== zoom) {
                delete this._extent2D;
            }
            if (this.symbolizers) {
                if (!this._extent2D) {
                    this._extent2D = this._computeExtent2D(new PointExtent());
                    this._extent2D._zoom = zoom;
                }
                if (!this._fixedExtent) {
                    this._fixedExtent = this._computeFixedExtent(resources, new PointExtent());
                }
            }
        }

        if (!this._extent2D) {
            if (isDynamicSize) {
                delete this._fixedExtent;
            }
            return null;
        }
        const { xmin, ymin, xmax, ymax } = this._fixedExtent;
        if (isDynamicSize) {
            delete this._fixedExtent;
        }
        //2d 坐标系是opengl规则，y轴方向与containerPoint是反向的
        TEMP_FIXED_EXTENT.set(xmin, -ymax, xmax, -ymin);
        if (out) {
            out.set(this._extent2D['xmin'], this._extent2D['ymin'], this._extent2D['xmax'], this._extent2D['ymax']);
            out._add(TEMP_FIXED_EXTENT);
            return out;
        }
        return this._extent2D.add(TEMP_FIXED_EXTENT);
    }

    _computeExtent2D(extent) {
        for (let i = this.symbolizers.length - 1; i >= 0; i--) {
            const symbolizer = this.symbolizers[i];
            extent._combine(symbolizer.get2DExtent());
        }
        return extent;
    }

    _computeFixedExtent(resources, extent) {
        for (let i = this.symbolizers.length - 1; i >= 0; i--) {
            const symbolizer = this.symbolizers[i];
            if (symbolizer.getFixedExtent) {
                extent._combine(symbolizer.getFixedExtent(resources));
            }
        }
        return extent;
    }

    _isDynamicSize() {
        for (let i = this.symbolizers.length - 1; i >= 0; i--) {
            const symbolizer = this.symbolizers[i];
            if (symbolizer.isDynamicSize()) {
                return true;
            }
        }
        return false;
    }

    getContainerExtent(out) {
        if (this._aboveCamera()) {
            return null;
        }
        this._verifyProjection();
        const map = this.getMap();
        const zoom = map.getZoom();
        const glScale = map._glScale;
        if (!this._extent2D || this._extent2D._zoom !== zoom) {
            this.get2DExtent(null, TEMP_EXTENT);
        }
        const altitude = this.getMinAltitude();
        const extent = this._extent2D.convertTo(c => map._pointToContainerPoint(c, zoom, altitude / glScale, TEMP_POINT0), out);
        const maxAltitude = this.getMaxAltitude();
        if (maxAltitude !== altitude) {
            const extent2 = this._extent2D.convertTo(c => map._pointToContainerPoint(c, zoom, maxAltitude / glScale, TEMP_POINT0), TEMP_EXTENT);
            extent._combine(extent2);
        }
        const layer = this.geometry.getLayer();
        if (this.geometry.type === 'LineString' && maxAltitude && layer.options['drawAltitude']) {
            const groundExtent = this._extent2D.convertTo(c => map._pointToContainerPoint(c, zoom, 0, TEMP_POINT0), TEMP_EXTENT);
            extent._combine(groundExtent);
        }
        if (extent) {
            extent._add(this._fixedExtent || this._computeFixedExtent(null, new PointExtent()));
        }
        const smoothness = this.geometry.options['smoothness'];
        if (smoothness) {
            extent._expand(extent.getWidth() * 0.15);
        }
        return extent;
    }

    _aboveCamera() {
        const altitude = this.getMinAltitude();
        const map = this.getMap();
        const frustumAlt = map.getFrustumAltitude();
        return altitude && frustumAlt && frustumAlt < altitude;
    }

    getFixedExtent() {
        const map = this.getMap();
        const zoom = map.getZoom();
        if (this._isDynamicSize()) {
            return this._computeFixedExtent(null, new PointExtent());
        }
        if (!this._extent2D || this._extent2D._zoom !== zoom) {
            this.get2DExtent(null, TEMP_FIXED_EXTENT);
        }
        return this._fixedExtent;
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
        this._altAtGLZoom = this._getGeometryAltitude();
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
        delete this._fixedExtent;
        delete this._cachedParams;
        delete this._unsimpledParams;
        if (this.geometry) {
            delete this.geometry[Symbolizers.TextMarkerSymbolizer.CACHE_KEY];
        }
    }

    getAltitude() {
        const propAlt = this.geometry.getAltitude();
        if (propAlt !== this._propAlt) {
            this._altAtGLZoom = this._getGeometryAltitude();
        }
        if (!this._altAtGLZoom) {
            return 0;
        }
        return this._altAtGLZoom;
    }

    getMinAltitude() {
        if (!this.minAltitude) {
            return 0;
        }
        return this.minAltitude;
    }

    getMaxAltitude() {
        if (!this.maxAltitude) {
            return 0;
        }
        return this.maxAltitude;
    }

    _getGeometryAltitude() {
        const map = this.getMap();
        if (!map) {
            return 0;
        }
        const altitude = this.geometry.getAltitude();
        this._propAlt = altitude;
        if (!altitude) {
            this.minAltitude = this.maxAltitude = 0;
            return 0;
        }
        const center = this.geometry.getCenter();
        if (!center) {
            return 0;
        }
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
        return map.distanceToPoint(altitude, 0, z, center).x * sign(altitude);
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

export default Painter;
