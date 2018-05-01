
const merge = require('./../utils/merge'),
    isNode = require('./../utils/isNode'),
    GLConstants = require('./GLConstants');
/**
 * store mapping data and default value
 */
const _polyfill = {};
/**
 * source poly
 */
const _poly = {
    'MAX_VIEWPORT_DIMS': {
        name: 'MAX_VIEWPORT_DIMS',
        key: GLConstants.MAX_VIEWPORT_DIMS,
        webgl: new Float32Array([32767, 32767]),
        webgl2: new Float32Array([32767, 32767]),
    },
    'ALIASED_POINT_SIZE_RANGE': {
        name: 'ALIASED_POINT_SIZE_RANGE',
        key: GLConstants.ALIASED_POINT_SIZE_RANGE,
        webgl: new Float32Array([1, 1024]),
        webgl2: new Float32Array([1, 1024]),
    },
    'ALIASED_LINE_WIDTH_RANGE': {
        name: 'ALIASED_LINE_WIDTH_RANGE',
        key: GLConstants.ALIASED_LINE_WIDTH_RANGE,
        webgl: new Float32Array([1, 1]),
        webgl2: new Float32Array([1, 1]),
    },
    'MAX_VERTEX_UNIFORM_VECTORS': {
        name: 'MAX_VERTEX_UNIFORM_VECTORS',
        key: GLConstants.MAX_VERTEX_UNIFORM_VECTORS,
        webgl: 128,
        webgl2: 128,
    },
    'MAX_VERTEX_TEXTURE_IMAGE_UNITS': {
        name: 'MAX_VERTEX_TEXTURE_IMAGE_UNITS',
        key: GLConstants.MAX_VERTEX_TEXTURE_IMAGE_UNITS,
        webgl: 0,
        webgl2: 0,
    },
    'MAX_VERTEX_ATTRIBS': {
        name: 'MAX_VERTEX_ATTRIBS',
        key: GLConstants.MAX_VERTEX_ATTRIBS,
        webgl: 8,
        webgl2: 8,
    },
    'MAX_VARYING_VECTORS': {
        name: 'MAX_VARYING_VECTORS',
        key: GLConstants.MAX_VARYING_VECTORS,
        webgl: 8,
        webgl2: 8,
    },
    'MAX_TEXTURE_SIZE': {
        name: 'MAX_TEXTURE_SIZE',
        key: GLConstants.MAX_TEXTURE_SIZE,
        webgl: 64,
        webgl2: 64,
    },
    'MAX_RENDERBUFFER_SIZE': {
        name: 'MAX_RENDERBUFFER_SIZE',
        key: GLConstants.MAX_RENDERBUFFER_SIZE,
        webgl: 1,
        webgl2: 1,
    },
    'MAX_TEXTURE_IMAGE_UNITS': {
        name: 'MAX_TEXTURE_IMAGE_UNITS',
        key: GLConstants.MAX_TEXTURE_IMAGE_UNITS,
        webgl: 8,
        webgl2: 8,
    },
    'MAX_FRAGMENT_UNIFORM_VECTORS': {
        name: 'MAX_FRAGMENT_UNIFORM_VECTORS',
        key: GLConstants.MAX_FRAGMENT_UNIFORM_VECTORS,
        webgl: 16,
        webgl2: 16,
    },
    'MAX_CUBE_MAP_TEXTURE_SIZE': {
        name: 'MAX_CUBE_MAP_TEXTURE_SIZE',
        key: GLConstants.MAX_CUBE_MAP_TEXTURE_SIZE,
        webgl: 16,
        webgl2: 16,
    },
    'MAX_COMBINED_TEXTURE_IMAGE_UNITS': {
        name: 'MAX_COMBINED_TEXTURE_IMAGE_UNITS',
        key: GLConstants.MAX_COMBINED_TEXTURE_IMAGE_UNITS,
        webgl: 8,
        webgl2: 8,

    },
    'VERSION': {
        name: 'VERSION',
        key: GLConstants.VERSION,
        webgl: 'WebGL 1.0',
        webgl2: 'WebGL 2.0'
    }
};
/**
 * map GLConstants location to key
 */
for (const key in _poly) {
    const target = _poly[key];
    _polyfill[key] = _polyfill[target.key] = target;
}
/**
 * @class
 */
class GLLimits {
    /**
     * 
     * @param {GLContext} glContext 
     */
    constructor(glContext = { renderType: 'webgl' }) {
        this._glContext = glContext;
        this._type = glContext.renderType;
        this._indexs = [];
        this._map(_polyfill);
    }
    /**
     * 
     * @param {*} mapObject 
     */
    _map(mapObject) {
        const type = this._type;
        for (const key in mapObject) {
            if (!this.hasOwnProperty(key)) {
                const target = mapObject[key];
                if (!this[key])
                    this[key] = target[type];
            }
        }
    }
}
/**
 * 
 */
const glLimits = new GLLimits();
/**
 * get unique glimits instance
 * @function
 */
GLLimits.getInstance = function () {
    return glLimits;
}

module.exports = GLLimits;

