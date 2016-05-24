/**
 * @namespace
 */
Z.measurer = {};

/**
 * Utilities with measurers.<br>
 * Measurer is a object containing methods for geographical computations such as length and area measuring, etc.
 * @class
 * @category geo
 * @protected
 */
Z.MeasurerUtil = {
    /**
     * Get a measurer instance.
     * @param  {String} name - code of the measurer: 'EPSG:4326', 'Identity', 'BAIDU'
     * @return {Object} a measurer object
     */
    getInstance:function (name) {
        if (!name) {
            return Z.MeasurerUtil.DEFAULT;
        }
        for (var p in Z.measurer) {
            if (Z.measurer.hasOwnProperty(p)) {
                var mName = Z.measurer[p]['measure'];
                if (!mName) {
                    continue;
                }
                if (name.toLowerCase() === mName.toLowerCase()) {
                    return Z.measurer[p];
                }
            }
        }
        return null;
    },

    /**
     * The default measurer: WGS84Sphere
     * @type {Object}
     */
    DEFAULT: Z.measurer.WGS84Sphere
};
