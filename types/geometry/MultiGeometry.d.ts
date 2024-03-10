import GeometryCollection from './GeometryCollection';
/**
 * The parent class for MultiPoint, MultiLineString and MultiPolygon
 * @category geometry
 * @abstract
 * @extends {GeometryCollection}
 */
declare class MultiGeometry extends GeometryCollection {
    GeometryType: any;
    /**
     * @param  {Class} geoType      Type of the geometry
     * @param  {String} type        type in String, e.g. "MultiPoint", "MultiLineString"
     * @param  {Geometry[]} data    data
     * @param  {Object} [options=null] configuration options
     */
    constructor(geoType: any, type: any, data: any, options: any);
    /**
     * Get coordinates of the collection
     * @return {Coordinate[]|Coordinate[][]|Coordinate[][][]} coordinates
     */
    getCoordinates(): any[];
    /**
     * Set new coordinates to the collection
     * @param {Coordinate[]|Coordinate[][]|Coordinate[][][]} coordinates
     * @returns {Geometry} this
     * @fires maptalk.Geometry#shapechange
     */
    setCoordinates(coordinates: any): this;
    _initData(data: any): void;
    _checkGeo(geo: any): boolean;
    _exportGeoJSONGeometry(): {
        type: string;
        coordinates: any;
    };
    _toJSON(options: any): {
        feature: object;
    };
}
export default MultiGeometry;
