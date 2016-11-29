/**
 * @namespace
 * @protected
 */
maptalks.measurer = {};

/**
 * Utilities with measurers.<br>
 * Measurer is a object containing methods for geographical computations such as length and area measuring, etc.
 * @class
 * @category geo
 * @protected
 */
maptalks.MeasurerUtil = {
    /**
     * Get a measurer instance.
     * @param  {String} name - code of the measurer: 'EPSG:4326', 'Identity', 'BAIDU'
     * @return {Object} a measurer object
     */
    getInstance:function (name) {
        if (!name) {
            return maptalks.MeasurerUtil.DEFAULT;
        }
        for (var p in maptalks.measurer) {
            if (maptalks.measurer.hasOwnProperty(p)) {
                var mName = maptalks.measurer[p]['measure'];
                if (!mName) {
                    continue;
                }
                if (name.toLowerCase() === mName.toLowerCase()) {
                    return maptalks.measurer[p];
                }
            }
        }
        return null;
    },

    /**
     * Whether the measurer is based on earth sphere
     * @param  {Object}  measurer
     * @return {Boolean}
     */
    isSphere: function (measurer) {
        return !maptalks.Util.isNil(measurer.sphere);
    },

    /**
     * The default measurer: WGS84Sphere
     * @type {Object}
     */
    DEFAULT: maptalks.measurer.WGS84Sphere
};
