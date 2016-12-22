import { isArray } from 'core/util';
import { getExternalResources } from 'core/util/resource';
import Browser from 'core/Browser';
import VectorLayer from 'layer/VectorLayer';
import { Canvas as Renderer } from 'renderer/overlaylayer';

/**
 * @classdesc
 * Renderer class based on HTML5 Canvas2D for VectorLayers
 * @class
 * @protected
 * @memberOf renderer.vectorlayer
 * @name Canvas
 * @extends {renderer.overlaylayer.Canvas}
 * @param {VectorLayer} layer - layer of the renderer
 */
export const Canvas = Renderer.extend(/** @lends renderer.vectorlayer.Canvas.prototype */ {

    initialize: function (layer) {
        this.layer = layer;
        this._painted = false;
    },

    checkResources: function () {
        var me = this;
        var resources = Renderer.prototype.checkResources.apply(this, arguments);
        var style = this.layer.getStyle();
        if (style) {
            if (!isArray(style)) {
                style = [style];
            }
            style.forEach(function (s) {
                var res = getExternalResources(s['symbol'], true);
                if (res) {
                    for (var ii = 0; ii < res.length; ii++) {
                        if (!me.resources.isResourceLoaded(res[ii])) {
                            resources.push(res[ii]);
                        }
                    }
                }
            });
        }
        return resources;
    },

    /**
     * render layer
     * @param  {Geometry[]} geometries   geometries to render
     * @param  {Boolean} ignorePromise   whether escape step of promise
     */
    draw: function () {
        if (!this.getMap()) {
            return;
        }
        if (!this.layer.isVisible() || this.layer.isEmpty()) {
            this.clearCanvas();
            this.completeRender();
            return;
        }

        this._drawGeos();

        this.completeRender();
    },

    //redraw all the geometries with transform matrix
    //this may bring low performance if number of geometries is large.
    transform: function (matrix) {
        if (Browser.mobile || this.layer.getMask()) {
            return false;
        }
        //determin whether this layer should be transformed.
        //if all the geometries to render are vectors including polygons and linestrings,
        //disable transforming won't reduce user experience.
        if (!this._hasPointSymbolizer ||
            this.getMap()._getRenderer()._getCountOfGeosToDraw() > this.layer.options['thresholdOfTransforming']) {
            return false;
        }
        this._drawGeos(matrix);
        return true;
    },

    isBlank: function () {
        return this._isBlank;
    },

    /**
     * Show and render
     * @override
     */
    show: function () {
        this.layer.forEach(function (geo) {
            geo.onZoomEnd();
        });
        Renderer.prototype.show.apply(this, arguments);
    },

    _drawGeos: function (matrix) {
        var map = this.getMap();
        if (!map) {
            return;
        }
        var layer = this.layer;
        if (layer.isEmpty()) {
            this.fireLoadedEvent();
            return;
        }
        if (!layer.isVisible()) {
            this.fireLoadedEvent();
            return;
        }
        this._prepareToDraw();
        var extent2D = this._extent2D,
            maskExtent2D = this.prepareCanvas();
        if (maskExtent2D) {
            if (!maskExtent2D.intersects(extent2D)) {
                this.fireLoadedEvent();
                return;
            }
            extent2D = extent2D.intersection(maskExtent2D);
        }
        this._displayExtent = extent2D;
        this._forEachGeo(this._checkGeo, this);
        for (var i = 0, len = this._geosToDraw.length; i < len; i++) {
            this._geosToDraw[i]._getPainter().paint(matrix);
        }
    },

    _prepareToDraw: function () {
        this._isBlank = true;
        this._painted = true;
        this._hasPointSymbolizer = false;
        this._geosToDraw = [];
    },

    _checkGeo: function (geo) {
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
    },

    _forEachGeo: function (fn, context) {
        this.layer.forEach(fn, context);
    },

    onZoomEnd: function () {
        delete this._extent2D;
        if (this.layer.isVisible()) {
            this.layer.forEach(function (geo) {
                geo.onZoomEnd();
            });
        }
        if (!this._painted) {
            this.render(true);
        } else {
            //prepareRender is called in render not in draw.
            //Thus prepareRender needs to be called here
            this.prepareRender();
            this.draw();
        }
    },

    onMoveEnd: function () {
        if (!this._painted) {
            this.render(true);
        } else {
            this.prepareRender();
            this.draw();
        }
    },

    onResize: function () {
        this.resizeCanvas();
        if (!this._painted) {
            this.render(true);
        } else {
            delete this._extent2D;
            this.prepareRender();
            this.draw();
        }
    },

    onRemove: function () {
        this._forEachGeo(function (g) {
            g.onHide();
        });
        delete this._geosToDraw;
    },

    onGeometryPropertiesChange: function (param) {
        if (param) {
            this.layer._styleGeometry(param['target']);
        }
    }
});

VectorLayer.registerRenderer('canvas', Canvas);
