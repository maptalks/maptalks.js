/**
 * Whether the color is a gradient
 * @param  {Object}  g - color to test
 * @return {Boolean}
 * @memberOf Util
 */
export declare function isGradient(g: any): any;
/**
 * Get stamp of a gradient color object.
 * @param  {Object} g gradient color object
 * @return {String}     gradient stamp
 * @memberOf Util
 */
export declare function getGradientStamp(g: any): string;
export declare function getSymbolStamp(symbol: any, prefix: any): string | number;
/**
 * Get stamp of a symbol
 * @param  {Object|Object[]} symbol symbol
 * @return {String}        symbol's stamp
 * @memberOf Util
 */
export declare function getSymbolHash(symbol: any, prefix?: any): string | number;
/**
 * Reduce opacity of the color by ratio
 * @param  {Object|Object[]} symbol symbols to set
 * @param  {Number} ratio  ratio of opacity to reduce
 * @return {Object|Object[]}      new symbol or symbols
 * @memberOf Util
 */
export declare function lowerSymbolOpacity(symbol: any, ratio: any): any;
/**
 * Merges the properties of sources into the symbol. <br>
 * @param  {Object|Object[]} symbol symbol to extend
 * @param  {...Object} src - sources
 * @return {Object|Object[]}        merged symbol
 * @memberOf Util
 */
export declare function extendSymbol(symbol: any): any;
export declare function parseStyleRootPath(style: any): any;
export declare function convertStylePath(styles: any, replacer: any): void;
export declare function parseSymbolPath(symbol: any, replacer: any): void;
/**
 * geometry symbol has lineDasharray
 * @memberOf Util
 */
export declare function isDashLine(symbolizers?: any[]): boolean;
