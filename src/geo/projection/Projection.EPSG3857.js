/**
 * Well-known projection used by Google maps or Open Street Maps, aka Mercator Projection.<br>
 * It is map's default projection.
 * @class
 * @category geo
 * @protected
 * @memberOf maptalks.projection
 * @name EPSG3857
 * @mixes maptalks.projection.Common
 * @mixes maptalks.measurer.WGS84Sphere
 */
maptalks.projection.EPSG3857 = maptalks.Util.extend({}, maptalks.projection.Common, /** @lends maptalks.projection.EPSG3857 */{
    /**
     * "EPSG:3857", Code of the projection, used by [View]{@link maptalks.View} to get projection instance.
     * @type {String}
     * @constant
     */
    code : 'EPSG:3857',
    rad : Math.PI / 180,
    metersPerDegree : 2.003750834E7 / 180,
    maxLatitude : 85.0511287798,

    project: function (lnglat) {
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
        return new maptalks.Coordinate(lng * metersPerDegree, c * metersPerDegree);
    },

    unproject: function (pLnglat) {
        var x = pLnglat.x,
            y = pLnglat.y;
        var rad = this.rad,
            metersPerDegree = this.metersPerDegree;
        var c;
        if (y === 0) {
            c = 0;
        } else {
            c = y / metersPerDegree;
            c = (2 * Math.atan(Math.exp(c * rad)) - Math.PI / 2) / rad;
        }
        return new maptalks.Coordinate(x / metersPerDegree, c);
    }
}, maptalks.measurer.WGS84Sphere);

maptalks.projection.DEFAULT = maptalks.projection.EPSG3857;
