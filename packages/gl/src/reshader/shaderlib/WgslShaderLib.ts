/* eslint-disable camelcase */
import instance from './wgsl/instance';
import invert_matrix from './wgsl/invert_matrix';
import line_extrusion from './wgsl/line_extrusion';
import mask from './wgsl/mask';
import get_output from './wgsl/output';
import skin from './wgsl/skin';
import vertex_color from './wgsl/vertex_color';
import vsm_shadow from './wgsl/vsm_shadow';
import draco_decode from './wgsl/draco_decode';
import highlight from './wgsl/highlight';
import compute_texcoord from './wgsl/compute_texcoord';
import fbo_picking from './wgsl/fbo_picking';
import common_pack_float from './wgsl/common_pack_float';
import excavate from './wgsl/excavate';
import hsv from './wgsl/hsv';
import srgb from './wgsl/srgb';
import snow from './wgsl/snow';
import terrain_normal from './wgsl/terrain_normal';
import mesh_picking from './wgsl/mesh_picking';
import rgbm from './wgsl/rgbm';

//Shader Chunks for includes
const ShaderChunk = {
    instance,
    invert_matrix,
    line_extrusion,
    mask,
    get_output,
    skin,
    vertex_color,
    vsm_shadow,
    draco_decode,
    highlight,
    compute_texcoord,
    fbo_picking,
    common_pack_float,
    excavate,
    hsv,
    srgb,
    snow,
    terrain_normal,
    mesh_picking,
    rgbm
};
/* eslint-enable camelcase */

export default {
    register(name, segment) {
        if (ShaderChunk[name]) {
            throw new Error(`Key of ${name} is already registered in WgslShaderLib.`);
        }
        ShaderChunk[name] = segment;
    },

    /**
     * Compile the given source, replace #include with registered shader sources
     * @param {String} source source to compile
     */
    compile(source, defines) {
        return new SourceCompiler(source, defines).compile();
        // return parseIncludes(source);

    },

    get(name) {
        return ShaderChunk[name];
    }
};

const pattern = /^[ \t]*#include +<([\w\d.]+)>/gm;
const vertexInputPattern = /\bstruct\s+VertexInput\b/;
const vertexOutputPattern = /\bstruct\s+VertexOutput\b/;

class SourceCompiler {
    //@internal
    defines: any;
    //@internal
    source: any;
    //@internal
    isVert: boolean;
    //@internal
    varyings: any[];
    //@internal
    attributes: any[];

    constructor(source, defines) {
        this.defines = defines;
        this.source = source;
        this.isVert = source.indexOf('@vertex') > -1;
        this.varyings = [];
        this.attributes = [];
    }

    compile() {
        let source = this.source;
        source = this.parseIncludes(source);
        // source中的 #include 预处理已经替换为了实际的代码
        if (this.isVert) {
            source = this.fillAttributes(source);
        }
        source = this.fillVaryings(source);
        return source;
    }

    parseIncludes(string) {
        return string.replace(pattern, (match, include) => {
            let key = include;
            if (include.endsWith('_vert')) {
                key = include.substring(0, include.length - 5);
            } else if (include.endsWith('_frag')) {
                key = include.substring(0, include.length - 5);
            }
            const replace = ShaderChunk[key];
            if (!replace) {
                throw new Error('Can not resolve #include <' + include + '>');
            }
            // 1. 用include中的代码替换原有的 #include <foo> 预处理语句
            if (replace.defines) {
                // 代码中定义的defines是否满足include中的defines条件
                if (!this.checkDefines(replace.defines)) {
                    return '';
                }
            }
            // 2. 将include中的varyings和attributes添加到当前的varyings和attributes中
            if (replace.varyings) {
                for (let i = 0; i < replace.varyings.length; i++) {
                    const varying = replace.varyings[i];
                    if (varying.defines && !this.checkDefines(varying.defines)) {
                        continue;
                    }
                    this.varyings.push(varying);
                }
            }
            if (replace.attributes) {
                for (let i = 0; i < replace.attributes.length; i++) {
                    const attr = replace.attributes[i];
                    if (attr.defines && !this.checkDefines(attr.defines)) {
                        continue;
                    }
                    this.attributes.push(attr);
                }
            }
            return this.parseIncludes(this.isVert ? replace.vert : replace.frag);
        });
    }

    fillAttributes(source) {
        return this.fillStruct(source, vertexInputPattern, '$i', this.attributes);
    }

    fillVaryings(source) {
        const varName = this.isVert ? '$o' : '$i';
        return this.fillStruct(source, vertexOutputPattern, varName ,this.varyings);
    }

    fillStruct(source, reg, varName, items) {
        if (!items.length) {
            return source;
        }
        const structBeginIndex = source.search(reg);
        const endIndex = source.indexOf('}', structBeginIndex);
        const firstPart = source.substring(0, endIndex);
        const secondPart = source.substring(endIndex);
        const attributes = [];
        for (let i = 0; i < items.length; i++) {
            const { name, type } = items[i];
            attributes.push(`@location(${varName}) ${name}: ${type},`);
        }
        return firstPart + attributes.join('\n') + '\n' + secondPart;
    }

    checkDefines(defines) {
        if (Array.isArray(defines)) {
            // 如果是数组，defines中所有的key都需要被定义
            for (let i = 0; i < defines.length; i++) {
                const def = defines[i];
                if (!this.defines[def]) {
                    return false;
                }
            }
        } else if (!defines(this.defines)) {
            // 输入的defines也可以是函数
            return false;
        }
        return true;
    }
}

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
