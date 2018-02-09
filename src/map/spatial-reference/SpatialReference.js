import { extend, isNil, isObject, isInteger, hasOwn, sign } from '../../core/util';
import Coordinate from '../../geo/Coordinate';
import Extent from '../../geo/Extent';
import * as projections from '../../geo/projection';
import Transformation from '../../geo/transformation/Transformation';
import { Measurer } from '../../geo/measurer';

const DefaultSpatialRef = {
    'EPSG:3857': {
        'resolutions': (function () {
            const resolutions = [];
            const d = 2 * 6378137 * Math.PI;
            for (let i = 0; i < 21; i++) {
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
            const resolutions = [];
            for (let i = 0; i < 20; i++) {
                resolutions[i] = 180 / (Math.pow(2, i) * 128);
            }
            return resolutions;
        })()
    },
    'BAIDU': {
        'resolutions': (function () {
            let res = Math.pow(2, 18);
            const resolutions = [];
            for (let i = 0; i < 20; i++) {
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
    },
    'IDENTITY' : {
        'resolutions': (function () {
            let res = Math.pow(2, 8);
            const resolutions = [];
            for (let i = 0; i < 18; i++) {
                resolutions[i] = res;
                res *= 0.5;
            }
            return resolutions;
        })(),
        'fullExtent': {
            'top': 200000,
            'left': -200000,
            'bottom': -200000,
            'right': 200000
        }
    }
};

DefaultSpatialRef['EPSG:4490'] = DefaultSpatialRef['EPSG:4326'];

export default class SpatialReference {
    constructor(options = {}) {
        this.options = options;
        this._initSpatialRef();
    }

    static getProjectionInstance(prjName) {
        if (!prjName) {
            return null;
        }
        if (isObject(prjName)) {
            return prjName;
        }
        prjName = (prjName + '').toLowerCase();
        for (const p in projections) {
            if (hasOwn(projections, p)) {
                const code = projections[p]['code'];
                if (code && code.toLowerCase() === prjName) {
                    return projections[p];
                }
            }
        }
        return null;
    }

    _initSpatialRef() {
        let projection = this.options['projection'];
        if (projection) {
            projection = SpatialReference.getProjectionInstance(projection);
        } else {
            projection = projections.DEFAULT;
        }
        if (!projection) {
            throw new Error('must provide a valid projection in map\'s spatial reference.');
        }
        projection = extend({}, projections.Common, projection);
        if (!projection.measureLength) {
            extend(projection, Measurer.DEFAULT);
        }
        this._projection = projection;
        let defaultSpatialRef,
            resolutions = this.options['resolutions'];
        if (!resolutions) {
            if (projection['code']) {
                defaultSpatialRef = DefaultSpatialRef[projection['code']];
                if (defaultSpatialRef) {
                    resolutions = defaultSpatialRef['resolutions'];
                }
            }
            if (!resolutions) {
                throw new Error('must provide valid resolutions in map\'s spatial reference.');
            }
        }
        this._resolutions = resolutions;
        let fullExtent = this.options['fullExtent'];
        if (!fullExtent) {
            if (projection['code']) {
                defaultSpatialRef = DefaultSpatialRef[projection['code']];
                if (defaultSpatialRef) {
                    fullExtent = defaultSpatialRef['fullExtent'];
                }
            }
            if (!fullExtent) {
                throw new Error('must provide a valid fullExtent in map\'s spatial reference.');
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

        if (isNil(fullExtent['top']) || isNil(fullExtent['bottom']) || isNil(fullExtent['left']) || isNil(fullExtent['right'])) {
            throw new Error('must provide valid top/bottom/left/right in fullExtent.');
        }

        //set left, right, top, bottom value
        extend(this._fullExtent, fullExtent);

        this._projection.fullExtent = fullExtent;

        const a = fullExtent['right'] >= fullExtent['left'] ? 1 : -1,
            b = fullExtent['top'] >= fullExtent['bottom'] ? -1 : 1;
        this._transformation = new Transformation([a, b, 0, 0]);
    }

    getResolutions() {
        return this._resolutions || [];
    }

    getResolution(zoom) {
        let z = (zoom | 0);
        if (z < 0) {
            z = 0;
        } else if (z > this._resolutions.length - 1) {
            z = this._resolutions.length - 1;
        }
        const res = this._resolutions[z];
        if (!isInteger(zoom) && z !== this._resolutions.length - 1) {
            const next = this._resolutions[z + 1];
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
        for (let i = 0; i < this._resolutions.length; i++) {
            if (!isNil(this._resolutions[i])) {
                return i;
            }
        }
        return 0;
    }

    getMaxZoom() {
        for (let i = this._resolutions.length - 1; i >= 0; i--) {
            if (!isNil(this._resolutions[i])) {
                return i;
            }
        }
        return this._resolutions.length - 1;
    }

    getZoomDirection() {
        return sign(this._resolutions[this.getMinZoom()] - this._resolutions[this.getMaxZoom()]);
    }
}
