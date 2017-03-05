import { extend, isNil, isString, isInteger, hasOwn } from 'core/util';
import Coordinate from 'geo/Coordinate';
import Extent from 'geo/Extent';
import * as projections from 'geo/projection';
import Transformation from 'geo/transformation/Transformation';
import { Measurer } from 'geo/measurer';
import loadArcgis from './View.Arc';

const DefaultView = {
    'EPSG:3857': {
        'resolutions': (function () {
            var resolutions = [];
            var d = 2 * 6378137 * Math.PI;
            for (var i = 0; i < 21; i++) {
                resolutions[i] = d / (256 * Math.pow(2, i));
            }
            return resolutions;
        })(),
        'fullExtent': {
            'top': 6378137 * Math.PI,
            'left': -6378137 * Math.PI,
            'bottom': -6378137 * Math.PI,
            'right': 6378137 * Math.PI
        }
    },
    'EPSG:4326': {
        'fullExtent': {
            'top': 90,
            'left': -180,
            'bottom': -90,
            'right': 180
        },
        'resolutions': (function () {
            var resolutions = [];
            for (var i = 0; i < 21; i++) {
                resolutions[i] = 180 / (Math.pow(2, i) * 128);
            }
            return resolutions;
        })()
    },
    'BAIDU': {
        'resolutions': (function () {
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
        'fullExtent': {
            'top': 33554432,
            'left': -33554432,
            'bottom': -33554432,
            'right': 33554432
        }
    }
};

export default class View {
    constructor(options = {}) {
        this.options = options;
        this._initView();
    }

    _initView() {
        var projection = this.options['projection'];
        if (projection) {
            if (isString(projection)) {
                for (var p in projections) {
                    if (hasOwn(projections, p)) {
                        var regName = projections[p]['code'];
                        if (regName && regName.toLowerCase() === projection.toLowerCase()) {
                            projection = projections[p];
                            break;
                        }
                    }
                }
            }
        } else {
            projection = projections.DEFAULT;
        }
        if (!projection || isString(projection)) {
            throw new Error('must provide a valid projection in map\'s view.');
        }
        projection = extend({}, projection);
        if (!projection.measureLength) {
            extend(projection, Measurer.DEFAULT);
        }
        this._projection = projection;
        var defaultView,
            resolutions = this.options['resolutions'];
        if (!resolutions) {
            if (projection['code']) {
                defaultView = DefaultView[projection['code']];
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
                defaultView = DefaultView[projection['code']];
                if (defaultView) {
                    fullExtent = defaultView['fullExtent'];
                }
            }
            if (!fullExtent) {
                throw new Error('must provide a valid fullExtent in map\'s view.');
            }
        }
        if (!isNil(fullExtent['left'])) {
            this._fullExtent = new Extent(new Coordinate(fullExtent['left'], fullExtent['top']),
                new Coordinate(fullExtent['right'], fullExtent['bottom']));
        } else {
            //xmin, ymin, xmax, ymax
            this._fullExtent = new Extent(fullExtent);
            fullExtent['left'] = fullExtent['xmin'];
            fullExtent['right'] = fullExtent['xmax'];
            fullExtent['top'] = fullExtent['ymax'];
            fullExtent['bottom'] = fullExtent['ymin'];
        }

        //set left, right, top, bottom value
        extend(this._fullExtent, fullExtent);

        var a = fullExtent['right'] >= fullExtent['left'] ? 1 : -1,
            b = fullExtent['top'] >= fullExtent['bottom'] ? -1 : 1;
        this._transformation = new Transformation([a, b, 0, 0]);
    }

    getResolutions() {
        return this._resolutions || [];
    }

    getResolution(zoom) {
        var z = (zoom | 0);
        if (z < 0) {
            z = 0;
        } else if (z > this._resolutions.length - 1) {
            z = this._resolutions.length - 1;
        }
        var res = this._resolutions[z];
        if (!isInteger(zoom) && z !== this._resolutions.length - 1) {
            var next = this._resolutions[z + 1];
            return res + (next - res) * (zoom - z);
        }
        return res;
    }

    getProjection() {
        return this._projection;
    }

    getFullExtent() {
        return this._fullExtent;
    }

    getTransformation() {
        return this._transformation;
    }

    getMinZoom() {
        for (var i = 0; i < this._resolutions.length; i++) {
            if (!isNil(this._resolutions[i])) {
                return i;
            }
        }
        return 0;
    }

    getMaxZoom() {
        for (var i = this._resolutions.length - 1; i >= 0; i--) {
            if (!isNil(this._resolutions[i])) {
                return i;
            }
        }
        return this._resolutions.length - 1;
    }

}

View.loadArcgis = loadArcgis;
