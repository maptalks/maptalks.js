import { Geometry } from './../../../geometry';
/**
 * @classdesc
 * Base class for all the symbolilzers
 * @class
 * @extends Class
 * @abstract
 * @private
 */
declare class Symbolizer {
    geometry: Geometry;
    painter: any;
    getMap(): import("src").Map;
    getPainter(): any;
    isDynamicSize(): boolean;
    /**
     * Test if the property is a property related with coloring
     * @param {String} prop - property name to test
     * @static
     * @function
     * @return {Boolean}
     * @memberof symbolizer.Symbolizer
     */
    static testColor(prop: any): boolean;
}
export default Symbolizer;
