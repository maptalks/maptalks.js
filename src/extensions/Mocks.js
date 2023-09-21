import DrawBuffersExt from "./DrawBuffersExt";
import VertexArrayObjectExt from "./VertexArrayObjectExt";
import AngleInstancedArrayExt from "./AngleInstancedArrayExt";

const GL_DEPTH_COMPONENT = 0x1902;
const GL_DEPTH_STENCIL = 0x84f9;
const HALF_FLOAT_OES = 0x8d61;

const SIMPLE_MOCKS = {
    webgl_depth_texture: {
        UNSIGNED_INT_24_8_WEBGL: 0x84fa,
    },
    oes_element_index_uint: {},
    oes_texture_float: {},
    oes_texture_half_float: {
        HALF_FLOAT_OES: 0x8d61,
    },
    ext_color_buffer_float: {},
    oes_standard_derivatives: {},
    ext_frag_depth: {},
    ext_blend_minmax: {
        MIN_EXT: 0x8007,
        MAX_EXT: 0x8008,
    },
    ext_shader_texture_lod: {},
};

const Mocks = {
    has(context, name) {
        const is2 = context._is2;
        const gl = context._gl;
        if (!is2 && !gl.getExtension(name)) {
            return false;
        }
        name = name.toLowerCase();
        return (
            (is2 && SIMPLE_MOCKS[name]) ||
            name === "webgl_draw_buffers" ||
            name === "oes_vertex_array_object" ||
            name === "angle_instanced_arrays"
        );
    },

    mock(context, name) {
        name = name.toLowerCase();
        if (SIMPLE_MOCKS[name]) {
            if (context._is2) {
                if (
                    name === "oes_texture_float" ||
                    name === "oes_texture_half_float"
                ) {
                    // to support float and half-float textures in webgl2
                    context._gl.getExtension("EXT_color_buffer_float");
                }
                return SIMPLE_MOCKS[name];
            } else {
                return context._gl.getExtension(name);
            }
        } else if (name === "webgl_draw_buffers") {
            return new DrawBuffersExt(context);
        } else if (name === "oes_vertex_array_object") {
            return new VertexArrayObjectExt(context);
        } else if (name === "angle_instanced_arrays") {
            return new AngleInstancedArrayExt(context);
        }
        return null;
    },

    // texture internal format to update on the fly
    getInternalFormat(gl, format, type) {
        // webgl2 texture formats
        // reference:
        // https://webgl2fundamentals.org/webgl/lessons/webgl-data-textures.html
        if (format === GL_DEPTH_COMPONENT) {
            // gl.DEPTH_COMPONENT24
            return 0x81a6;
        } else if (format === GL_DEPTH_STENCIL) {
            // gl.DEPTH24_STENCIL8
            return 0x88f0;
        } else if (type === HALF_FLOAT_OES && format === gl.RGBA) {
            // gl.RGBA16F
            return 0x881a;
        } else if (type === HALF_FLOAT_OES && format === gl.RGB) {
            // gl.RGB16F
            return 0x881b;
        } else if (type === gl.FLOAT && format === gl.RGBA) {
            // gl.RGBA32F
            return 0x8814;
        } else if (type === gl.FLOAT && format === gl.RGB) {
            // gl.RGB32F
            return 0x8815;
        }
        return format;
    },

    // texture type to update on the fly
    getTextureType(gl, type) {
        if (type === HALF_FLOAT_OES) {
            return gl.HALF_FLOAT;
        }
        return type;
    },
};

export default Mocks;
