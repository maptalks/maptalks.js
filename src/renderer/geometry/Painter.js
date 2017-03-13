import { isNumber, mapArrayRecursively } from 'core/util';
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


function convertExtent(extent, fn) {
    if (!extent) {
        return null;
    }
    const e = new PointExtent();
    extent.toArray().forEach(c => {
        e._combine(fn(c));
    });
    return e;
}

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
    }

    getMap() {
        return this.geometry.getMap();
    }

    getLayer() {
        return this.geometry.getLayer();
    }

    /**
     * 构造symbolizers
     * @return {*} [description]
     */
    _createSymbolizers() {
        var geoSymbol = this.getSymbol(),
            symbolizers = [],
            regSymbolizers = registerSymbolizers,
            symbols = geoSymbol;
        if (!Array.isArray(geoSymbol)) {
            symbols = [geoSymbol];
        }
        var symbol, symbolizer;
        for (let ii = symbols.length - 1; ii >= 0; ii--) {
            symbol = symbols[ii];
            for (let i = regSymbolizers.length - 1; i >= 0; i--) {
                if (regSymbolizers[i].test(symbol, this.geometry)) {
                    symbolizer = new regSymbolizers[i](symbol, this.geometry, this);
                    symbolizers.push(symbolizer);
                    if (symbolizer instanceof Symbolizers.PointSymbolizer) {
                        this._hasPointSymbolizer = true;
                    }
                }
            }
        }
        if (!symbolizers.length) {
            if (console) {
                console.warn('invalid symbol for geometry(' + (this.geometry ? this.geometry.getType() + (this.geometry.getId() ? ':' + this.geometry.getId() : '') : '') + ') to draw : ' + JSON.stringify(geoSymbol));
            }
            // throw new Error('no symbolizers can be created to draw, check the validity of the symbol.');
        }
        this._debugSymbolizer = new Symbolizers.DebugSymbolizer(symbol, this.geometry, this);
        this._hasShadow = this.geometry.options['shadowBlur'] > 0;
        return symbolizers;
    }

    hasPointSymbolizer() {
        return this._hasPointSymbolizer;
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
        const map = this.getMap();
        const zoom = map.getZoom();
        const pitched = map.getPitch() > 0;
        const rotated = map.getBearing() > 0;
        var params = this._paintParams;
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
        const maxZoom = map.getMaxZoom();
        const zoomScale = map.getScale();
        const layerNorthWest = this.getLayer()._getRenderer()._northWest;
        const layerPoint = map._pointToContainerPoint(layerNorthWest),
            paintParams = this._paintParams,
            tPaintParams = [], // transformed params
            //refer to Geometry.Canvas
            points = paintParams[0];
        var containerPoints;
        //convert view points to container points needed by canvas
        if (Array.isArray(points)) {
            containerPoints = mapArrayRecursively(points, point => {
                const p = map._pointToContainerPoint(point, maxZoom)._substract(layerPoint);
                if (dx || dy) {
                    p._add(dx, dy);
                }
                return p;
            });
        } else if (points instanceof Point) {
            containerPoints = map._pointToContainerPoint(points, maxZoom)._substract(layerPoint);
            if (dx || dy) {
                containerPoints._add(dx, dy);
            }
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

    getSymbol() {
        return this.geometry._getInternalSymbol();
    }

    paint() {
        if (!this.symbolizers) {
            return;
        }
        const renderer = this.getLayer()._getRenderer();
        const contexts = [renderer.context, renderer.resources];
        this._prepareShadow(renderer.context);
        for (var i = this.symbolizers.length - 1; i >= 0; i--) {
            this.symbolizers[i].symbolize.apply(this.symbolizers[i], contexts);
        }
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
            this.symbolizers.forEach(function (s) {
                var markerExtent = s.getMarkerExtent(resources);
                extent._combine(markerExtent);
            });
            const origin = extent.getMin().multi(-1);
            const clazz = canvasClass || (this.getMap() ? this.getMap().CanvasClass : null);
            const canvas = Canvas.createCanvas(extent.getWidth(), extent.getHeight(), clazz);
            var bak;
            if (this._renderPoints) {
                bak = this._renderPoints;
            }
            const contexts = [canvas.getContext('2d'), resources];
            this._prepareShadow(canvas.getContext('2d'));
            for (let i = this.symbolizers.length - 1; i >= 0; i--) {
                let dxdy = this.symbolizers[i].getDxDy();
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
        for (var i = this.symbolizers.length - 1; i >= 0; i--) {
            fn.apply(context, [this.symbolizers[i]]);
        }
    }

    get2DExtent(resources) {
        const map = this.getMap();
        resources = resources || this.getLayer()._getRenderer().resources;
        const zoom = map.getZoom();
        if (!this._extent2D || this._extent2D._zoom !== zoom) {
            delete this._extent2D;
            delete this._markerExtent;
            if (this.symbolizers) {
                const extent = this._extent2D = new PointExtent();
                const markerExt = this._markerExtent = new PointExtent();
                var symbolizer;
                for (let i = this.symbolizers.length - 1; i >= 0; i--) {
                    symbolizer = this.symbolizers[i];
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
        if (!this._extent2D || this._extent2D._zoom !== this.getMap().getZoom()) {
            this.get2DExtent();
        }
        return convertExtent(this._extent2D, c => this.getMap()._pointToContainerPoint(c)).add(this._markerExtent);
    }

    setZIndex(change) {
        this._eachSymbolizer(function (symbolizer) {
            symbolizer.setZIndex(change);
        });
    }

    show() {
        if (!this._painted) {
            var layer = this.getLayer();
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
}
