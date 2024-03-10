/** @namespace measurer */
import Identity from './Identity';
export { Identity };
export * from './Sphere';
/**
 * Default measurer, [WGS84Sphere]{@link measurer.WGS84Sphere}
 *
 * @class
 * @category geo
 * @protected
 * @memberOf measurer
 * @name DEFAULT
 * @extends measurer.WGS84Sphere
 */
export declare const DEFAULT: object;
/**
 * @classdesc
 * Utilities with measurers. It is static and should not be initiated.<br>
 * Measurer provides methods for geographical computations such as length and area measuring, etc.
 * @class
 * @name Measurer
 * @memberOf measurer
 * @category geo
 */
export declare const Measurer: {
    /**
     * Get a measurer instance.
     * @param  {String} name - code of the measurer: 'EPSG:4326', 'Identity', 'BAIDU'
     * @return {Object} a measurer object
     * @function measurer.Measurer.getInstance
     */
    getInstance(name: any): any;
};
