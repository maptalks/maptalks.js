/**
 * @author yellow date 2018/4/4
 */
const merge = require('./../utils/merge'),
    GLConstants = require('./GLConstants');
/**
 * default options
 */
const options = {
    buffer: null,
    enabled: false,
    size: 4,
    type: GLConstants.FLOAT,
    normalized: false,
    stride: 16,
    offset: 0
};
/**
 * @class
 */
class GLVertexAttrib {
    /**
     * 
     * @param {Object} [opts]
     * @param {GLBuffer} [opts.buffer]
     * @param {Boolean} [opts.enabled]
     * @param {GLuint} [opts.type]
     * @param {Boolean} [opts.normalized]
     * @param {Number} [opts.size]
     * @param {Number} [opts.index]
     * @param {Number} [opts.stride]
     * @param {Number} [opts.offset]
     */
    constructor(opts) {
        const _opts = merge({}, options, opts);
        this.enabled = _opts.enable;
        this.buffer = _opts.buffer;
        this.index = _opts.index;
        this.size = _opts.size;
        this.type = _opts.type;
        this.normalized = _opts.normalized;
        this.stride = _opts.stride;
        this.offset = _opts.offset;
        this.cached = [this.size, this.type, this.normalized, this.stride, this.offset].join(":");
    }
    /**
     * recache
     */
    recache(){
        this.cached = [this.size, this.type, this.normalized, this.stride, this.offset].join(":");
    }
    /**
     * enable attrib
     */
    enable() {
        this.enable = true;
    }
    /**
     * disable attrib
     */
    disable() {
        this.enable = false;
    }
}

module.exports = GLVertexAttrib;