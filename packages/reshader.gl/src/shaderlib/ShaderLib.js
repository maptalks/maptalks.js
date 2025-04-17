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

import compute_texcoord_frag from './glsl/compute_texcoord.frag';
import terrain_normal_frag from './glsl/terrain_normal.frag';
import vertex_color_vert from './glsl/vertex_color.vert';
import vertex_color_frag from './glsl/vertex_color.frag';
import excavate_vert from './glsl/excavate.vert';
import excavate_frag from './glsl/excavate.frag';
import srgb_frag from './glsl/srgb.frag';

import mesh_picking_vert from './glsl/mesh_picking.vert';


//Shader Chunks for includes
const ShaderChunk = {
    vsm_shadow_vert,
    vsm_shadow_frag,
    fbo_picking_vert,
    common_pack_float,

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

    compute_texcoord_frag,

    terrain_normal_frag,

    vertex_color_vert,
    vertex_color_frag,

    excavate_vert,
    excavate_frag,

    srgb_frag,
    mesh_picking_vert
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
    },

    get(name) {
        return ShaderChunk[name];
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
