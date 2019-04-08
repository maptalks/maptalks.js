/* eslint-disable camelcase */
import vsm_shadow_vert from './glsl/vsm_shadow.vert';
import vsm_shadow_frag from './glsl/vsm_shadow.frag';
import fbo_picking_vert from './glsl/fbo_picking.vert';



//webgl 2.0中的函数实现
import fl_common_math_glsl from '../pbr/glsl/common_math.glsl';
import fl_uniforms_glsl from '../pbr/glsl/uniforms.glsl';
import fl_inputs_vert from '..//pbr/glsl/vert/inputs.vert';

//构造各类shading_*的值
import fl_shading_params from '../pbr/glsl/frag/shading_params.frag';
//MaterialInputs结构定义
import fl_common_material_frag from '../pbr/glsl/frag/common_material.frag';
//PixelParams结构定义
import fl_common_lighting_frag from '../pbr/glsl/frag/common_lighting.frag';

import fl_material_uniforms_frag from '../pbr/glsl/frag/material_uniforms.frag';

//IBL灯光的计算逻辑
import fl_light_indirect from '../pbr/glsl/frag/light_indirect.frag';
//有向光的计算逻辑
import fl_light_directional from '../pbr/glsl/frag/light_directional.frag';

//lit材质的逻辑
import fl_shading_lit from '../pbr/glsl/frag/shading_lit.frag';

//Shader Chunks for includes
const ShaderChunk = {
    vsm_shadow_vert,
    vsm_shadow_frag,
    fbo_picking_vert,

    //pbr common includes
    fl_common_math_glsl,
    fl_uniforms_glsl,

    //pbr vertex includes
    fl_inputs_vert,

    //pbr frag includes
    fl_shading_params,
    fl_common_material_frag,
    fl_common_lighting_frag,
    fl_material_uniforms_frag,
    fl_light_indirect,
    fl_light_directional,
    fl_shading_lit
};
/* eslint-enable camelcase */

export default {
    /**
     * Register a new shader segment for includes for 3rd parties
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
