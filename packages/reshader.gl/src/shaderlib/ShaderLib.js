/* eslint-disable camelcase */
import vsm_shadow_vert from './glsl/vsm_shadow.vert';
import vsm_shadow_frag from './glsl/vsm_shadow.frag';
import fbo_picking_vert from './glsl/fbo_picking.vert';
import common_pack_float from './glsl/common_pack_float.glsl';
import invert_matrix from './glsl/invert_matrix.vert';
import get_output from './glsl/output.vert';
//instance.vert
import instance_vert from './glsl/instance.vert';
//skin.vert
import skin_vert from './glsl/skin.vert';
import heatmap_render_frag from './glsl/heatmap_render.frag';
import heatmap_render_vert from './glsl/heatmap_render.vert';
// import fog_render_vert from './glsl/fog.vert';
// import fog_render_frag from './glsl/fog.frag';

import line_extrusion_vert from './glsl/line_extrusion.vert';
import gl2_vert from './glsl/gl2.vert';
import gl2_frag from './glsl/gl2.frag';

import hsv_frag from './glsl/hsv.frag';

import snow_frag from './glsl/snow.frag';
import draco_decode_vert from './glsl/draco_decode.vert';

import highlight_vert from './glsl/highlight.vert';
import highlight_frag from './glsl/highlight.frag';

import mask_vert from './glsl/mask.vert';
import mask_frag from './glsl/mask.frag';

import computeTexcoord_frag from './glsl/compute_texcoord.frag';
import terrain_normal_frag from './glsl/terrain_normal.frag';
import vertex_color_vert from './glsl/vertex_color.vert';
import vertex_color_frag from './glsl/vertex_color.frag';
import excavate_vert from './glsl/excavate.vert';
import excavate_frag from './glsl/excavate.frag';
import srgb_frag from './glsl/srgb.frag';
//webgl 2.0中的函数实现
// import fl_common_math_glsl from '../pbr/glsl/common_math.glsl';
// import fl_uniforms_glsl from '../pbr/glsl/uniforms.glsl';
// import fl_material_inputs_vert from '../pbr/glsl/vert/material_inputs.vert';
// import fl_inputs_vert from '..//pbr/glsl/vert/inputs.vert';

// import fl_header_frag from '../pbr/glsl/frag/gl_header.frag';
// import fl_common_graphics_glsl from '../pbr/glsl/frag/common_graphics.frag';
// import fl_inputs_frag from '../pbr/glsl/frag/inputs.frag';
// import fl_brdf_frag from '../pbr/glsl/frag/brdf.frag';
// //构造各类shading_*的值
// import fl_shading_params from '../pbr/glsl/frag/shading_params.frag';
// //MaterialInputs结构定义
// import fl_common_shading_frag from '../pbr/glsl/frag/common_shading.frag';
// import fl_getters_frag from '../pbr/glsl/frag/getters.frag';
// import fl_material_inputs_frag from '../pbr/glsl/frag/material_inputs.frag';
// import fl_common_material_frag from '../pbr/glsl/frag/common_material.frag';
// //PixelParams结构定义
// import fl_common_lighting_frag from '../pbr/glsl/frag/common_lighting.frag';
// import fl_material_uniforms_frag from '../pbr/glsl/frag/gl_material_uniforms.frag';
// //灯光相关的uniforms初始化，如 light_iblDFG
// import fl_light_uniforms_frag from '../pbr/glsl/frag/gl_light_uniforms.frag';
// //IBL灯光的计算逻辑
// import fl_light_indirect from '../pbr/glsl/frag/light_indirect.frag';
// //AO逻辑
// import fl_ambient_occlusion_frag from '../pbr/glsl/frag/ambient_occlusion.frag';
// //有向光的计算逻辑
// import fl_shading_model_standard_frag from '../pbr/glsl/frag/shading_model_standard.frag';
// import fl_shading_model_cloth_frag from '../pbr/glsl/frag/shading_model_cloth.frag';
// import fl_shading_model_subsurface_frag from '../pbr/glsl/frag/shading_model_subsurface.frag';
// import fl_light_directional from '../pbr/glsl/frag/light_directional.frag';
// //lit材质的逻辑
// import fl_shading_lit from '../pbr/glsl/frag/shading_lit.frag';
// //tone mapping and sRGB
// import fl_gl_post_process_frag from '../pbr/glsl/frag/gl_post_process.frag';
// //main
// import fl_main from '../pbr/glsl/frag/main.frag';


//Shader Chunks for includes
const ShaderChunk = {
    vsm_shadow_vert,
    vsm_shadow_frag,
    fbo_picking_vert,
    common_pack_float,

    // //pbr common includes
    // fl_common_math_glsl,
    // fl_common_graphics_glsl,
    // fl_uniforms_glsl,

    // //pbr vertex includes
    // fl_material_inputs_vert,
    // fl_inputs_vert,

    // //pbr frag includes
    // fl_header_frag,
    // fl_inputs_frag,
    // fl_brdf_frag,
    // fl_shading_params,
    // fl_common_shading_frag,
    // fl_getters_frag,
    // fl_material_inputs_frag,
    // fl_common_material_frag,
    // fl_common_lighting_frag,
    // fl_material_uniforms_frag,
    // fl_light_uniforms_frag,
    // fl_ambient_occlusion_frag,
    // fl_light_indirect,
    // fl_shading_model_standard_frag,
    // fl_shading_model_cloth_frag,
    // fl_shading_model_subsurface_frag,
    // fl_light_directional,
    // fl_shading_lit,
    // fl_gl_post_process_frag,
    // fl_main,
    invert_matrix,
    get_output,
    instance_vert,
    skin_vert,
    heatmap_render_vert,
    heatmap_render_frag,

    line_extrusion_vert,

    // fog_render_vert,
    // fog_render_frag,

    gl2_vert,
    gl2_frag,

    //颜色饱和度
    hsv_frag,
    snow_frag,
    //draco解压相关
    draco_decode_vert,

    highlight_vert,
    highlight_frag,

    mask_vert,
    mask_frag,

    computeTexcoord_frag,

    terrain_normal_frag,

    vertex_color_vert,
    vertex_color_frag,

    excavate_vert,
    excavate_frag,

    srgb_frag
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
