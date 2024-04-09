import { extend, isNil, hasOwn, sign, isString } from '../../core/util';
import Coordinate from '../../geo/Coordinate';
import Extent, { JsonExtent } from '../../geo/Extent';
import * as projections from '../../geo/projection';
import type { ProjectionType } from '../../geo/projection';
import Transformation from '../../geo/transformation/Transformation';
import { Measurer, DEFAULT } from '../../geo/measurer';
import loadWMTS from './SpatialReference.WMTS'
import loadArcgis from './SpatialReference.Arc'
const MAX_ZOOM = 23;

export type FullExtent = {
    top: number
    left: number
    bottom: number
    right: number
};

export type SpatialReferenceType = {
    projection: string | ProjectionType;
    resolutions?: number[]
    fullExtent?: FullExtent | JsonExtent;
}

const DefaultSpatialReference: Record<string, SpatialReferenceType> = {
    'EPSG:3857': {
        'projection': 'EPSG:3857',
        'resolutions': (function () {
            const resolutions = [];
            const d = 2 * 6378137 * Math.PI;
            for (let i = 0; i < MAX_ZOOM; i++) {
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
        'projection': 'EPSG:4326',
        'fullExtent': {
            'top': 90,
            'left': -180,
            'bottom': -90,
            'right': 180
        },
        'resolutions': (function () {
            const resolutions = [];
            for (let i = 0; i < MAX_ZOOM; i++) {
                resolutions[i] = 180 / (Math.pow(2, i) * 128);
            }
            return resolutions;
        })()
    },
    'BAIDU': {
        'projection': 'baidu',
        'resolutions': (function () {
            let res = Math.pow(2, 18);
            const resolutions = [];
            for (let i = 0; i < MAX_ZOOM; i++) {
                resolutions[i] = res;
                res *= 0.5;
            }
            return resolutions;
        })(),
        'fullExtent': {
            'top': 33554432,
            'left': -33554432,
            'bottom': -33554432,
            'right': 33554432
        }
    },
    'IDENTITY': {
        'projection': 'identity',
        'resolutions': (function () {
            let res = Math.pow(2, 8);
            const resolutions = [];
            for (let i = 0; i < MAX_ZOOM; i++) {
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
    },

    // TileSystem: [1, -1, -6378137 * Math.PI, 6378137 * Math.PI]
    'PRESET-VT-3857': {
        'projection': 'EPSG:3857',
        'resolutions': (function () {
            const resolutions = [];
            const d = 6378137 * Math.PI;
            for (let i = 0; i < MAX_ZOOM; i++) {
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

    'PRESET-VT-4326': {
        'projection': 'EPSG:4326',
        'fullExtent': {
            'top': 90,
            'left': -180,
            'bottom': -90,
            'right': 180
        },
        'resolutions': (function () {
            const resolutions = [];
            for (let i = 0; i < MAX_ZOOM; i++) {
                resolutions[i] = 180 / 4 / (Math.pow(2, i) * 128);
            }
            return resolutions;
        })()
    }
};

DefaultSpatialReference['EPSG:4490'] = DefaultSpatialReference['EPSG:4326'];
DefaultSpatialReference['PRESET-3857-512'] = DefaultSpatialReference['PRESET-VT-3857'];
DefaultSpatialReference['PRESET-4326-512'] = DefaultSpatialReference['PRESET-VT-4326'];
DefaultSpatialReference['PRESET-4490-512'] = DefaultSpatialReference['PRESET-VT-4326'];

/**
 * 空间参考类
 *
 * @english
 * SpatialReference Class
 */
export default class SpatialReference {
    options: SpatialReferenceType
    _projection: ProjectionType
    isEPSG: boolean
    _resolutions: number[]
    _pyramid: boolean
    _fullExtent: Extent;
    _transformation: Transformation
    json: SpatialReferenceType
    constructor(options: SpatialReferenceType = ({} as SpatialReferenceType)) {
        this.options = options;
        this._initSpatialRef();
    }

    static registerPreset(name: string, value: SpatialReferenceType) {
        name = name && name.toUpperCase();
        if (DefaultSpatialReference[name]) {
            console.warn(`Spatial reference ${name} already registered.`);
        }
        DefaultSpatialReference[name] = value;
    }

    static getPreset(preset: string) {
        return DefaultSpatialReference[preset.toUpperCase()];
    }

    static getAllPresets() {
        return Object.keys(DefaultSpatialReference);
    }

    static loadArcgis(url: string, cb: (_, spatialRef?) => void, options: any) {
        loadArcgis(url, cb, options)
        return this
    }

    static loadWMTS(url: string, cb: (_, spatialRef?) => void, options: any) {
        loadWMTS(url, cb, options)
        return this
    }


    /**
     * 获取投影类实例对象
     *
     * @english
     * get Projection Class instance
     * @param projection
     * @returns
     */
    static getProjectionInstance(projection?: string | ProjectionType) {
        let proj;
        if (!projection) {
            return null;
        }
        if (isString(projection)) {
            proj = {
                code: projection
            };
        } else {
            proj = projection;
        }
        // a custom one
        if (proj.project) {
            if (!proj.locate) {
                proj = extend({}, proj);
                if (proj.measure === 'identity') {
                    extend(proj, Measurer.getInstance('IDENTITY'));
                } else {
                    extend(proj, Measurer.getInstance('EPSG:4326'));
                }
            }
            return proj;
        }
        const prjName = (proj.code + '').toLowerCase();
        for (const p in projections) {
            if (hasOwn(projections, p)) {
                const names = projections[p].aliases || [];
                const code = projections[p]['code'];
                if (code) {
                    names.push(code);
                }
                for (let i = 0; i < names.length; i++) {
                    if (names[i].toLowerCase() === prjName) {
                        if (projections[p].create) {
                            const instance = projections[p].create(projection);
                            instance.code = names[i];
                            return instance;
                        } else {
                            if (projections[p].code === names[i]) {
                                return projections[p];
                            }
                            const instance = extend({}, projections[p]);
                            instance.code = names[i];
                            return instance;
                        }
                    }
                }
            }
        }
        return null;
    }

    static equals(sp1: SpatialReferenceType, sp2: SpatialReferenceType): boolean {
        if (isString(sp1) || isString(sp2)) {
            return sp1 === sp2;
        }
        if (!sp1 && !sp2) {
            return true;
        } else if (!sp1 || !sp2) {
            return false;
        }
        if (sp1.projection !== sp2.projection) {
            return false;
        }
        // 这里强制类型为 FullExtent，因为在创建时内部会主动赋值 top/left 等
        const f1 = sp1.fullExtent as FullExtent, f2 = sp2.fullExtent as FullExtent;
        if (f1 && !f2 || !f1 && f2) {
            return false;
        }
        if (f1 && f2) {
            if (f1.top !== f2.top || f1.bottom !== f2.bottom || f1.left !== f2.left || f1.right !== f2.right) {
                return false;
            }
        }
        const r1 = sp1.resolutions, r2 = sp2.resolutions;
        if (r1 && r2) {
            if (r1.length !== r2.length) {
                return false;
            }
            for (let i = 0; i < r1.length; i++) {
                if (r1[i] !== r2[i]) {
                    return false;
                }
            }
        } else if (r1 || r2) {
            return false;
        }
        return true;
    }

    _initSpatialRef() {
        let projection: ProjectionType;
        if (this.options['projection']) {
            projection = SpatialReference.getProjectionInstance(this.options['projection']);
        } else {
            projection = projections.DEFAULT;
        }
        if (!projection) {
            throw new Error('must provide a valid projection in map\'s spatial reference.');
        }
        projection = extend({}, projections.Common, projection);
        if (!(projection as any).measureLength) {
            extend(projection, DEFAULT);
        }
        this._projection = projection;
        let defaultSpatialRef,
            resolutions = this.options['resolutions'];
        if (!resolutions) {
            if (projection['code']) {
                defaultSpatialRef = DefaultSpatialReference[projection['code'].toUpperCase()];
                if (defaultSpatialRef) {
                    resolutions = defaultSpatialRef['resolutions'];
                    this.isEPSG = projection['code'] !== 'IDENTITY';
                }
            }
            if (!resolutions) {
                throw new Error('must provide valid resolutions in map\'s spatial reference.');
            }
        }
        this._resolutions = resolutions;
        this._pyramid = true;
        if (this._pyramid) {
            for (let i = 0; i < resolutions.length; i++) {
                if (resolutions[i] && resolutions[i - 1]) {
                    if (resolutions[i - 1] / resolutions[i] !== 2) {
                        this._pyramid = false;
                        break;
                    }
                }
            }
        }
        let fullExtent = this.options['fullExtent'];
        if (!fullExtent) {
            if (projection['code']) {
                defaultSpatialRef = DefaultSpatialReference[projection['code'].toUpperCase()];
                if (defaultSpatialRef) {
                    fullExtent = defaultSpatialRef['fullExtent'];
                }
            }
            if (!fullExtent) {
                throw new Error('must provide a valid fullExtent in map\'s spatial reference.');
            }
        }
        if (!isNil(fullExtent['left'])) {
            this._fullExtent = new Extent(
                new Coordinate(fullExtent['left'], fullExtent['top']),
                new Coordinate(fullExtent['right'], fullExtent['bottom'])
            );
        } else {
            this._fullExtent = new Extent(fullExtent as JsonExtent);
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

        (this._projection as any).fullExtent = fullExtent;

        const a = fullExtent['right'] >= fullExtent['left'] ? 1 : -1,
            b = fullExtent['top'] >= fullExtent['bottom'] ? -1 : 1;
        this._transformation = new Transformation([a, b, 0, 0]);
    }

    getResolutions() {
        return this._resolutions || [];
    }

    getResolution(zoom: number) {
        let z = (zoom | 0);
        if (z < 0) {
            z = 0;
        } else if (z > this._resolutions.length - 1) {
            z = this._resolutions.length - 1;
        }
        const res = this._resolutions[z];
        if (z !== zoom && zoom > 0 && z < this._resolutions.length - 1) {
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

    toJSON() {
        if (!this.json) {
            this.json = {
                'resolutions': this._resolutions,
                'fullExtent': {
                    'top': this._fullExtent.top,
                    'left': this._fullExtent.left,
                    'bottom': this._fullExtent.bottom,
                    'right': this._fullExtent.right
                },
                'projection': this._projection.code
            };
        }
        return this.json;
    }

    isPyramid() {
        return this._pyramid;
    }
}
