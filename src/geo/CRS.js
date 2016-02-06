
/**
 * GeoJSON CRS
 * @{@link http://geojson.org/geojson-spec.html#coordinate-reference-system-objects}
 * @param {[type]} name       [description]
 * @param {[type]} properties [description]
 */
Z.CRS = function(type, properties) {
    this.type=type;
    this.properties = properties;
};

Z.CRS.createStandard = function(name) {
    return new Z.CRS('name', {
        'name': name
    });
};

Z.CRS.createProj4 = function(proj) {
    return new Z.CRS('proj4', {
        'proj': proj
    });
};

//some common CRS definitions
Z.CRS.WGS84 = Z.CRS.createProj4("+proj=longlat +datum=WGS84 +no_defs");
Z.CRS.EPSG4326 = Z.CRS.WGS84;
Z.CRS.EPSG3857 = Z.CRS.createProj4("+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs");
Z.CRS.IDENTITY = Z.CRS.createProj4("+proj=identity");
//official coordinate system in China, in most cases, it can be considered same with wgs84
//http://spatialreference.org/ref/sr-org/7408/
Z.CRS.CGCS2000 = Z.CRS.createProj4("+proj=longlat +datum=CGCS2000");
//crs usded in Chinese map services due to the coordinate encryption.
//https://en.wikipedia.org/wiki/Restrictions_on_geographic_data_in_China
Z.CRS.BD09LL = Z.CRS.createProj4("+proj=longlat +datum=BD09");
Z.CRS.GCJ02 = Z.CRS.createProj4("+proj=longlat +datum=GCJ02");
