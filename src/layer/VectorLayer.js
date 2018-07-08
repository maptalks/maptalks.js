import Browser from '../core/Browser';
import { isNil } from '../core/util';
import { getFilterFeature, compileStyle } from '@maptalks/feature-filter';
import Extent from '../geo/Extent';
import Geometry from '../geometry/Geometry';
import OverlayLayer from './OverlayLayer';

/**
 * @property {Object}  options - VectorLayer's options
 * @property {Boolean} options.debug=false           - whether the geometries on the layer is in debug mode.
 * @property {Boolean} options.enableSimplify=true   - whether to simplify geometries before rendering.
 * @property {String}  options.cursor=default        - the cursor style of the layer
 * @property {Boolean} options.geometryEvents=true   - enable/disable firing geometry events, disable it to improve performance.
 * @property {Boolean} options.defaultIconSize=[20,20] - default size of a marker's icon
 * @property {Boolean} [options.enableAltitude=false]  - whether to enable render geometry with altitude, false by default
 * @property {Boolean} [options.altitudeProperty=altitude] - geometry's altitude property name, if enableAltitude is true, "altitude" by default
 * @property {Boolean} [options.drawAltitude=false]  - whether to draw altitude: a vertical line for marker, a vertical polygon for line
 * @property {Boolean} [options.debug=false]         - whether the geometries on the layer is in debug mode.
 * @memberOf VectorLayer
 * @instance
 */
const options = {
    'debug': false,
    'enableSimplify': true,
    'geometryEvents': true,
    'defaultIconSize': [20, 20],
    'cacheVectorOnCanvas': true,
    'cacheSvgOnCanvas': Browser.gecko,
    'enableAltitude' : false,
    'altitudeProperty' : 'altitude',
    'drawAltitude' : false
};

/**
 * @classdesc
 * A layer for managing and rendering geometries.
 * @category layer
 * @extends OverlayLayer
 */
class VectorLayer extends OverlayLayer {

    /**
     * @param {String|Number} id - layer's id
     * @param {Geometry|Geometry[]} [geometries=null] - geometries to add
     * @param {Object}  [options=null]          - construct options
     * @param {Object}  [options.style=null]    - vectorlayer's style
     * @param {*}  [options.*=null]             - options defined in [VectorLayer]{@link VectorLayer#options}
     */
    constructor(id, geometries, options) {
        super(id, geometries, options);
        const style = this.options['style'];
        delete this.options['style'];
        if (style) {
            this.setStyle(style);
        }
    }

    /**
     * Gets layer's style.
     * @return {Object|Object[]} layer's style
     */
    getStyle() {
        if (!this._style) {
            return null;
        }
        return this._style;
    }

    /**
     * Sets style to the layer, styling the geometries satisfying the condition with style's symbol. <br>
     * Based on filter type in [mapbox-gl-js's style specification]{https://www.mapbox.com/mapbox-gl-js/style-spec/#types-filter}.
     * @param {Object|Object[]} style - layer's style
     * @returns {VectorLayer} this
     * @fires VectorLayer#setstyle
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
    setStyle(style) {
        this._style = style;
        this._cookedStyles = compileStyle(style);
        this.forEach(function (geometry) {
            this._styleGeometry(geometry);
        }, this);
        /**
         * setstyle event.
         *
         * @event VectorLayer#setstyle
         * @type {Object}
         * @property {String} type - setstyle
         * @property {VectorLayer} target - layer
         * @property {Object|Object[]}       style - style to set
         */
        this.fire('setstyle', {
            'style': style
        });
        return this;
    }

    /**
     * Removes layers' style
     * @returns {VectorLayer} this
     * @fires VectorLayer#removestyle
     */
    removeStyle() {
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
         * @event VectorLayer#removestyle
         * @type {Object}
         * @property {String} type - removestyle
         * @property {VectorLayer} target - layer
         */
        this.fire('removestyle');
        return this;
    }

    onAddGeometry(geo) {
        const style = this.getStyle();
        if (style) {
            this._styleGeometry(geo);
        }
    }

    onConfig(conf) {
        super.onConfig(conf);
        if (conf['enableAltitude'] || conf['drawAltitude'] || conf['altitudeProperty']) {
            const renderer = this.getRenderer();
            if (renderer && renderer.setToRedraw) {
                renderer.setToRedraw();
            }
        }
    }

    _styleGeometry(geometry) {
        if (!this._cookedStyles) {
            return false;
        }
        const g = getFilterFeature(geometry);
        for (let i = 0, len = this._cookedStyles.length; i < len; i++) {
            if (this._cookedStyles[i]['filter'](g) === true) {
                geometry._setExternSymbol(this._cookedStyles[i]['symbol']);
                return true;
            }
        }
        return false;
    }

    identify(coordinate, options = {}) {
        const renderer = this.getRenderer();
        // only iterate drawn geometries when onlyVisible is true.
        if (options['onlyVisible'] && renderer && renderer.identify) {
            return renderer.identify(coordinate, options);
        }
        return super.identify(coordinate, options);
    }

    /**
     * Export the VectorLayer's JSON. <br>
     * @param  {Object} [options=null] - export options
     * @param  {Object} [options.geometries=null] - If not null and the layer is a [OverlayerLayer]{@link OverlayLayer},
     *                                            the layer's geometries will be exported with the given "options.geometries" as a parameter of geometry's toJSON.
     * @param  {Extent} [options.clipExtent=null] - if set, only the geometries intersectes with the extent will be exported.
     * @return {Object} layer's JSON
     */
    toJSON(options) {
        if (!options) {
            options = {};
        }
        const profile = {
            'type': this.getJSONType(),
            'id': this.getId(),
            'options': this.config()
        };
        if ((isNil(options['style']) || options['style']) && this.getStyle()) {
            profile['style'] = this.getStyle();
        }
        if (isNil(options['geometries']) || options['geometries']) {
            let clipExtent;
            if (options['clipExtent']) {
                const map = this.getMap();
                const projection = map ? map.getProjection() : null;
                clipExtent = new Extent(options['clipExtent'], projection);
            }
            const geoJSONs = [];
            const geometries = this.getGeometries();
            for (let i = 0, len = geometries.length; i < len; i++) {
                const geo = geometries[i];
                const geoExt = geo.getExtent();
                if (!geoExt || (clipExtent && !clipExtent.intersects(geoExt))) {
                    continue;
                }
                const json = geo.toJSON(options['geometries']);
                geoJSONs.push(json);
            }
            profile['geometries'] = geoJSONs;
        }
        return profile;
    }

    /**
     * Reproduce a VectorLayer from layer's JSON.
     * @param  {Object} layerJSON - layer's JSON
     * @return {VectorLayer}
     * @static
     * @private
     * @function
     */
    static fromJSON(json) {
        if (!json || json['type'] !== 'VectorLayer') {
            return null;
        }
        const layer = new VectorLayer(json['id'], json['options']);
        const geoJSONs = json['geometries'];
        const geometries = [];
        for (let i = 0; i < geoJSONs.length; i++) {
            const geo = Geometry.fromJSON(geoJSONs[i]);
            if (geo) {
                geometries.push(geo);
            }
        }
        layer.addGeometry(geometries);
        if (json['style']) {
            layer.setStyle(json['style']);
        }
        return layer;
    }
}

VectorLayer.mergeOptions(options);

VectorLayer.registerJSONType('VectorLayer');

export default VectorLayer;
