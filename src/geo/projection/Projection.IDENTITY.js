/**
 * A projection based on Cartesian coordinate system.<br>
 * This projection maps x, y directly, it is useful for maps of flat surfaces (e.g. indoor maps, game maps).
 * @class
 * @category geo
 * @protected
 * @memberOf maptalks.projection
 * @name IDENTITY
 * @mixes maptalks.projection.Common
 * @mixes maptalks.measurer.Identity
 */
Z.projection.IDENTITY = Z.Util.extend({}, Z.projection.Common, /** @lends maptalks.projection.IDENTITY */{
    /**
     * "IDENTITY", Code of the projection, used by [View]{@link maptalks.View} to get projection instance.
     * @type {String}
     * @constant
     */
    code : "IDENTITY",
    project:function(p){
        return p.copy();
    },
    unproject:function(p){
        return p.copy();
    }
}, Z.measurer.Identity);
