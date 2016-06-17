
/**
 * Represent CRS defined by [GeoJSON]{@link http://geojson.org/geojson-spec.html#coordinate-reference-system-objects}
 *
 * @class
 * @category geo
 * @param {String} type          - type of the CRS
 * @param {Object} properties    - CRS's properties
 */
Z.CRS = function (type, properties) {
    this.type = type;
    this.properties = properties;
};

/**
 * Create a [proj4]{@link https://github.com/OSGeo/proj.4} style CRS used by maptalks <br>
 * @example
 * {
 *     "type"       : "proj4",
 *     "properties" : {
 *         "proj"   : "+proj=longlat +datum=WGS84 +no_defs"
 *     }
 * }
 * var crs_wgs84 = maptalks.CRS.createProj4("+proj=longlat +datum=WGS84 +no_defs");
 * @static
 * @param  {String} proj - a proj4 projection string.
 * @return {maptalks.CRS}
 */
Z.CRS.createProj4 = function (proj) {
    return new Z.CRS('proj4', {
        'proj': proj
    });
};

//some common CRS definitions
/**
 * Predefined CRS of well-known WGS84 (aka EPSG:4326)
 * @type {maptalks.CRS}
 * @static
 * @constant
 */
Z.CRS.WGS84 = Z.CRS.createProj4('+proj=longlat +datum=WGS84 +no_defs');
/**
 * Alias for maptalks.CRS.WGS84
 * @type {maptalks.CRS}
 * @static
 * @constant
 */
Z.CRS.EPSG4326 = Z.CRS.WGS84;
/**
 * Projected Coordinate System used by google maps that has the following alias: 'EPSG:3785', 'GOOGLE', 'EPSG:900913'
 * @type {maptalks.CRS}
 * @static
 * @constant
 */
Z.CRS.EPSG3857 = Z.CRS.createProj4('+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs');
/**
 * A CRS represents a simple Cartesian coordinate system. <br>
 * Maps x, y directly, is useful for maps of flat surfaces (e.g. indoor maps, game maps).
 * @type {maptalks.CRS}
 * @static
 * @constant
 */
Z.CRS.IDENTITY = Z.CRS.createProj4('+proj=identity +no_defs');
/**
 * Official coordinate system in China (aka EPSG:4490), in most cases, it can be considered the same with WGS84.
 * @type {maptalks.CRS}
 * @see  {@link http://spatialreference.org/ref/sr-org/7408/}
 * @static
 * @constant
 */
Z.CRS.CGCS2000 = Z.CRS.createProj4('+proj=longlat +datum=CGCS2000');
/**
 * Alias for maptalks.CRS.CGCS2000
 * @type {maptalks.CRS}
 * @static
 * @constant
 */
Z.CRS.EPSG4490 = Z.CRS.CGCS2000;
/**
 * Projection used by [Baidu Map]{@link http://map.baidu.com}, a popular web map service in China.
 * @type {maptalks.CRS}
 * @static
 * @constant
 */
Z.CRS.BD09LL = Z.CRS.createProj4('+proj=longlat +datum=BD09');
/**
 * A encrypted CRS usded in the most online map services in China..
 * @type {maptalks.CRS}
 * @see {@link https://en.wikipedia.org/wiki/Restrictions_on_geographic_data_in_China}
 * @static
 * @constant
 */
Z.CRS.GCJ02 = Z.CRS.createProj4('+proj=longlat +datum=GCJ02');
