import Browser from '../core/Browser';
import { isNil } from '../core/util';
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
 * @property {Number} [options.altitude=0]           - layer altitude
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
    'enableAltitude': false,
    'altitudeProperty': 'altitude',
    'drawAltitude': false,
    'altitude': 0
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


    identify(coordinate, options = {}) {
        const renderer = this.getRenderer();
        // only iterate drawn geometries when onlyVisible is true.
        if (options['onlyVisible'] && renderer && renderer.identify) {
            return renderer.identify(coordinate, options);
        }
        return super.identify(coordinate, options);
    }

    getAltitude() {
        return this.options['altitude'];
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
