/**
 * Represent CRS defined by [GeoJSON]{@link http://geojson.org/geojson-spec.html#coordinate-reference-system-objects}
 *
 * @category geo
 */
declare class CRS {
    type: string;
    properties: any;
    static WGS84: CRS;
    static EPSG4326: CRS;
    static EPSG3857: CRS;
    static IDENTITY: CRS;
    static CGCS2000: CRS;
    static EPSG4490: CRS;
    static BD09LL: CRS;
    static GCJ02: CRS;
    /**
     * @param {String} type          - type of the CRS
     * @param {Object} properties    - CRS's properties
     */
    constructor(type: any, properties: any);
    /**
     * Create a [proj4]{@link https://github.com/OSGeo/proj.4} style CRS used by maptalks <br>
     * @example
     * {
     *     "type"       : "proj4",
     *     "properties" : {
     *         "proj"   : "+proj=longlat +datum=WGS84 +no_defs"
     *     }
     * }
     * var crs_wgs84 = CRS.createProj4("+proj=longlat +datum=WGS84 +no_defs");
     * @param  {String} proj - a proj4 projection string.
     * @return {CRS}
     */
    static createProj4(proj: any): CRS;
    static fromProjectionCode(code: any): CRS;
}
export default CRS;
