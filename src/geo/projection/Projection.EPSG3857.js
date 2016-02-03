Z.Projection.EPSG3857 = Z.Util.extend({}, Z.Projection.Common, {
    code : "EPSG:3857",
    rad : Math.PI / 180,
    metersPerDegree : 2.003750834E7/180,
    maxLatitude : 85.0511287798,

    project: function(lnglat) {
       var rad = this.rad,
            metersPerDegree = this.metersPerDegree,
            max = this.maxLatitude;
        var lng = lnglat.x, lat = Math.max(Math.min(max, lnglat.y), -max);
        var c;
        if (lat === 0) {
            c = 0;
        } else {
            c = Math.log(Math.tan((90 + lat) * rad / 2)) / rad;
        }
        return new Z.Coordinate( lng * metersPerDegree, c * metersPerDegree);
    },

    unproject: function(pLnglat) {
        var x = pLnglat.x,
            y = pLnglat.y;
        var rad = this.rad,
            metersPerDegree = this.metersPerDegree;
        var c;
        if (y === 0) {
            c = 0;
        } else {
            c = y / metersPerDegree;
            c = (2 * Math.atan(Math.exp(c * rad)) - Math.PI / 2)/rad;
        }
        return new Z.Coordinate(x / metersPerDegree, c);
    }
}, Z.measurer.WGS84Sphere);

Z.Projection.DEFAULT = Z.Projection.EPSG3857;
