import { extend } from '../../core/util';
import TileLayer from './TileLayer';
import { getParamString } from './WMSTileLayer';

/**
 * @property {Object}              options                     - TileLayer's options
 * @property {String}              [options.service=WMTS]      - WMTS Service
 * @property {String}              options.layer               - WMTS layer to show.
 * @property {String}              [options.styles='']         - Comma-separated list of WMTS styles.
 * @property {String}              [options.format=image/jpeg] - WMTS image format (use `'image/png'` for layers with transparency).
 * @property {String}              [options.version=1.0.0]     - size of the tile image
 * @property {Boolean}             [options.uppercase=false]   - If `true`, WMTS request parameter keys will be uppercase.
 * @memberOf WMTSTileLayer
 * @instance
 */
const options = {
    uppercase: false
};

const defaultWmtsParams = {
    service: 'WMTS',
    request: 'GetTile',
    layer: '',
    tilematrixset: '',
    format: 'image/png',
    version: '1.0.0'
};

/**
 * @classdesc
 * Used to display [WMTS]{https://en.wikipedia.org/wiki/Web_Map_Tile_Service} services as tile layers on the map. Extends [TileLayer]{@link TileLayer}.
 * Implemented based on WMTSTileLayer.
 * @category layer
 * @extends TileLayer
 * @param {String|Number} id - tile layer's id
 * @param {Object} [options=null] - options defined in [WMTSTileLayer]{@link TileLayer#options}
 * @example
 *
 * var layer = new maptalks.WMTSTileLayer('road', {
 *   layer:'cva',
 *   tilematrixset:'c',
 *   format:'tiles',
 *   urlTemplate:'http://t{s}.tianditu.com/cva_c/wmts',
 *   subdomains:['1', '2', '3', '4', '5'],
 *   opacity:1
 * })
 */
class WMTSTileLayer extends TileLayer {

    constructor(id, options) {
        super(id);
        const wmtsParams = extend({}, defaultWmtsParams);
        for (const p in options) {
            if (!(p in this.options)) {
                wmtsParams[p] = options[p];
            }
        }
        const url = options.urlTemplate;
        options.urlTemplate = url + getParamString(wmtsParams, url, this.options.uppercase) + '&tileMatrix={z}&tileRow={y}&tileCol={x}';
        this.setOptions(options);
        this.setZIndex(options.zIndex);
    }

    /**
     * Export the WMTSTileLayer's json. <br>
     * It can be used to reproduce the instance by [fromJSON]{@link Layer#fromJSON} method
     * @return {Object} layer's JSON
     */
    toJSON() {
        return {
            'type': 'WMTSTileLayer',
            'id': this.getId(),
            'options': this.config()
        };
    }

    /**
     * Reproduce a WMTSTileLayer from layer's JSON.
     * @param  {Object} layerJSON - layer's JSON
     * @return {WMTSTileLayer}
     * @static
     * @private
     * @function
     */
    static fromJSON(layerJSON) {
        if (!layerJSON || layerJSON['type'] !== 'WMTSTileLayer') {
            return null;
        }
        return new WMTSTileLayer(layerJSON['id'], layerJSON['options']);
    }
}

WMTSTileLayer.registerJSONType('WMTSTileLayer');

WMTSTileLayer.mergeOptions(options);

export default WMTSTileLayer;

