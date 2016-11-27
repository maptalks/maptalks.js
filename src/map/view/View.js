maptalks.View = function (options) {
    if (!options) {
        options = {};
    }
    this.options = options;
    this._initView();
};

maptalks.Util.extend(maptalks.View.prototype, {
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
            if (maptalks.Util.isString(projection)) {
                for (var p in maptalks.projection) {
                    if (maptalks.projection.hasOwnProperty(p)) {
                        var regName = maptalks.projection[p]['code'];
                        if (regName && regName.toLowerCase() === projection.toLowerCase()) {
                            projection = maptalks.projection[p];
                            break;
                        }
                    }
                }
            }
        } else {
            projection = maptalks.projection.DEFAULT;
        }
        if (!projection || maptalks.Util.isString(projection)) {
            throw new Error('must provide a valid projection in map\'s view.');
        }
        projection = maptalks.Util.extend({}, maptalks.projection.Common, projection);
        if (!projection.measureLength) {
            maptalks.Util.extend(projection, maptalks.MeasurerUtil.DEFAULT);
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
        if (!maptalks.Util.isNil(fullExtent['left'])) {
            this._fullExtent = new maptalks.Extent(new maptalks.Coordinate(fullExtent['left'], fullExtent['top']),
                            new maptalks.Coordinate(fullExtent['right'], fullExtent['bottom']));
        } else {
            //xmin, ymin, xmax, ymax
            this._fullExtent = new maptalks.Extent(fullExtent);
            fullExtent['left'] = fullExtent['xmin'];
            fullExtent['right'] = fullExtent['xmax'];
            fullExtent['top'] = fullExtent['ymax'];
            fullExtent['bottom'] = fullExtent['ymin'];
        }

        //set left, right, top, bottom value
        maptalks.Util.extend(this._fullExtent, fullExtent);

        var a = fullExtent['right'] >= fullExtent['left'] ? 1 : -1,
            b = fullExtent['top'] >= fullExtent['bottom'] ? -1 : 1;
        this._transformation = new maptalks.Transformation([a, b, 0, 0]);
    },

    getResolutions:function () {
        return this._resolutions;
    },

    getResolution:function (z) {
        if (z < 0) {
            z = 0;
        } else if (z > this._resolutions.length - 1) {
            z = this._resolutions.length - 1;
        }
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
            if (!maptalks.Util.isNil(this._resolutions[i])) {
                return i;
            }
        }
        return 0;
    },

    getMaxZoom:function () {
        for (var i = this._resolutions.length - 1; i >= 0; i--) {
            if (!maptalks.Util.isNil(this._resolutions[i])) {
                return i;
            }
        }
        return this._resolutions.length - 1;
    }

});

