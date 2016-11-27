/**
 * @classdesc
 * A layer for managing and rendering geometries.
 * @class
 * @category layer
 * @extends {maptalks.OverlayLayer}
 * @param {String|Number} id - layer's id
 * @param {maptalks.Geometry|maptalks.Geometry[]} [geometries=null] - geometries to add
 * @param {Object}  [options=null]          - construct options
 * @param {Object}  [options.style=null]    - vectorlayer's style
 * @param {*}  [options.*=null]             - options defined in [maptalks.VectorLayer]{@link maptalks.VectorLayer#options}
 */
maptalks.VectorLayer = maptalks.OverlayLayer.extend(/** @lends maptalks.VectorLayer.prototype */{
    /**
     * @property {Object}  options - VectorLayer's options
     * @property {Boolean} options.debug=false           - whether the geometries on the layer is in debug mode.
     * @property {Boolean} options.enableSimplify=true   - whether to simplify geometries before rendering.
     * @property {String}  options.cursor=default        - the cursor style of the layer
     * @property {Boolean} options.geometryEvents=true   - enable/disable firing geometry events
     * @property {Number}  options.thresholdOfTransforming=50 - threshold of geometry count to update while transforming.
     * @property {Boolean} options.defaultIconSize=[20, 20] - default size of a marker's icon
     * @property {Boolean} [options.cacheVectorOnCanvas=true] - whether to cache vector markers on a canvas, this will improve performance.
     */
    options:{
        'debug'                     : false,
        'enableSimplify'            : true,
        'cursor'                    : 'pointer',
        'geometryEvents'            : true,
        'thresholdOfTransforming'    : 150,
        'defaultIconSize'           : [20, 20],
        'cacheVectorOnCanvas'       : true,
        'cacheSvgOnCanvas'          : false
    },

    initialize:function (id, geometries, opts) {
        if (geometries && (!(geometries instanceof maptalks.Geometry) && !(maptalks.Util.isArray(geometries)))) {
            opts = geometries;
            geometries = null;
        }
        var options = maptalks.Util.extend({}, opts);
        if (options['style']) {
            this.setStyle(options['style']);
            delete options['style'];
        }
        maptalks.Layer.prototype.initialize.call(this, id, options);
        if (geometries) {
            this.addGeometry(geometries);
        }
    },

    /**
     * Gets layer's style.
     * @return {Object|Object[]} layer's style
     */
    getStyle: function () {
        if (!this._style) {
            return null;
        }
        return this._style;
    },

    /**
     * Sets style to the layer, styling the geometries satisfying the condition with style's symbol
     *
     * @param {Object|Object[]} style - layer's style
     * @returns {maptalks.VectorLayer} this
     * @fires maptalks.VectorLayer#setstyle
     * @example
     * layer.setStyle([
        {
          'filter': ['==', 'count', 100],
          'symbol': {'markerFile' : 'foo1.png'}
        },
        {
          'filter': ['==', 'count', 200],
          'symbol': {'markerFile' : 'foo2.png'}
        }
      ]);
     */
    setStyle: function (style) {
        this._style = style;
        this._cookedStyles = maptalks.Util.compileStyle(style);
        this.forEach(function (geometry) {
            this._styleGeometry(geometry);
        }, this);
        /**
         * setstyle event.
         *
         * @event maptalks.VectorLayer#setstyle
         * @type {Object}
         * @property {String} type - setstyle
         * @property {maptalks.VectorLayer} target - layer
         * @property {Object|Object[]}       style - style to set
         */
        this.fire('setstyle', {'style' : style});
        return this;
    },

    /**
     * Removes layers' style
     * @returns {maptalks.VectorLayer} this
     * @fires maptalks.VectorLayer#removestyle
     */
    removeStyle: function () {
        if (!this._style) {
            return this;
        }
        delete this._style;
        delete this._cookedStyles;
        this.forEach(function (geometry) {
            geometry._setExternSymbol(null);
        }, this);
        /**
         * removestyle event.
         *
         * @event maptalks.VectorLayer#removestyle
         * @type {Object}
         * @property {String} type - removestyle
         * @property {maptalks.VectorLayer} target - layer
         */
        this.fire('removestyle');
        return this;
    },

    onAddGeometry: function (geo) {
        var style = this.getStyle();
        if (style) {
            this._styleGeometry(geo);
        }
    },

    _styleGeometry: function (geometry) {
        if (!this._cookedStyles) {
            return false;
        }
        var g = maptalks.Util.getFilterFeature(geometry);
        for (var i = 0, len = this._cookedStyles.length; i < len; i++) {
            if (this._cookedStyles[i]['filter'](g) === true) {
                geometry._setExternSymbol(this._cookedStyles[i]['symbol']);
                return true;
            }
        }
        return false;
    },

    /**
     * Export the vector layer's profile json. <br>
     * @param  {Object} [options=null] - export options
     * @param  {Object} [options.geometries=null] - If not null and the layer is a [OverlayerLayer]{@link maptalks.OverlayLayer},
     *                                            the layer's geometries will be exported with the given "options.geometries" as a parameter of geometry's toJSON.
     * @param  {maptalks.Extent} [options.clipExtent=null] - if set, only the geometries intersectes with the extent will be exported.
     * @return {Object} layer's profile JSON
     */
    toJSON: function (options) {
        if (!options) {
            options = {};
        }
        var profile = {
            'type'    : 'VectorLayer',
            'id'      : this.getId(),
            'options' : this.config()
        };
        if ((maptalks.Util.isNil(options['style']) || options['style']) && this.getStyle()) {
            profile['style'] = this.getStyle();
        }
        if (maptalks.Util.isNil(options['geometries']) || options['geometries']) {
            var clipExtent;
            if (options['clipExtent']) {
                clipExtent = new maptalks.Extent(options['clipExtent']);
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
                    json['symbol'] = geometries[i]._symbolBeforeStyle ? maptalks.Util.extend({}, geometries[i]._symbolBeforeStyle) : null;
                }
                geoJSONs.push(json);
            }
            profile['geometries'] = geoJSONs;
        }
        return profile;
    }
});



/**
 * Reproduce a VectorLayer from layer's profile JSON.
 * @param  {Object} layerJSON - layer's profile JSON
 * @return {maptalks.VectorLayer}
 * @static
 * @private
 * @function
 */
maptalks.VectorLayer.fromJSON = function (profile) {
    if (!profile || profile['type'] !== 'VectorLayer') { return null; }
    var layer = new maptalks.VectorLayer(profile['id'], profile['options']);
    var geoJSONs = profile['geometries'];
    var geometries = [],
        geo;
    for (var i = 0; i < geoJSONs.length; i++) {
        geo = maptalks.Geometry.fromJSON(geoJSONs[i]);
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
