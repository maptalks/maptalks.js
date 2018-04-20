
const Model = require('./Model');

const ocean_vertex = require('./../shader/water_vertex'),
    ocean_fragment = require('./../shader/water_fragment').ocean_fragment,
    normal_fragment = require('./../shader/water_fragment').normal_fragment,
    phase_fragment = require('./../shader/water_fragment').phase_fragment,
    spectrum_fragment = require('./../shader/water_fragment').spectrum_fragment,
    transform_fragment = require('./../shader/water_fragment').transform_fragment;
/**
 * @class
 */
class Water extends Model {

    constructor(opts = {}) {
        super(opts);
    }
    /**
     * @param {WebGLRenderingContext} gl 
     */
    _init(gl){
        
    }
    /**
     * 
     * @param {WebGLRenderingContext} gl 
     * @param {*} camera 
     * @param {*} light 
     */
    draw(gl, camera, light) {
        this._init(gl);

    }
}

module.exports = Water;