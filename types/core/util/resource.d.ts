/**
 * Translate symbol properties to SVG properties
 * @param  {Object} s - object with symbol properties
 * @return {Object}   object with SVG properties
 * @memberOf Util
 */
export declare function translateToSVGStyles(s: any): {
    stroke: {
        stroke: any;
        'stroke-width': any;
        'stroke-opacity': any;
        'stroke-dasharray': any;
        'stroke-linecap': string;
        'stroke-linejoin': string;
    };
    fill: {
        fill: any;
        'fill-opacity': any;
    };
};
/**
 * Get SVG Base64 String from a marker symbol with (markerType : path)
 * @param  {Object} symbol - symbol with markerType of path
 * @return {String}        SVG Base64 String
 * @memberOf Util
 */
export declare function getMarkerPathBase64(symbol: any, width?: number, height?: number): string;
/**
 * Get external resources from the given symbol
 * @param  {Object} symbol      - symbol
 * @param  {Boolean} toAbsolute - whether convert url to aboslute
 * @return {String[]}           - resource urls
 * @memberOf Util
 */
export declare function getExternalResources(symbol: any, toAbsolute?: any): any[];
/**
 * Convert symbol's resources' urls from relative path to an absolute path.
 * @param  {Object} symbol
 * @private
 * @memberOf Util
 */
export declare function convertResourceUrl(symbol: any): any;
