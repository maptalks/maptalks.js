/* eslint-disable camelcase */
import vsm_shadow_vert from './glsl/vsm_shadow.vert';
import vsm_shadow_frag from './glsl/vsm_shadow.frag';
import fbo_picking_vert from './glsl/fbo_picking.vert';

//Shader Chunks for includes
const ShaderChunk = {
    vsm_shadow_vert,
    vsm_shadow_frag,
    fbo_picking_vert
};
/* eslint-enable camelcase */

export default {
    /**
     * Register a new shader segment for includes
     * @param {String} name key name
     * @param {String} source shader segment source
     */
    register(name, source) {
        if (ShaderChunk[name]) {
            throw new Error(`Key of ${name} is already registered in ShaderLib.`);
        }
        ShaderChunk[name] = source;
    },

    /**
     * Compile the given source, replace #include with registered shader sources
     * @param {String} source source to compile
     */
    compile(source) {
        return parseIncludes(source);
    }
};

const pattern = /^[ \t]*#include +<([\w\d.]+)>/gm;

function parseIncludes(string) {
    return string.replace(pattern, replace);
}

function replace(match, include) {
    const replace = ShaderChunk[include];
    if (!replace) {
        throw new Error('Can not resolve #include <' + include + '>');
    }
    return parseIncludes(replace);
}
