/**
 * Represent CRS defined by [GeoJSON]{@link http://geojson.org/geojson-spec.html#coordinate-reference-system-objects}
 *
 * @category geo
 */
class CRS {

    /**
     * @param {String} type          - type of the CRS
     * @param {Object} properties    - CRS's properties
     */
    constructor(type, properties) {
        this.type = type;
        this.properties = properties;
    }

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
    static createProj4(proj) {
        return new CRS('proj4', {
            'proj': proj
        });
    }

    static fromProjectionCode(code) {
        if (!code) {
            return null;
        }
        code = code.toUpperCase().replace(':', '');
        return CRS[code] || null;
    }
}

// some common CRS definitions

/**
 * Predefined CRS of well-known WGS84 (aka EPSG:4326)
 * @type {CRS}
 * @constant
 */
CRS.WGS84 = CRS.createProj4('+proj=longlat +datum=WGS84 +no_defs');

/**
 * Alias for CRS.WGS84
 * @type {CRS}
 * @constant
 */
CRS.EPSG4326 = CRS.WGS84;

/**
 * Projected Coordinate System used by google maps that has the following alias: 'EPSG:3785', 'GOOGLE', 'EPSG:900913'
 * @type {CRS}
 * @constant
 */
CRS.EPSG3857 = CRS.createProj4('+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs');

/**
 * A CRS represents a simple Cartesian coordinate system. <br>
 * Maps x, y directly, is useful for maps of flat surfaces (e.g. indoor maps, game maps).
 * @type {CRS}
 * @constant
 */
CRS.IDENTITY = CRS.createProj4('+proj=identity +no_defs');

/**
 * Official coordinate system in China (aka EPSG:4490), in most cases, it can be considered the same with WGS84.
 * @type {CRS}
 * @see  {@link http://spatialreference.org/ref/sr-org/7408/}
 * @constant
 */
CRS.CGCS2000 = CRS.createProj4('+proj=longlat +datum=CGCS2000');

/**
 * Alias for CRS.CGCS2000
 * @type {CRS}
 * @constant
 */
CRS.EPSG4490 = CRS.CGCS2000;

/**
 * Projection used by [Baidu Map]{@link http://map.baidu.com}, a popular web map service in China.
 * @type {CRS}
 * @constant
 */
CRS.BD09LL = CRS.createProj4('+proj=longlat +datum=BD09');

/**
 * A encrypted CRS usded in the most online map services in China..
 * @type {CRS}
 * @see {@link https://en.wikipedia.org/wiki/Restrictions_on_geographic_data_in_China}
 * @constant
 */
CRS.GCJ02 = CRS.createProj4('+proj=longlat +datum=GCJ02');

export default CRS;
