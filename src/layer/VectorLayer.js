/**
 * @classdesc
 * A layer for managing and rendering geometrie.
 * @class
 * @category layer
 * @extends {maptalks.OverlayLayer}
 * @param {String|Number} id - layer's id
 * @param {Object} [options=null] - construct options
 * @param {Boolean} [options.debug=false] - whether the geometries on the layer is in debug mode.
 * @param {Boolean} [options.enableSimplify=false] - whether to simplify geometries before rendering.
 * @param {String} [options.cursor=default] - the cursor style of the layer
 * @param {Boolean} [options.geometryEvents=true] - enable/disable firing geometry events
 * @param {Number} [options.thresholdOfTransforming=50] - threshold of points number to update points while transforming.
 * @param {*} options.* - any other option defined in [maptalks.Layer]{@link maptalks.Layer#options}
 */
Z.VectorLayer = Z.OverlayLayer.extend(/** @lends maptalks.VectorLayer.prototype */{

    options:{
        'debug'                     : false,
        'enableSimplify'            : true,
        'cursor'                    : 'pointer',
        'geometryEvents'            : true,
        'thresholdOfTransforming'    : 200,
        'drawImmediate'             : false,
        'drawOnce'                  : false,
        'defaultIconSize'           : [20, 20]
    },

    getStyle: function () {
        if (!this._style) {
            return null;
        }
        return this._style;
    },

    setStyle: function (style) {
        this._style = style;
        this._cookedStyles = this._cookStyle(style);
        this.forEach(function (geometry) {
            this._styleGeometry(geometry);
        }, this);
        return this;
    },

    removeStyle: function () {
        if (!this._style) {
            return this;
        }
        delete this._style;
        delete this._cookedStyles;
        this.forEach(function (geometry) {
            geometry.setSymbol(geometry._symbolBeforeStyle);
            delete geometry._symbolBeforeStyle;
        }, this);
        return this;
    },

    _styleGeometry: function (geometry) {
        var symbol = geometry.getSymbol(),
            g = Z.Util.getFilterFeature(geometry);
        for (var i = 0, len = this._cookedStyles.length; i < len; i++) {
            if (this._cookedStyles[i]['filter'](g) === true) {
                if (!geometry._symbolBeforeStyle) {
                    geometry._symbolBeforeStyle = symbol;
                }
                geometry.setSymbol(this._cookedStyles[i]['symbol']);
                return true;
            }
        }
        return false;
    },

    _cookStyle: function (styles) {
        if (!Z.Util.isArray(styles)) {
            return this._cookStyle([styles]);
        }
        var cooked = [];
        for (var i = 0; i < styles.length; i++) {
            cooked.push({
                'filter' : Z.Util.createFilter(styles[i]['filter']),
                'symbol' : styles[i].symbol
            });
        }
        return cooked;
    }
});

/**
 * Export the vector layer's profile json. <br>
 * @param  {Object} [options=null] - export options
 * @param  {Object} [options.geometries=null] - If not null and the layer is a [OverlayerLayer]{@link maptalks.OverlayLayer},
 *                                            the layer's geometries will be exported with the given "options.geometries" as a parameter of geometry's toJSON.
 * @param  {maptalks.Extent} [options.clipExtent=null] - if set, only the geometries intersectes with the extent will be exported.
 * @return {Object} layer's profile JSON
 */
Z.VectorLayer.prototype.toJSON = function (options) {
    if (!options) {
        options = {};
    }
    var profile = {
        'type'    : 'VectorLayer',
        'id'      : this.getId(),
        'options' : this.config()
    };
    if ((Z.Util.isNil(options['style']) || options['style']) && this.getStyle()) {
        profile['style'] = this.getStyle();
    }
    if (Z.Util.isNil(options['geometries']) || options['geometries']) {
        var clipExtent;
        if (options['clipExtent']) {
            clipExtent = new Z.Extent(options['clipExtent']);
        }
        var geoJSONs = [];
        var geometries = this.getGeometries(),
            geoExt,
            json;
        for (var i = 0, len = geometries.length; i < len; i++) {
            geoExt = geometries[i].getExtent();
            if (!geoExt || (clipExtent && !clipExtent.intersects(geoExt))) {
                continue;
            }
            json = geometries[i].toJSON(options['geometries']);
            if (json['symbol'] && this.getStyle()) {
                json['symbol'] = geometries[i]._symbolBeforeStyle ? Z.Util.extend({}, geometries[i]._symbolBeforeStyle) : null;
            }
            geoJSONs.push(json);
        }
        profile['geometries'] = geoJSONs;
    }
    return profile;
};

/**
 * Reproduce a VectorLayer from layer's profile JSON.
 * @param  {Object} layerJSON - layer's profile JSON
 * @return {maptalks.VectorLayer}
 * @static
 * @private
 * @function
 */
Z.VectorLayer._fromJSON = function (profile) {
    if (!profile || profile['type'] !== 'VectorLayer') { return null; }
    var layer = new Z.VectorLayer(profile['id'], profile['options']);
    var geoJSONs = profile['geometries'];
    var geometries = [],
        geo;
    for (var i = 0; i < geoJSONs.length; i++) {
        geo = Z.Geometry.fromJSON(geoJSONs[i]);
        if (geo) {
            geometries.push(geo);
        }
    }
    layer.addGeometry(geometries);
    if (profile['style']) {
        layer.setStyle(profile['style']);
    }
    return layer;
};
