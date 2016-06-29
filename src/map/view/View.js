Z.View = function (options) {
    if (!options) {
        options = {};
    }
    this.options = options;
    this._initView();
};

Z.Util.extend(Z.View.prototype, {
    defaultView: {
        'EPSG:3857' : {
            'resolutions' : (function () {
                var resolutions = [];
                var d = 2 * 6378137 * Math.PI;
                for (var i = 0; i < 21; i++) {
                    resolutions[i] = d / (256 * Math.pow(2, i));
                }
                return resolutions;
            })(),
            'fullExtent': {
                'top'   : 6378137 * Math.PI,
                'left'  : -6378137 * Math.PI,
                'bottom': -6378137 * Math.PI,
                'right' : 6378137 * Math.PI
            }
        },
        'EPSG:4326' : {
            'fullExtent': {
                'top':90,
                'left':-180,
                'bottom':-90,
                'right':180
            },
            'resolutions' : (function () {
                var resolutions = [];
                for (var i = 0; i < 21; i++) {
                    resolutions[i] = 180 / (Math.pow(2, i) * 128);
                }
                return resolutions;
            })()
        },
        'BAIDU' : {
            'resolutions' : (function () {
                var res = Math.pow(2, 18);
                var resolutions = [];
                for (var i = 0; i < 20; i++) {
                    resolutions[i] = res;
                    res *= 0.5;
                }
                resolutions[0] = null;
                resolutions[1] = null;
                resolutions[2] = null;
                return resolutions;
            })(),
            'fullExtent' : {
                'top':33554432,
                'left':-33554432,
                'bottom':-33554432,
                'right':33554432
            }
        }

    },

    _initView : function () {
        var projection = this.options['projection'];
        if (projection) {
            if (Z.Util.isString(projection)) {
                for (var p in Z.projection) {
                    if (Z.projection.hasOwnProperty(p)) {
                        var regName = Z.projection[p]['code'];
                        if (regName && regName.toLowerCase() === projection.toLowerCase()) {
                            projection = Z.projection[p];
                            break;
                        }
                    }
                }
            }
        } else {
            projection = Z.projection.DEFAULT;
        }
        if (!projection || Z.Util.isString(projection)) {
            throw new Error('must provide a valid projection in map\'s view.');
        }
        projection = Z.Util.extend({}, Z.projection.Common, projection);
        if (!projection.measureLength) {
            Z.Util.extend(projection, Z.MeasurerUtil.DEFAULT);
        }
        this._projection = projection;
        var defaultView,
            resolutions = this.options['resolutions'];
        if (!resolutions) {
            if (projection['code']) {
                defaultView = this.defaultView[projection['code']];
                if (defaultView) {
                    resolutions = defaultView['resolutions'];
                }
            }
            if (!resolutions) {
                throw new Error('must provide valid resolutions in map\'s view.');
            }
        }
        this._resolutions = resolutions;
        var fullExtent = this.options['fullExtent'];
        if (!fullExtent) {
            if (projection['code']) {
                defaultView = this.defaultView[projection['code']];
                if (defaultView) {
                    fullExtent = defaultView['fullExtent'];
                }
            }
            if (!fullExtent) {
                throw new Error('must provide a valid fullExtent in map\'s view.');
            }
        }
        this._fullExtent = new Z.Extent(new Z.Coordinate(fullExtent['left'], fullExtent['top']),
                            new Z.Coordinate(fullExtent['right'], fullExtent['bottom']));
        //set left, right, top, bottom value
        Z.Util.extend(this._fullExtent, fullExtent);

        var a = fullExtent['right'] >= fullExtent['left'] ? 1 : -1,
            b = fullExtent['top'] >= fullExtent['bottom'] ? -1 : 1;
        this._transformation = new Z.Transformation([a, b, 0, 0]);
    },

    getResolutions:function () {
        return this._resolutions;
    },

    getResolution:function (z) {
        return this._resolutions[z];
    },

    getProjection:function () {
        return this._projection;
    },

    getFullExtent:function () {
        return this._fullExtent;
    },

    getTransformation:function () {
        return this._transformation;
    },

    getMinZoom:function () {
        for (var i = 0; i < this._resolutions.length; i++) {
            if (!Z.Util.isNil(this._resolutions[i])) {
                return i;
            }
        }
        return 0;
    },

    getMaxZoom:function () {
        for (var i = this._resolutions.length - 1; i >= 0; i--) {
            if (!Z.Util.isNil(this._resolutions[i])) {
                return i;
            }
        }
        return this._resolutions.length - 1;
    }

});

