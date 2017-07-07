/**
 * https://github.com/pixijs/pixi-gl-core/blob/master/src/shader/generateUniformAccessObject.js
 */

import Dispose from './../../utils/Dispose';

const GLSL_UNIFORM = {
    'float': 'uniform1f',//(location, value)
    'vec2': 'uniform2f',//(location, value[0], value[1])
    'vec3': 'uniform3f',//(location, value[0], value[1], value[2])
    'vec4': 'uniform4f',//(location, value[0], value[1], value[2], value[3])
    'int': 'uniform1i',//(location, value)
    'ivec2': 'uniform2i',//(location, value[0], value[1])
    'ivec3': 'uniform3i',//(location, value[0], value[1], value[2])
    'ivec4': 'uniform4i',//(location, value[0], value[1], value[2], value[3])
    'bool': 'uniform1i',//(location, value)
    'bvec2': 'uniform2i',//(location, value[0], value[1])
    'bvec3': 'uniform3i',//(location, value[0], value[1], value[2])
    'bvec4': 'uniform4i',//(location, value[0], value[1], value[2], value[3])
    'mat2': 'uniformMatrix2fv',//(location, false, value)
    'mat3': 'uniformMatrix3fv',//(location, false, value)
    'mat4': 'uniformMatrix4fv',//(location, false, value)
    'sampler2D': 'uniform1i'//(location, value)
};


class GLUniform extends Dispose {

    constructor(gl, extension, limits) {

    }

}

export default GLUniform;