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
maptalks.projection.EPSG4326 = maptalks.Util.extend({}, maptalks.projection.Common, /** @lends maptalks.projection.EPSG4326 */{
    /**
     * "EPSG:4326", Code of the projection, used by [View]{@link maptalks.View} to get projection instance.
     * @type {String}
     * @constant
     */
    code : 'EPSG:4326',
    project:function (p) {
        return new maptalks.Coordinate(p);
    },
    unproject:function (p) {
        return new maptalks.Coordinate(p);
    }
}, maptalks.measurer.WGS84Sphere);
