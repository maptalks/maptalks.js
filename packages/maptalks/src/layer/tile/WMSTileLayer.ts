/* eslint-disable @typescript-eslint/ban-ts-comment */
import Browser from '../../core/Browser';
import { extend } from '../../core/util';
import { LayerJSONType } from '../Layer';
import TileLayer, { TileLayerOptionsType } from './TileLayer';

/**
 * @property options                     - TileLayer's options
 * @property [options.service=WMS]       - WMS Service
 * @property options.layers              - Comma-separated list of WMS layers to show.
 * @property [options.styles='']         - Comma-separated list of WMS styles.
 * @property [options.format=image/jpeg] - WMS image format (use `'image/png'` for layers with transparency).
 * @property [options.transparent=false] - Is the tile transparent
 * @property [options.version=1.1.1]     - Version of the WMS service to use
 * @property [options.crs=null]          - Coordinate Reference System to use for the WMS requests, defaults to map CRS. Don't change this if you're not sure what it means.
 * @property [options.uppercase=false]   - If `true`, WMS request parameter keys will be uppercase.
 * @property [options.detectRetina=false]   - If `true` and user is on a retina display, it will request four tiles of half the specified size and a bigger zoom level in place of one to utilize the high resolution.
 * @memberOf WMSTileLayer
 * @instance
 */
const options: WMSTileLayerOptionsType = {
    urlTemplate: '',
    crs: null,
    uppercase: false,
    detectRetina: false
};

const defaultWmsParams = {
    service: 'WMS',
    request: 'GetMap',
    layers: '',
    styles: '',
    format: 'image/jpeg',
    transparent: false,
    version: '1.1.1'
};
let wmsExcludeParams: WMSTileLayerOptionsType;

/**
 * @classdesc
 * Used to display [WMS]{https://en.wikipedia.org/wiki/Web_Map_Service} services as tile layers on the map. Extends [TileLayer]{@link TileLayer}.
 * Implemented based on Leaflet's TileLayer.WMS.
 * @category layer
 * @extends TileLayer
 * @param id - tile layer's id
 * @param - options defined in [WMSTileLayer]{@link TileLayer#options}
 * @example
 * var layer = new maptalks.WMSTileLayer('wms', {
 *     'urlTemplate' : 'https://demo.boundlessgeo.com/geoserver/ows',
 *     'crs' : 'EPSG:3857',
 *     'layers' : 'ne:ne',
 *     'styles' : '',
 *     'version' : '1.3.0',
 *     'format': 'image/png',
 *     'transparent' : true,
 *     'uppercase' : true
 * });
 */
class WMSTileLayer extends TileLayer {
    wmsParams: WMSTileLayerOptionsType;
    options: WMSTileLayerOptionsType;
    //@internal
    _wmsVersion: number;

    constructor(id: string, options: WMSTileLayerOptionsType) {
        super(id);
        if (!wmsExcludeParams) {
            wmsExcludeParams = extend({}, this.options);
        }
        this.wmsParams = extend({} as WMSTileLayerOptionsType, defaultWmsParams);
        this._setOptions(options);
        this.setZIndex(options.zIndex);
        if (!Browser.proxy) {
            this._optionsHook(options);
        }
    }

    //in Hook,Reset wmsParams
    //@internal
    _optionsHook(options = {}) {
        for (const p in options) {
            //clear tilesize cache
            if (p === 'tileSize') {
                this._tileSize = null;
            }
            if (!(p in wmsExcludeParams)) {
                this.wmsParams[p] = options[p];
            }
        }
        const tileSize = this.getTileSize();
        this.wmsParams.width = tileSize.width;
        this.wmsParams.height = tileSize.height;
        this._wmsVersion = parseFloat(this.wmsParams.version);
        return this;
    }

    onAdd() {
        const dpr = this.getMap().getDevicePixelRatio();
        const r = options.detectRetina ? dpr : 1;
        this.wmsParams.width *= r;
        this.wmsParams.height *= r;
        // @ts-ignore
        const crs = this.options.crs || this.getMap().getProjection().code;
        const projectionKey = this._wmsVersion >= 1.3 ? 'crs' : 'srs';
        this.wmsParams[projectionKey] = crs;
        super.onAdd();
    }

    getTileUrl(x: number, y: number, z: number): string {
        const res = this.getSpatialReference().getResolution(z),
            tileConfig = this._getTileConfig(),
            tileExtent = tileConfig.getTilePrjExtent(x, y, res);
        const max = tileExtent.getMax(),
            min = tileExtent.getMin();

        const bbox = (this._wmsVersion >= 1.3 && (this.wmsParams.crs === 'EPSG:4326' || this.wmsParams.crs === 'EPSG:4490') ?
            [min.y, min.x, max.y, max.x] :
            [min.x, min.y, max.x, max.y]).join(',');

        const url = super.getTileUrl(x, y, z);

        return url +
            // @ts-ignore
            getParamString(this.wmsParams, url, this.options.uppercase) +
            // @ts-ignore
            (this.options.uppercase ? '&BBOX=' : '&bbox=') + bbox;
    }

    /**
     * Export the WMSTileLayer's json. <br>
     * It can be used to reproduce the instance by [fromJSON]{@link Layer#fromJSON} method
     * @return layer's JSON
     */
    toJSON(): LayerJSONType {
        return {
            'type': 'WMSTileLayer',
            'id': this.getId(),
            'options': this.config()
        };
    }

    /**
     * Reproduce a WMSTileLayer from layer's JSON.
     * @param layerJSON - layer's JSON
     * @return a WMSTileLayer instance
     * @static
     * @private
     * @function
     */
    static fromJSON(layerJSON: { [x: string]: any; }): WMSTileLayer {
        if (!layerJSON || layerJSON['type'] !== 'WMSTileLayer') {
            return null;
        }
        return new WMSTileLayer(layerJSON['id'], layerJSON['options']);
    }
}

WMSTileLayer.registerJSONType('WMSTileLayer');

WMSTileLayer.mergeOptions(options);

export default WMSTileLayer;

// From Leaflet
// Converts an object into a parameter URL string, e.g. `{a: "foo", b: "bar"}`
// translates to `'?a=foo&b=bar'`. If `existingUrl` is set, the parameters will
// be appended at the end. If `uppercase` is `true`, the parameter names will
// be uppercased (e.g. `'?A=foo&B=bar'`)
export function getParamString(obj: Record<string, string>, existingUrl: string, uppercase: boolean) {
    const params = [];
    for (const i in obj) {
        params.push(encodeURIComponent(uppercase ? i.toUpperCase() : i) + '=' + encodeURIComponent(obj[i]));
    }
    return ((!existingUrl || existingUrl.indexOf('?') === -1) ? '?' : '&') + params.join('&');
}

export type WMSTileLayerOptionsType = TileLayerOptionsType & {
    service?: string;
    layers?: string;
    styles?: string;
    format?: string;
    transparent?: boolean;
    version?: string;
    crs?: string;
    uppercase?: boolean;
    detectRetina?: boolean;
    width?: number;
    height?: number;
}
