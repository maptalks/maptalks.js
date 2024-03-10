import TileLayer, { TileLayerOptionsType } from './TileLayer';
export type WMSTileLayerOptionsType = TileLayerOptionsType & {
    service?: string;
    request?: string;
    layers?: string;
    styles?: string;
    format?: string;
    transparent?: boolean;
    version?: string;
};
/**
 * @classdesc
 * Used to display [WMS]{https://en.wikipedia.org/wiki/Web_Map_Service} services as tile layers on the map. Extends [TileLayer]{@link TileLayer}.
 * Implemented based on Leaflet's TileLayer.WMS.
 * @category layer
 * @extends TileLayer
 * @param {String|Number} id - tile layer's id
 * @param {Object} [options=null] - options defined in [WMSTileLayer]{@link TileLayer#options}
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
declare class WMSTileLayer extends TileLayer {
    wmsParams: object;
    _wmsVersion: number;
    constructor(id: any, options: WMSTileLayerOptionsType);
    _optionsHook(options?: {}): this;
    onAdd(): void;
    getTileUrl(x: any, y: any, z: any): string;
    /**
     * Export the WMSTileLayer's json. <br>
     * It can be used to reproduce the instance by [fromJSON]{@link Layer#fromJSON} method
     * @return {Object} layer's JSON
     */
    toJSON(): {
        type: string;
        id: string | number;
        options: {};
    };
    /**
     * Reproduce a WMSTileLayer from layer's JSON.
     * @param  {Object} layerJSON - layer's JSON
     * @return {WMSTileLayer}
     * @static
     * @private
     * @function
     */
    static fromJSON(layerJSON: any): WMSTileLayer;
}
export default WMSTileLayer;
export declare function getParamString(obj: any, existingUrl: any, uppercase: any): string;
