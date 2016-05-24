/**
 * A common CRS among GIS enthusiasts. Uses simple Equirectangular projection.
 *
 * @class
 * @category geo
 * @protected
 * @memberOf maptalks.projection
 * @name EPSG4326
 * @mixes maptalks.projection.Common
 * @mixes maptalks.measurer.WGS84Sphere
 */
Z.projection.EPSG4326 = Z.Util.extend({}, Z.projection.Common, /** @lends maptalks.projection.EPSG4326 */{
    /**
     * "EPSG:4326", Code of the projection, used by [View]{@link maptalks.View} to get projection instance.
     * @type {String}
     * @constant
     */
    code : 'EPSG:4326',
    project:function (p) {
        return new Z.Coordinate(p.x, p.y);
    },
    unproject:function (p) {
        return new Z.Coordinate(p.x, p.y);
    }
}, Z.measurer.WGS84Sphere);
