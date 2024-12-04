/**
 * Merges the properties of sources into destination object.
 * @param  {Object} dest   - object to extend
 * @param  {...Object} src - sources
 * @return {Object}
 * @memberOf Util
 */
export function extend(dest) { // (Object[, Object, ...]) ->
    for (let i = 1; i < arguments.length; i++) {
        const src = arguments[i];
        for (const k in src) {
            dest[k] = src[k];
        }
    }
    return dest;
}

export function include(proto, ...sources) {
    for (let i = 0; i < sources.length; i++) {
        extend(proto, sources[i]);
    }
}


//https://www.khronos.org/registry/OpenGL/specs/es/2.0/es_full_spec_2.0.pdf
export function createDefaultStates(gl) {
    return {
        scissor : [0, 0, gl.canvas.width, gl.canvas.height],
        viewport : [0, 0, gl.canvas.width, gl.canvas.height],
        blendColor : [0, 0, 0, 0],
        blendEquationSeparate : [gl.FUNC_ADD, gl.FUNC_ADD],
        blendFuncSeparate : [gl.ONE, gl.ZERO, gl.ONE, gl.ZERO],
        clearColor : [0, 0, 0, 0],
        clearDepth : [1],
        clearStencil : [0],
        colorMask : [true, true, true, true],
        cullFace : [gl.BACK],
        depthFunc : [gl.LESS],
        depthMask : [true],
        depthRange : [0, 1],
        capabilities : {
            0x0BE2 : false, //BLEND
            0x0B44 : false, //CULL_FACE
            0x0B71 : false, //DEPTH_TEST
            0x0BD0 : false, //DITHER
            0x8037 : false, //POLYGON_OFFSET_FILL
            0x809E : false, //SAMPLE_ALPHA_TO_COVERAGE
            0x80A0 : false, //SAMPLE_COVERAGE
            0x0C11 : false, //SCISSOR_TEST
            0x0B90 : false  //STENCIL_TEST
        },
        frontFace : [gl.CCW],
        hint : {
            0x8192 : [gl.DONT_CARE], //GENERATE_MIPMAP_HINT
            0x8B8B : [gl.DONT_CARE] //FRAGMENT_SHADER_DERIVATIVE_HINT_OES
        },
        lineWidth : [1],
        pixelStorei : {
            0x0D05 : [4], //PACK_ALIGNMENT
            0x0CF5 : [4], //UNPACK_ALIGNMENT
            0x9240 : [false], //UNPACK_FLIP_Y_WEBGL
            0x9241 : [false], //UNPACK_PREMULTIPLY_ALPHA_WEBGL
            0x9243 : [gl.BROWSER_DEFAULT_WEBGL], //UNPACK_COLORSPACE_CONVERSION_WEBGL
        },
        polygonOffset : [0, 0],
        sampleCoverage : [1.0, false],
        stencilFuncSeparate : {
            0x0404 : [gl.ALWAYS, 0, 4294967295], //FRONT
            0x0405 : [gl.ALWAYS, 0, 4294967295], //BACK
        },
        stencilMaskSeparate : {
            0x0404 : [4294967295], //FRONT
            0x0405 : [4294967295], //BACK
        },
        stencilOpSeparate : {
            0x0404 : [gl.KEEP, gl.KEEP, gl.KEEP], //FRONT
            0x0405 : [gl.KEEP, gl.KEEP, gl.KEEP], //BACK
        },
        //-----------------------------
        program : null,
        framebuffer : {
            0x8D40 : null, //FRAMEBUFFER
            0x8CA8 : null, //READ_FRAMEBUFFER
            0x8CA9 : null, //DRAW_FRAMEBUFFER
        },
        renderbuffer : {
            0x8D41 : null //RENDERBUFFER
        },
        textures : {
            active : -1, //TEXTURE0
            units : (function () {
                const units = [];
                const max = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
                for (let i = 0; i < max; i++) {
                    units.push({
                        0x0DE1 : null, //TEXTURE_2D
                        0x8513 : null  //TEXTURE_CUBE_MAP
                    });
                }
                units[-1] = {
                    0x0DE1 : null, //TEXTURE_2D
                    0x8513 : null  //TEXTURE_CUBE_MAP
                };
                return units;
            })()
        },
        attributes : {

        },
        arrayBuffer : null,
        elementArrayBuffer : null,
    };
}
