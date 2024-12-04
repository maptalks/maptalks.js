/*eslint-disable camelcase*/
/**
 * reference https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Constants
 * reference https://github.com/uber/luma.gl/blob/master/src/webgl-utils/constants.js
 * reference https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Types
 * Store GLEnum value the boost glContext setting
 * webgl2 used within a WebGL2RenderingContext,add GLint64(GLuint64EXT)
 * @author yellow date 2017/6/15
 */
const GLConstants = {
    /**
     * 深度缓冲，常用与 gl.clear(gl.Enum)
     * Passed to clear to clear the current depth buffer.
     */
    DEPTH_BUFFER_BIT: 0x00000100,
    /**
     * 模版缓冲，常用与 gl.clear(gl.Enum)
     * Passed to clear to clear the current stencil buffer.
     */
    STENCIL_BUFFER_BIT: 0x00000400,
    /**
     * 当前可写的颜色缓冲，常用与 gl.clear(gl.Enum)
     *  Passed to clear to clear the current color buffer.
     */
    COLOR_BUFFER_BIT: 0x00004000, //
    // Rendering primitives
    // Constants passed to drawElements() or drawArrays() to specify what kind of primitive to render.
    POINTS: 0x0000, // Passed to drawElements or drawArrays to draw single points.
    LINES: 0x0001, // Passed to drawElements or drawArrays to draw lines. Each vertex connects to the one after it.
    LINE_LOOP: 0x0002, // Passed to drawElements or drawArrays to draw lines. Each set of two vertices is treated as a separate line segment.
    LINE_STRIP: 0x0003, // Passed to drawElements or drawArrays to draw a connected group of line segments from the first vertex to the last.
    TRIANGLES: 0x0004, // Passed to drawElements or drawArrays to draw triangles. Each set of three vertices creates a separate triangle.
    TRIANGLE_STRIP: 0x0005, // Passed to drawElements or drawArrays to draw a connected group of triangles.
    TRIANGLE_FAN: 0x0006, // Passed to drawElements or drawArrays to draw a connected group of triangles. Each vertex connects to the previous and the first vertex in the fan.
    // Blending modes
    // Constants passed to blendFunc() or blendFuncSeparate() to specify the blending mode (for both, RBG and alpha, or separately).
    ZERO: 0, // Passed to blendFunc or blendFuncSeparate to turn off a component.
    ONE: 1, // Passed to blendFunc or blendFuncSeparate to turn on a component.
    SRC_COLOR: 0x0300, // Passed to blendFunc or blendFuncSeparate to multiply a component by the source elements color.
    ONE_MINUS_SRC_COLOR: 0x0301, // Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the source elements color.
    SRC_ALPHA: 0x0302, // Passed to blendFunc or blendFuncSeparate to multiply a component by the source's alpha.
    /**
     * 传递给BleandFunc或BlendFuncSeparate使用，用来指定混合计算颜色时，基于源颜色的aplha所占比。
     * Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the source's alpha.
     */
    ONE_MINUS_SRC_ALPHA: 0x0303,
    DST_ALPHA: 0x0304, // Passed to blendFunc or blendFuncSeparate to multiply a component by the destination's alpha.
    ONE_MINUS_DST_ALPHA: 0x0305, // Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the destination's alpha.
    DST_COLOR: 0x0306, // Passed to blendFunc or blendFuncSeparate to multiply a component by the destination's color.
    ONE_MINUS_DST_COLOR: 0x0307, // Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the destination's color.
    SRC_ALPHA_SATURATE: 0x0308, // Passed to blendFunc or blendFuncSeparate to multiply a component by the minimum of source's alpha or one minus the destination's alpha.
    CONSTANT_COLOR: 0x8001, // Passed to blendFunc or blendFuncSeparate to specify a constant color blend function.
    ONE_MINUS_CONSTANT_COLOR: 0x8002, // Passed to blendFunc or blendFuncSeparate to specify one minus a constant color blend function.
    CONSTANT_ALPHA: 0x8003, // Passed to blendFunc or blendFuncSeparate to specify a constant alpha blend function.
    ONE_MINUS_CONSTANT_ALPHA: 0x8004, // Passed to blendFunc or blendFuncSeparate to specify one minus a constant alpha blend function.
    // Blending equations
    // Constants passed to blendEquation() or blendEquationSeparate() to control
    // how the blending is calculated (for both, RBG and alpha, or separately).
    FUNC_ADD: 0x8006, // Passed to blendEquation or blendEquationSeparate to set an addition blend function.
    FUNC_SUBSTRACT: 0x800a, // Passed to blendEquation or blendEquationSeparate to specify a subtraction blend function (source - destination).
    FUNC_SUBTRACT: 0x800a, //Passed to blendEquation or blendEquationSeparate to specify a subtraction blend function (source - destination).
    FUNC_REVERSE_SUBTRACT: 0x800b, // Passed to blendEquation or blendEquationSeparate to specify a reverse subtraction blend function (destination - source).
    // Getting GL parameter information
    // Constants passed to getParameter() to specify what information to return.
    BLEND_EQUATION: 0x8009, // Passed to getParameter to get the current RGB blend function.
    BLEND_EQUATION_RGB: 0x8009, // Passed to getParameter to get the current RGB blend function. Same as BLEND_EQUATION
    BLEND_EQUATION_ALPHA: 0x883d, // Passed to getParameter to get the current alpha blend function. Same as BLEND_EQUATION
    BLEND_DST_RGB: 0x80c8, // Passed to getParameter to get the current destination RGB blend function.
    BLEND_SRC_RGB: 0x80c9, // Passed to getParameter to get the current destination RGB blend function.
    BLEND_DST_ALPHA: 0x80ca, // Passed to getParameter to get the current destination alpha blend function.
    BLEND_SRC_ALPHA: 0x80cb, // Passed to getParameter to get the current source alpha blend function.
    BLEND_COLOR: 0x8005, // Passed to getParameter to return a the current blend color.
    ARRAY_BUFFER_BINDING: 0x8894, // Passed to getParameter to get the array buffer binding.
    ELEMENT_ARRAY_BUFFER_BINDING: 0x8895, // Passed to getParameter to get the current element array buffer.
    LINE_WIDTH: 0x0b21, // Passed to getParameter to get the current lineWidth (set by the lineWidth method).
    ALIASED_POINT_SIZE_RANGE: 0x846d, // Passed to getParameter to get the current size of a point drawn with gl.POINTS
    ALIASED_LINE_WIDTH_RANGE: 0x846e, // Passed to getParameter to get the range of available widths for a line. Returns a length-2 array with the lo value at 0, and hight at 1.
    CULL_FACE_MODE: 0x0b45, // Passed to getParameter to get the current value of cullFace. Should return FRONT, BACK, or FRONT_AND_BACK
    FRONT_FACE: 0x0b46, // Passed to getParameter to determine the current value of frontFace. Should return CW or CCW.
    DEPTH_RANGE: 0x0b70, // Passed to getParameter to return a length-2 array of floats giving the current depth range.
    DEPTH_WRITEMASK: 0x0b72, // Passed to getParameter to determine if the depth write mask is enabled.
    DEPTH_CLEAR_VALUE: 0x0b73, // Passed to getParameter to determine the current depth clear value.
    DEPTH_FUNC: 0x0b74, // Passed to getParameter to get the current depth function. Returns NEVER, ALWAYS, LESS, EQUAL, LEQUAL, GREATER, GEQUAL, or NOTEQUAL.
    STENCIL_CLEAR_VALUE: 0x0b91, // Passed to getParameter to get the value the stencil will be cleared to.
    STENCIL_FUNC: 0x0b92, // Passed to getParameter to get the current stencil function. Returns NEVER, ALWAYS, LESS, EQUAL, LEQUAL, GREATER, GEQUAL, or NOTEQUAL.
    STENCIL_FAIL: 0x0b94, // Passed to getParameter to get the current stencil fail function. Should return KEEP, REPLACE, INCR, DECR, INVERT, INCR_WRAP, or DECR_WRAP.
    STENCIL_PASS_DEPTH_FAIL: 0x0b95, // Passed to getParameter to get the current stencil fail function should the depth buffer test fail. Should return KEEP, REPLACE, INCR, DECR, INVERT, INCR_WRAP, or DECR_WRAP.
    STENCIL_PASS_DEPTH_PASS: 0x0b96, // Passed to getParameter to get the current stencil fail function should the depth buffer test pass. Should return KEEP, REPLACE, INCR, DECR, INVERT, INCR_WRAP, or DECR_WRAP.
    STENCIL_REF: 0x0b97, // Passed to getParameter to get the reference value used for stencil tests.
    STENCIL_VALUE_MASK: 0x0b93,
    STENCIL_WRITEMASK: 0x0b98,
    STENCIL_BACK_FUNC: 0x8800,
    STENCIL_BACK_FAIL: 0x8801,
    STENCIL_BACK_PASS_DEPTH_FAIL: 0x8802,
    STENCIL_BACK_PASS_DEPTH_PASS: 0x8803,
    STENCIL_BACK_REF: 0x8ca3,
    STENCIL_BACK_VALUE_MASK: 0x8ca4,
    STENCIL_BACK_WRITEMASK: 0x8ca5,
    VIEWPORT: 0x0ba2, // Returns an Int32Array with four elements for the current viewport dimensions.
    SCISSOR_BOX: 0x0c10, // Returns an Int32Array with four elements for the current scissor box dimensions.
    COLOR_CLEAR_VALUE: 0x0c22,
    COLOR_WRITEMASK: 0x0c23,
    UNPACK_ALIGNMENT: 0x0cf5,
    PACK_ALIGNMENT: 0x0d05,
    MAX_TEXTURE_SIZE: 0x0d33,
    MAX_VIEWPORT_DIMS: 0x0d3a,
    SUBPIXEL_BITS: 0x0d50,
    RED_BITS: 0x0d52,
    GREEN_BITS: 0x0d53,
    BLUE_BITS: 0x0d54,
    ALPHA_BITS: 0x0d55,
    DEPTH_BITS: 0x0d56,
    STENCIL_BITS: 0x0d57,
    POLYGON_OFFSET_UNITS: 0x2a00,
    POLYGON_OFFSET_FACTOR: 0x8038,
    TEXTURE_BINDING_2D: 0x8069,
    SAMPLE_BUFFERS: 0x80a8,
    SAMPLES: 0x80a9,
    SAMPLE_COVERAGE_VALUE: 0x80aa,
    SAMPLE_COVERAGE_INVERT: 0x80ab,
    COMPRESSED_TEXTURE_FORMATS: 0x86a3,
    VENDOR: 0x1f00,
    RENDERER: 0x1f01,
    VERSION: 0x1f02,
    IMPLEMENTATION_COLOR_READ_TYPE: 0x8b9a,
    IMPLEMENTATION_COLOR_READ_FORMAT: 0x8b9b,
    BROWSER_DEFAULT_WEBGL: 0x9244,

    // Buffers
    // Constants passed to bufferData(), bufferSubData(), bindBuffer(), or
    // getBufferParameter().

    STATIC_DRAW: 0x88e4, // Passed to bufferData as a hint about whether the contents of the buffer are likely to be used often and not change often.
    STREAM_DRAW: 0x88e0, // Passed to bufferData as a hint about whether the contents of the buffer are likely to not be used often.
    DYNAMIC_DRAW: 0x88e8, // Passed to bufferData as a hint about whether the contents of the buffer are likely to be used often and change often.
    ARRAY_BUFFER: 0x8892, // Passed to bindBuffer or bufferData to specify the type of buffer being used.
    ELEMENT_ARRAY_BUFFER: 0x8893, // Passed to bindBuffer or bufferData to specify the type of buffer being used.
    BUFFER_SIZE: 0x8764, // Passed to getBufferParameter to get a buffer's size.
    BUFFER_USAGE: 0x8765, // Passed to getBufferParameter to get the hint for the buffer passed in when it was created.

    // Vertex attributes
    // Constants passed to getVertexAttrib().

    CURRENT_VERTEX_ATTRIB: 0x8626, // Passed to getVertexAttrib to read back the current vertex attribute.
    VERTEX_ATTRIB_ARRAY_ENABLED: 0x8622,
    VERTEX_ATTRIB_ARRAY_SIZE: 0x8623,
    VERTEX_ATTRIB_ARRAY_STRIDE: 0x8624,
    VERTEX_ATTRIB_ARRAY_TYPE: 0x8625,
    VERTEX_ATTRIB_ARRAY_NORMALIZED: 0x886a,
    VERTEX_ATTRIB_ARRAY_POINTER: 0x8645,
    VERTEX_ATTRIB_ARRAY_BUFFER_BINDING: 0x889f,

    // Culling
    // Constants passed to cullFace().

    CULL_FACE: 0x0b44, // Passed to enable/disable to turn on/off culling. Can also be used with getParameter to find the current culling method.
    FRONT: 0x0404, // Passed to cullFace to specify that only front faces should be drawn.
    BACK: 0x0405, // Passed to cullFace to specify that only back faces should be drawn.
    FRONT_AND_BACK: 0x0408, // Passed to cullFace to specify that front and back faces should be drawn.

    // Enabling and disabling
    // Constants passed to enable() or disable().

    BLEND: 0x0be2, // Passed to enable/disable to turn on/off blending. Can also be used with getParameter to find the current blending method.
    DEPTH_TEST: 0x0b71, // Passed to enable/disable to turn on/off the depth test. Can also be used with getParameter to query the depth test.
    DITHER: 0x0bd0, // Passed to enable/disable to turn on/off dithering. Can also be used with getParameter to find the current dithering method.
    POLYGON_OFFSET_FILL: 0x8037, // Passed to enable/disable to turn on/off the polygon offset. Useful for rendering hidden-line images, decals, and or solids with highlighted edges. Can also be used with getParameter to query the scissor test.
    SAMPLE_ALPHA_TO_COVERAGE: 0x809e, // Passed to enable/disable to turn on/off the alpha to coverage. Used in multi-sampling alpha channels.
    SAMPLE_COVERAGE: 0x80a0, // Passed to enable/disable to turn on/off the sample coverage. Used in multi-sampling.
    SCISSOR_TEST: 0x0c11, // Passed to enable/disable to turn on/off the scissor test. Can also be used with getParameter to query the scissor test.
    /**
     *  模版缓冲区测试，发生在透明度测试之后，和深度测试之前
     *  Passed to enable/disable to turn on/off the stencil test. Can also be used with getParameter to query the stencil test.
     */
    STENCIL_TEST: 0x0b90,

    // Errors
    // Constants returned from getError().

    NO_ERROR: 0, // Returned from getError.
    INVALID_ENUM: 0x0500, //  Returned from getError.
    INVALID_VALUE: 0x0501, //  Returned from getError.
    INVALID_OPERATION: 0x0502, //  Returned from getError.
    OUT_OF_MEMORY: 0x0505, //  Returned from getError.
    CONTEXT_LOST_WEBGL: 0x9242, //  Returned from getError.

    // Front face directions
    // Constants passed to frontFace().

    CW: 0x0900, //  Passed to frontFace to specify the front face of a polygon is drawn in the clockwise direction
    CCW: 0x0901, // Passed to frontFace to specify the front face of a polygon is drawn in the counter clockwise direction

    // Hints
    // Constants passed to hint()

    DONT_CARE: 0x1100, // There is no preference for this behavior.
    FASTEST: 0x1101, // The most efficient behavior should be used.
    NICEST: 0x1102, // The most correct or the highest quality option should be used.
    GENERATE_MIPMAP_HINT: 0x8192, // Hint for the quality of filtering when generating mipmap images with generateMipmap().

    // Data types

    BYTE: 0x1400,
    /**
     * 无符号byte,即每通道8bit 适合 gl.RGBA
     */
    UNSIGNED_BYTE: 0x1401,
    SHORT: 0x1402,
    UNSIGNED_SHORT: 0x1403,
    INT: 0x1404,
    UNSIGNED_INT: 0x1405,
    FLOAT: 0x1406,

    // Pixel formats

    DEPTH_COMPONENT: 0x1902,
    ALPHA: 0x1906,
    /**
     * RGB颜色表示Texture，Image颜色读取规则
     */
    RGB: 0x1907,
    RGBA: 0x1908,
    LUMINANCE: 0x1909,
    LUMINANCE_ALPHA: 0x190a,

    // Pixel types

    // UNSIGNED_BYTE: 0x1401,
    UNSIGNED_SHORT_4_4_4_4: 0x8033,
    UNSIGNED_SHORT_5_5_5_1: 0x8034,
    UNSIGNED_SHORT_5_6_5: 0x8363,

    // Shaders
    // Constants passed to createShader() or getShaderParameter()

    FRAGMENT_SHADER: 0x8b30, // Passed to createShader to define a fragment shader.
    VERTEX_SHADER: 0x8b31, // Passed to createShader to define a vertex shader
    /**
     * shader 编译状态，
     * Passed to getShaderParamter to get the status of the compilation. Returns false if the shader was not compiled. You can then query getShaderInfoLog to find the exact error
     */
    COMPILE_STATUS: 0x8b81,
    DELETE_STATUS: 0x8b80, // Passed to getShaderParamter to determine if a shader was deleted via deleteShader. Returns true if it was, false otherwise.
    LINK_STATUS: 0x8b82, // Passed to getProgramParameter after calling linkProgram to determine if a program was linked correctly. Returns false if there were errors. Use getProgramInfoLog to find the exact error.
    VALIDATE_STATUS: 0x8b83, // Passed to getProgramParameter after calling validateProgram to determine if it is valid. Returns false if errors were found.
    ATTACHED_SHADERS: 0x8b85, // Passed to getProgramParameter after calling attachShader to determine if the shader was attached correctly. Returns false if errors occurred.
    /**
     * 获取program里可用的attributes，【map到program里方便upload属性】
     */
    ACTIVE_ATTRIBUTES: 0x8b89, // Passed to getProgramParameter to get the number of attributes active in a program.
    /**
     * 获取program里可用的uniforms，【map到program里方便upload属性】
     */
    ACTIVE_UNIFORMS: 0x8b86, // Passed to getProgramParamter to get the number of uniforms active in a program.
    MAX_VERTEX_ATTRIBS: 0x8869,
    MAX_VERTEX_UNIFORM_VECTORS: 0x8dfb,
    MAX_VARYING_VECTORS: 0x8dfc,
    MAX_COMBINED_TEXTURE_IMAGE_UNITS: 0x8b4d,
    MAX_VERTEX_TEXTURE_IMAGE_UNITS: 0x8b4c,
    MAX_TEXTURE_IMAGE_UNITS: 0x8872, // Implementation dependent number of maximum texture units. At least 8.
    MAX_FRAGMENT_UNIFORM_VECTORS: 0x8dfd,
    SHADER_TYPE: 0x8b4f,
    SHADING_LANGUAGE_VERSION: 0x8b8c,
    CURRENT_PROGRAM: 0x8b8d,

    // Depth or stencil tests
    // Constants passed to depthFunc() or stencilFunc().

    NEVER: 0x0200, //  Passed to depthFunction or stencilFunction to specify depth or stencil tests will never pass. i.e. Nothing will be drawn.
    ALWAYS: 0x0207, //  Passed to depthFunction or stencilFunction to specify depth or stencil tests will always pass. i.e. Pixels will be drawn in the order they are drawn.
    LESS: 0x0201, //  Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than the stored value.
    EQUAL: 0x0202, //  Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is equals to the stored value.
    /**
     * 测试对比条件，当参考值小于等于模板值时，通过测试，常用于深度测试
     * Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than or equal to the stored value.
     */
    LEQUAL: 0x0203,
    /**
     * 测试对比条件，当参考值大于模版值时，通过测试
     * Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than the stored value.
     */
    GREATER: 0x0204,
    GEQUAL: 0x0206, //  Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than or equal to the stored value.
    NOTEQUAL: 0x0205, //  Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is not equal to the stored value.

    // Stencil actions
    // Constants passed to stencilOp().

    KEEP: 0x1e00,
    REPLACE: 0x1e01,
    INCR: 0x1e02,
    DECR: 0x1e03,
    INVERT: 0x150a,
    INCR_WRAP: 0x8507,
    DECR_WRAP: 0x8508,

    // Textures
    // Constants passed to texParameteri(),
    // texParameterf(), bindTexture(), texImage2D(), and others.

    NEAREST: 0x2600,
    LINEAR: 0x2601,
    NEAREST_MIPMAP_NEAREST: 0x2700,
    LINEAR_MIPMAP_NEAREST: 0x2701,
    NEAREST_MIPMAP_LINEAR: 0x2702,
    LINEAR_MIPMAP_LINEAR: 0x2703,
    TEXTURE_MAG_FILTER: 0x2800,
    TEXTURE_MIN_FILTER: 0x2801,
    TEXTURE_WRAP_S: 0x2802,
    TEXTURE_WRAP_T: 0x2803,
    TEXTURE_2D: 0x0de1,
    TEXTURE: 0x1702,
    TEXTURE_CUBE_MAP: 0x8513,
    TEXTURE_BINDING_CUBE_MAP: 0x8514,
    TEXTURE_CUBE_MAP_POSITIVE_X: 0x8515,
    TEXTURE_CUBE_MAP_NEGATIVE_X: 0x8516,
    TEXTURE_CUBE_MAP_POSITIVE_Y: 0x8517,
    TEXTURE_CUBE_MAP_NEGATIVE_Y: 0x8518,
    TEXTURE_CUBE_MAP_POSITIVE_Z: 0x8519,
    TEXTURE_CUBE_MAP_NEGATIVE_Z: 0x851a,
    MAX_CUBE_MAP_TEXTURE_SIZE: 0x851c,
    // TEXTURE0 - 31 0x84C0 - 0x84DF A texture unit.
    TEXTURE0: 0x84c0, // A texture unit.
    TEXTURE1: 0x84c1,
    TEXTURE2: 0x84c2,
    TEXTURE3: 0x84c3,
    TEXTURE4: 0x84c4,
    TEXTURE5: 0x84c5,
    TEXTURE6: 0x84c6,
    TEXTURE7: 0x84c7,
    TEXTURE8: 0x84c8,
    TEXTURE9: 0x84c9,
    TEXTURE10: 0x84ca,
    TEXTURE11: 0x84cb,
    TEXTURE12: 0x84cc,
    TEXTURE13: 0x84cd,
    TEXTURE14: 0x84ce,
    TEXTURE15: 0x84cf,
    TEXTURE16: 0x84d0,
    TEXTURE17: 0x84d1,
    TEXTURE18: 0x84d2,
    TEXTURE19: 0x84d3,
    TEXTURE20: 0x84d4,
    TEXTURE21: 0x84d5,
    TEXTURE22: 0x84d6,
    TEXTURE23: 0x84d7,
    TEXTURE24: 0x84d8,
    TEXTURE25: 0x84d9,
    TEXTURE26: 0x84da,
    TEXTURE27: 0x84db,
    TEXTURE28: 0x84dc,
    TEXTURE29: 0x84dd,
    TEXTURE30: 0x84de,
    TEXTURE31: 0x84df,
    // The current active texture unit.
    ACTIVE_TEXTURE: 0x84e0,
    REPEAT: 0x2901,
    CLAMP_TO_EDGE: 0x812f,
    MIRRORED_REPEAT: 0x8370,

    // Emulation
    TEXTURE_WIDTH: 0x1000,
    TEXTURE_HEIGHT: 0x1001,

    // Uniform types

    FLOAT_VEC2: 0x8b50,
    FLOAT_VEC3: 0x8b51,
    FLOAT_VEC4: 0x8b52,
    INT_VEC2: 0x8b53,
    INT_VEC3: 0x8b54,
    INT_VEC4: 0x8b55,
    BOOL: 0x8b56,
    BOOL_VEC2: 0x8b57,
    BOOL_VEC3: 0x8b58,
    BOOL_VEC4: 0x8b59,
    FLOAT_MAT2: 0x8b5a,
    FLOAT_MAT3: 0x8b5b,
    FLOAT_MAT4: 0x8b5c,
    SAMPLER_2D: 0x8b5e,
    SAMPLER_CUBE: 0x8b60,

    // Shader precision-specified types

    LOW_FLOAT: 0x8df0,
    MEDIUM_FLOAT: 0x8df1,
    HIGH_FLOAT: 0x8df2,
    LOW_INT: 0x8df3,
    MEDIUM_INT: 0x8df4,
    HIGH_INT: 0x8df5,

    // Framebuffers and renderbuffers
    /**
     * 绑定framebuffer
     */
    FRAMEBUFFER: 0x8d40,
    /**
     * 绑定 renderbuffer
     */
    RENDERBUFFER: 0x8d41,
    RGBA4: 0x8056,
    RGB5_A1: 0x8057,
    RGB565: 0x8d62,
    DEPTH_COMPONENT16: 0x81a5,
    STENCIL_INDEX: 0x1901,
    STENCIL_INDEX8: 0x8d48,
    /**
     * 一般用于 bufferStorage，支持深度和缓冲区数据存储
     */
    DEPTH_STENCIL: 0x84f9,
    RENDERBUFFER_WIDTH: 0x8d42,
    RENDERBUFFER_HEIGHT: 0x8d43,
    RENDERBUFFER_INTERNAL_FORMAT: 0x8d44,
    RENDERBUFFER_RED_SIZE: 0x8d50,
    RENDERBUFFER_GREEN_SIZE: 0x8d51,
    RENDERBUFFER_BLUE_SIZE: 0x8d52,
    RENDERBUFFER_ALPHA_SIZE: 0x8d53,
    RENDERBUFFER_DEPTH_SIZE: 0x8d54,
    RENDERBUFFER_STENCIL_SIZE: 0x8d55,
    FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE: 0x8cd0,
    FRAMEBUFFER_ATTACHMENT_OBJECT_NAME: 0x8cd1,
    FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL: 0x8cd2,
    FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE: 0x8cd3,
    COLOR_ATTACHMENT0: 0x8ce0,
    DEPTH_ATTACHMENT: 0x8d00,
    STENCIL_ATTACHMENT: 0x8d20,
    /**
     * 深度和缓冲区附着，webgl2支持
     */
    DEPTH_STENCIL_ATTACHMENT: 0x821a,
    NONE: 0,
    FRAMEBUFFER_COMPLETE: 0x8cd5,
    FRAMEBUFFER_INCOMPLETE_ATTACHMENT: 0x8cd6,
    FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: 0x8cd7,
    FRAMEBUFFER_INCOMPLETE_DIMENSIONS: 0x8cd9,
    FRAMEBUFFER_UNSUPPORTED: 0x8cdd,
    FRAMEBUFFER_BINDING: 0x8ca6,
    RENDERBUFFER_BINDING: 0x8ca7,
    MAX_RENDERBUFFER_SIZE: 0x84e8,
    INVALID_FRAMEBUFFER_OPERATION: 0x0506,

    READ_FRAMEBUFFER: 0x8ca8,
    DRAW_FRAMEBUFFER: 0x8ca9,

    // Pixel storage modes
    // Constants passed to pixelStorei().

    UNPACK_FLIP_Y_WEBGL: 0x9240,
    UNPACK_PREMULTIPLY_ALPHA_WEBGL: 0x9241,
    UNPACK_COLORSPACE_CONVERSION_WEBGL: 0x9243,

    // /////////////////////////////////////////////////////
    // Additional constants defined WebGL 2
    // These constants are defined on the WebGL2RenderingContext interface.
    // All WebGL 1 constants are also available in a WebGL 2 context.
    // /////////////////////////////////////////////////////

    // Getting GL parameter information
    // Constants passed to getParameter()
    // to specify what information to return.

    READ_BUFFER: 0x0c02,
    UNPACK_ROW_LENGTH: 0x0cf2,
    UNPACK_SKIP_ROWS: 0x0cf3,
    UNPACK_SKIP_PIXELS: 0x0cf4,
    PACK_ROW_LENGTH: 0x0d02,
    PACK_SKIP_ROWS: 0x0d03,
    PACK_SKIP_PIXELS: 0x0d04,
    // TEXTURE_BINDING_3D: 0x806A,
    UNPACK_SKIP_IMAGES: 0x806d,
    UNPACK_IMAGE_HEIGHT: 0x806e,
    MAX_3D_TEXTURE_SIZE: 0x8073,
    MAX_ELEMENTS_VERTICES: 0x80e8,
    MAX_ELEMENTS_INDICES: 0x80e9,
    MAX_TEXTURE_LOD_BIAS: 0x84fd,
    MAX_FRAGMENT_UNIFORM_COMPONENTS: 0x8b49,
    MAX_VERTEX_UNIFORM_COMPONENTS: 0x8b4a,
    MAX_ARRAY_TEXTURE_LAYERS: 0x88ff,
    MIN_PROGRAM_TEXEL_OFFSET: 0x8904,
    MAX_PROGRAM_TEXEL_OFFSET: 0x8905,
    MAX_VARYING_COMPONENTS: 0x8b4b,
    FRAGMENT_SHADER_DERIVATIVE_HINT: 0x8b8b,
    RASTERIZER_DISCARD: 0x8c89,
    VERTEX_ARRAY_BINDING: 0x85b5,
    MAX_VERTEX_OUTPUT_COMPONENTS: 0x9122,
    MAX_FRAGMENT_INPUT_COMPONENTS: 0x9125,
    MAX_SERVER_WAIT_TIMEOUT: 0x9111,
    MAX_ELEMENT_INDEX: 0x8d6b,

    // Textures
    // Constants passed to texParameteri(),
    // texParameterf(), bindTexture(), texImage2D(), and others.

    RED: 0x1903,
    RGB8: 0x8051,
    RGBA8: 0x8058,
    RGB10_A2: 0x8059,
    TEXTURE_3D: 0x806f,
    TEXTURE_WRAP_R: 0x8072,
    TEXTURE_MIN_LOD: 0x813a,
    TEXTURE_MAX_LOD: 0x813b,
    TEXTURE_BASE_LEVEL: 0x813c,
    TEXTURE_MAX_LEVEL: 0x813d,
    TEXTURE_COMPARE_MODE: 0x884c,
    TEXTURE_COMPARE_FUNC: 0x884d,
    SRGB: 0x8c40,
    SRGB8: 0x8c41,
    SRGB8_ALPHA8: 0x8c43,
    COMPARE_REF_TO_TEXTURE: 0x884e,
    RGBA32F: 0x8814,
    RGB32F: 0x8815,
    RGBA16F: 0x881a,
    RGB16F: 0x881b,
    TEXTURE_2D_ARRAY: 0x8c1a,
    TEXTURE_BINDING_2D_ARRAY: 0x8c1d,
    TEXTURE_BINDING_3D: 0x806a,
    R11F_G11F_B10F: 0x8c3a,
    RGB9_E5: 0x8c3d,
    RGBA32UI: 0x8d70,
    RGB32UI: 0x8d71,
    RGBA16UI: 0x8d76,
    RGB16UI: 0x8d77,
    RGBA8UI: 0x8d7c,
    RGB8UI: 0x8d7d,
    RGBA32I: 0x8d82,
    RGB32I: 0x8d83,
    RGBA16I: 0x8d88,
    RGB16I: 0x8d89,
    RGBA8I: 0x8d8e,
    RGB8I: 0x8d8f,
    RED_INTEGER: 0x8d94,
    RGB_INTEGER: 0x8d98,
    RGBA_INTEGER: 0x8d99,
    R8: 0x8229,
    RG8: 0x822b,
    R16F: 0x822d,
    R32F: 0x822e,
    RG16F: 0x822f,
    RG32F: 0x8230,
    R8I: 0x8231,
    R8UI: 0x8232,
    R16I: 0x8233,
    R16UI: 0x8234,
    R32I: 0x8235,
    R32UI: 0x8236,
    RG8I: 0x8237,
    RG8UI: 0x8238,
    RG16I: 0x8239,
    RG16UI: 0x823a,
    RG32I: 0x823b,
    RG32UI: 0x823c,
    R8_SNORM: 0x8f94,
    RG8_SNORM: 0x8f95,
    RGB8_SNORM: 0x8f96,
    RGBA8_SNORM: 0x8f97,
    RGB10_A2UI: 0x906f,

    /* covered by extension
    COMPRESSED_R11_EAC : 0x9270,
    COMPRESSED_SIGNED_R11_EAC: 0x9271,
    COMPRESSED_RG11_EAC: 0x9272,
    COMPRESSED_SIGNED_RG11_EAC : 0x9273,
    COMPRESSED_RGB8_ETC2 : 0x9274,
    COMPRESSED_SRGB8_ETC2: 0x9275,
    COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2 : 0x9276,
    COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC : 0x9277,
    COMPRESSED_RGBA8_ETC2_EAC: 0x9278,
    COMPRESSED_SRGB8_ALPHA8_ETC2_EAC : 0x9279,
    */
    TEXTURE_IMMUTABLE_FORMAT: 0x912f,
    TEXTURE_IMMUTABLE_LEVELS: 0x82df,

    // Pixel types

    UNSIGNED_INT_2_10_10_10_REV: 0x8368,
    UNSIGNED_INT_10F_11F_11F_REV: 0x8c3b,
    UNSIGNED_INT_5_9_9_9_REV: 0x8c3e,
    FLOAT_32_UNSIGNED_INT_24_8_REV: 0x8dad,
    UNSIGNED_INT_24_8: 0x84fa,
    HALF_FLOAT: 0x140b,
    RG: 0x8227,
    RG_INTEGER: 0x8228,
    INT_2_10_10_10_REV: 0x8d9f,

    // Queries

    CURRENT_QUERY: 0x8865,
    QUERY_RESULT: 0x8866,
    QUERY_RESULT_AVAILABLE: 0x8867,
    ANY_SAMPLES_PASSED: 0x8c2f,
    ANY_SAMPLES_PASSED_CONSERVATIVE: 0x8d6a,

    // Draw buffers

    MAX_DRAW_BUFFERS: 0x8824,
    DRAW_BUFFER0: 0x8825,
    DRAW_BUFFER1: 0x8826,
    DRAW_BUFFER2: 0x8827,
    DRAW_BUFFER3: 0x8828,
    DRAW_BUFFER4: 0x8829,
    DRAW_BUFFER5: 0x882a,
    DRAW_BUFFER6: 0x882b,
    DRAW_BUFFER7: 0x882c,
    DRAW_BUFFER8: 0x882d,
    DRAW_BUFFER9: 0x882e,
    DRAW_BUFFER10: 0x882f,
    DRAW_BUFFER11: 0x8830,
    DRAW_BUFFER12: 0x8831,
    DRAW_BUFFER13: 0x8832,
    DRAW_BUFFER14: 0x8833,
    DRAW_BUFFER15: 0x8834,
    MAX_COLOR_ATTACHMENTS: 0x8cdf,
    COLOR_ATTACHMENT1: 0x8ce1,
    COLOR_ATTACHMENT2: 0x8ce2,
    COLOR_ATTACHMENT3: 0x8ce3,
    COLOR_ATTACHMENT4: 0x8ce4,
    COLOR_ATTACHMENT5: 0x8ce5,
    COLOR_ATTACHMENT6: 0x8ce6,
    COLOR_ATTACHMENT7: 0x8ce7,
    COLOR_ATTACHMENT8: 0x8ce8,
    COLOR_ATTACHMENT9: 0x8ce9,
    COLOR_ATTACHMENT10: 0x8cea,
    COLOR_ATTACHMENT11: 0x8ceb,
    COLOR_ATTACHMENT12: 0x8cec,
    COLOR_ATTACHMENT13: 0x8ced,
    COLOR_ATTACHMENT14: 0x8cee,
    COLOR_ATTACHMENT15: 0x8cef,

    // Samplers

    SAMPLER_3D: 0x8b5f,
    SAMPLER_2D_SHADOW: 0x8b62,
    SAMPLER_2D_ARRAY: 0x8dc1,
    SAMPLER_2D_ARRAY_SHADOW: 0x8dc4,
    SAMPLER_CUBE_SHADOW: 0x8dc5,
    INT_SAMPLER_2D: 0x8dca,
    INT_SAMPLER_3D: 0x8dcb,
    INT_SAMPLER_CUBE: 0x8dcc,
    INT_SAMPLER_2D_ARRAY: 0x8dcf,
    UNSIGNED_INT_SAMPLER_2D: 0x8dd2,
    UNSIGNED_INT_SAMPLER_3D: 0x8dd3,
    UNSIGNED_INT_SAMPLER_CUBE: 0x8dd4,
    UNSIGNED_INT_SAMPLER_2D_ARRAY: 0x8dd7,
    MAX_SAMPLES: 0x8d57,
    SAMPLER_BINDING: 0x8919,

    // Buffers

    PIXEL_PACK_BUFFER: 0x88eb,
    PIXEL_UNPACK_BUFFER: 0x88ec,
    PIXEL_PACK_BUFFER_BINDING: 0x88ed,
    PIXEL_UNPACK_BUFFER_BINDING: 0x88ef,
    COPY_READ_BUFFER: 0x8f36,
    COPY_WRITE_BUFFER: 0x8f37,
    COPY_READ_BUFFER_BINDING: 0x8f36,
    COPY_WRITE_BUFFER_BINDING: 0x8f37,

    // Data types

    FLOAT_MAT2x3: 0x8b65,
    FLOAT_MAT2x4: 0x8b66,
    FLOAT_MAT3x2: 0x8b67,
    FLOAT_MAT3x4: 0x8b68,
    FLOAT_MAT4x2: 0x8b69,
    FLOAT_MAT4x3: 0x8b6a,
    UNSIGNED_INT_VEC2: 0x8dc6,
    UNSIGNED_INT_VEC3: 0x8dc7,
    UNSIGNED_INT_VEC4: 0x8dc8,
    UNSIGNED_NORMALIZED: 0x8c17,
    SIGNED_NORMALIZED: 0x8f9c,

    // Vertex attributes

    VERTEX_ATTRIB_ARRAY_INTEGER: 0x88fd,
    VERTEX_ATTRIB_ARRAY_DIVISOR: 0x88fe,

    // Transform feedback

    TRANSFORM_FEEDBACK_BUFFER_MODE: 0x8c7f,
    MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS: 0x8c80,
    TRANSFORM_FEEDBACK_VARYINGS: 0x8c83,
    TRANSFORM_FEEDBACK_BUFFER_START: 0x8c84,
    TRANSFORM_FEEDBACK_BUFFER_SIZE: 0x8c85,
    TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN: 0x8c88,
    MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS: 0x8c8a,
    MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS: 0x8c8b,
    INTERLEAVED_ATTRIBS: 0x8c8c,
    SEPARATE_ATTRIBS: 0x8c8d,
    TRANSFORM_FEEDBACK_BUFFER: 0x8c8e,
    TRANSFORM_FEEDBACK_BUFFER_BINDING: 0x8c8f,
    TRANSFORM_FEEDBACK: 0x8e22,
    TRANSFORM_FEEDBACK_PAUSED: 0x8e23,
    TRANSFORM_FEEDBACK_ACTIVE: 0x8e24,
    TRANSFORM_FEEDBACK_BINDING: 0x8e25,

    // Framebuffers and renderbuffers

    FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING: 0x8210,
    FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE: 0x8211,
    FRAMEBUFFER_ATTACHMENT_RED_SIZE: 0x8212,
    FRAMEBUFFER_ATTACHMENT_GREEN_SIZE: 0x8213,
    FRAMEBUFFER_ATTACHMENT_BLUE_SIZE: 0x8214,
    FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE: 0x8215,
    FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE: 0x8216,
    FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE: 0x8217,
    FRAMEBUFFER_DEFAULT: 0x8218,
    // DEPTH_STENCIL_ATTACHMENT : 0x821A,
    // DEPTH_STENCIL: 0x84F9,
    DEPTH24_STENCIL8: 0x88f0,
    DRAW_FRAMEBUFFER_BINDING: 0x8ca6,
    // READ_FRAMEBUFFER : 0x8CA8,
    // DRAW_FRAMEBUFFER : 0x8CA9,
    READ_FRAMEBUFFER_BINDING: 0x8caa,
    RENDERBUFFER_SAMPLES: 0x8cab,
    FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER: 0x8cd4,
    FRAMEBUFFER_INCOMPLETE_MULTISAMPLE: 0x8d56,

    // Uniforms

    UNIFORM_BUFFER: 0x8a11,
    UNIFORM_BUFFER_BINDING: 0x8a28,
    UNIFORM_BUFFER_START: 0x8a29,
    UNIFORM_BUFFER_SIZE: 0x8a2a,
    MAX_VERTEX_UNIFORM_BLOCKS: 0x8a2b,
    MAX_FRAGMENT_UNIFORM_BLOCKS: 0x8a2d,
    MAX_COMBINED_UNIFORM_BLOCKS: 0x8a2e,
    MAX_UNIFORM_BUFFER_BINDINGS: 0x8a2f,
    MAX_UNIFORM_BLOCK_SIZE: 0x8a30,
    MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS: 0x8a31,
    MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS: 0x8a33,
    UNIFORM_BUFFER_OFFSET_ALIGNMENT: 0x8a34,
    ACTIVE_UNIFORM_BLOCKS: 0x8a36,
    UNIFORM_TYPE: 0x8a37,
    UNIFORM_SIZE: 0x8a38,
    UNIFORM_BLOCK_INDEX: 0x8a3a,
    UNIFORM_OFFSET: 0x8a3b,
    UNIFORM_ARRAY_STRIDE: 0x8a3c,
    UNIFORM_MATRIX_STRIDE: 0x8a3d,
    UNIFORM_IS_ROW_MAJOR: 0x8a3e,
    UNIFORM_BLOCK_BINDING: 0x8a3f,
    UNIFORM_BLOCK_DATA_SIZE: 0x8a40,
    UNIFORM_BLOCK_ACTIVE_UNIFORMS: 0x8a42,
    UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES: 0x8a43,
    UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER: 0x8a44,
    UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER: 0x8a46,

    // Sync objects

    OBJECT_TYPE: 0x9112,
    SYNC_CONDITION: 0x9113,
    SYNC_STATUS: 0x9114,
    SYNC_FLAGS: 0x9115,
    SYNC_FENCE: 0x9116,
    SYNC_GPU_COMMANDS_COMPLETE: 0x9117,
    UNSIGNALED: 0x9118,
    SIGNALED: 0x9119,
    ALREADY_SIGNALED: 0x911a,
    TIMEOUT_EXPIRED: 0x911b,
    CONDITION_SATISFIED: 0x911c,
    WAIT_FAILED: 0x911d,
    SYNC_FLUSH_COMMANDS_BIT: 0x00000001,

    // Miscellaneous constants

    COLOR: 0x1800,
    DEPTH: 0x1801,
    STENCIL: 0x1802,
    MIN: 0x8007,
    MAX: 0x8008,
    DEPTH_COMPONENT24: 0x81a6,
    STREAM_READ: 0x88e1,
    STREAM_COPY: 0x88e2,
    STATIC_READ: 0x88e5,
    STATIC_COPY: 0x88e6,
    DYNAMIC_READ: 0x88e9,
    DYNAMIC_COPY: 0x88ea,
    DEPTH_COMPONENT32F: 0x8cac,
    DEPTH32F_STENCIL8: 0x8cad,
    INVALID_INDEX: 0xffffffff,
    TIMEOUT_IGNORED: -1,
    MAX_CLIENT_WAIT_TIMEOUT_WEBGL: 0x9247,

    // Constants defined in WebGL extensions

    // ANGLE_instanced_arrays

    VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE: 0x88fe, // Describes the frequency divisor used for instanced rendering.

    // WEBGL_debug_renderer_info

    UNMASKED_VENDOR_WEBGL: 0x9245, // Passed to getParameter to get the vendor string of the graphics driver.
    UNMASKED_RENDERER_WEBGL: 0x9246, // Passed to getParameter to get the renderer string of the graphics driver.

    // EXT_texture_filter_anisotropic

    MAX_TEXTURE_MAX_ANISOTROPY_EXT: 0x84ff, // Returns the maximum available anisotropy.
    TEXTURE_MAX_ANISOTROPY_EXT: 0x84fe, // Passed to texParameter to set the desired maximum anisotropy for a texture.

    // WEBGL_compressed_texture_s3tc

    COMPRESSED_RGB_S3TC_DXT1_EXT: 0x83f0, // A DXT1-compressed image in an RGB image format.
    COMPRESSED_RGBA_S3TC_DXT1_EXT: 0x83f1, // A DXT1-compressed image in an RGB image format with a simple on/off alpha value.
    COMPRESSED_RGBA_S3TC_DXT3_EXT: 0x83f2, // A DXT3-compressed image in an RGBA image format. Compared to a 32-bit RGBA texture, it offers 4:1 compression.
    COMPRESSED_RGBA_S3TC_DXT5_EXT: 0x83f3, // A DXT5-compressed image in an RGBA image format. It also provides a 4:1 compression, but differs to the DXT3 compression in how the alpha compression is done.

    // WEBGL_compressed_texture_es3

    COMPRESSED_R11_EAC: 0x9270, // One-channel (red) unsigned format compression.
    COMPRESSED_SIGNED_R11_EAC: 0x9271, // One-channel (red) signed format compression.
    COMPRESSED_RG11_EAC: 0x9272, // Two-channel (red and green) unsigned format compression.
    COMPRESSED_SIGNED_RG11_EAC: 0x9273, // Two-channel (red and green) signed format compression.
    COMPRESSED_RGB8_ETC2: 0x9274, // Compresses RBG8 data with no alpha channel.
    COMPRESSED_RGBA8_ETC2_EAC: 0x9275, // Compresses RGBA8 data. The RGB part is encoded the same as RGB_ETC2, but the alpha part is encoded separately.
    COMPRESSED_SRGB8_ETC2: 0x9276, // Compresses sRBG8 data with no alpha channel.
    COMPRESSED_SRGB8_ALPHA8_ETC2_EAC: 0x9277, // Compresses sRGBA8 data. The sRGB part is encoded the same as SRGB_ETC2, but the alpha part is encoded separately.
    COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2: 0x9278, // Similar to RGB8_ETC, but with ability to punch through the alpha channel, which means to make it completely opaque or transparent.
    COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2: 0x9279, // Similar to SRGB8_ETC, but with ability to punch through the alpha channel, which means to make it completely opaque or transparent.

    // WEBGL_compressed_texture_pvrtc

    COMPRESSED_RGB_PVRTC_4BPPV1_IMG: 0x8c00, // RGB compression in 4-bit mode. One block for each 4×4 pixels.
    COMPRESSED_RGBA_PVRTC_4BPPV1_IMG: 0x8c02, // RGBA compression in 4-bit mode. One block for each 4×4 pixels.
    COMPRESSED_RGB_PVRTC_2BPPV1_IMG: 0x8c01, // RGB compression in 2-bit mode. One block for each 8×4 pixels.
    COMPRESSED_RGBA_PVRTC_2BPPV1_IMG: 0x8c03, // RGBA compression in 2-bit mode. One block for each 8×4 pixe

    // WEBGL_compressed_texture_etc1

    COMPRESSED_RGB_ETC1_WEBGL: 0x8d64, // Compresses 24-bit RGB data with no alpha channel.

    // WEBGL_compressed_texture_atc

    COMPRESSED_RGB_ATC_WEBGL: 0x8c92, //  Compresses RGB textures with no alpha channel.
    COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL: 0x8c92, // Compresses RGBA textures using explicit alpha encoding (useful when alpha transitions are sharp).
    COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL: 0x87ee, // Compresses RGBA textures using interpolated alpha encoding (useful when alpha transitions are gradient).

    // WEBGL_depth_texture

    UNSIGNED_INT_24_8_WEBGL: 0x84fa, // Unsigned integer type for 24-bit depth texture data.

    // OES_texture_half_float

    HALF_FLOAT_OES: 0x8d61, // Half floating-point type (16-bit).

    // WEBGL_color_buffer_float

    RGBA32F_EXT: 0x8814, // RGBA 32-bit floating-point color-renderable format.
    RGB32F_EXT: 0x8815, // RGB 32-bit floating-point color-renderable format.
    FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE_EXT: 0x8211,
    UNSIGNED_NORMALIZED_EXT: 0x8c17,

    // EXT_blend_minmax

    MIN_EXT: 0x8007, // Produces the minimum color components of the source and destination colors.
    MAX_EXT: 0x8008, // Produces the maximum color components of the source and destination colors.

    // EXT_sRGB

    SRGB_EXT: 0x8c40, // Unsized sRGB format that leaves the precision up to the driver.
    SRGB_ALPHA_EXT: 0x8c42, // Unsized sRGB format with unsized alpha component.
    SRGB8_ALPHA8_EXT: 0x8c43, // Sized (8-bit) sRGB and alpha formats.
    FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING_EXT: 0x8210, // Returns the framebuffer color encoding.

    // OES_standard_derivatives

    FRAGMENT_SHADER_DERIVATIVE_HINT_OES: 0x8b8b, // Indicates the accuracy of the derivative calculation for the GLSL built-in functions: dFdx, dFdy, and fwidth.

    // WEBGL_draw_buffers

    COLOR_ATTACHMENT0_WEBGL: 0x8ce0, // Framebuffer color attachment point
    COLOR_ATTACHMENT1_WEBGL: 0x8ce1, // Framebuffer color attachment point
    COLOR_ATTACHMENT2_WEBGL: 0x8ce2, // Framebuffer color attachment point
    COLOR_ATTACHMENT3_WEBGL: 0x8ce3, // Framebuffer color attachment point
    COLOR_ATTACHMENT4_WEBGL: 0x8ce4, // Framebuffer color attachment point
    COLOR_ATTACHMENT5_WEBGL: 0x8ce5, // Framebuffer color attachment point
    COLOR_ATTACHMENT6_WEBGL: 0x8ce6, // Framebuffer color attachment point
    COLOR_ATTACHMENT7_WEBGL: 0x8ce7, // Framebuffer color attachment point
    COLOR_ATTACHMENT8_WEBGL: 0x8ce8, // Framebuffer color attachment point
    COLOR_ATTACHMENT9_WEBGL: 0x8ce9, // Framebuffer color attachment point
    COLOR_ATTACHMENT10_WEBGL: 0x8cea, // Framebuffer color attachment point
    COLOR_ATTACHMENT11_WEBGL: 0x8ceb, // Framebuffer color attachment point
    COLOR_ATTACHMENT12_WEBGL: 0x8cec, // Framebuffer color attachment point
    COLOR_ATTACHMENT13_WEBGL: 0x8ced, // Framebuffer color attachment point
    COLOR_ATTACHMENT14_WEBGL: 0x8cee, // Framebuffer color attachment point
    COLOR_ATTACHMENT15_WEBGL: 0x8cef, // Framebuffer color attachment point
    DRAW_BUFFER0_WEBGL: 0x8825, // Draw buffer
    DRAW_BUFFER1_WEBGL: 0x8826, // Draw buffer
    DRAW_BUFFER2_WEBGL: 0x8827, // Draw buffer
    DRAW_BUFFER3_WEBGL: 0x8828, // Draw buffer
    DRAW_BUFFER4_WEBGL: 0x8829, // Draw buffer
    DRAW_BUFFER5_WEBGL: 0x882a, // Draw buffer
    DRAW_BUFFER6_WEBGL: 0x882b, // Draw buffer
    DRAW_BUFFER7_WEBGL: 0x882c, // Draw buffer
    DRAW_BUFFER8_WEBGL: 0x882d, // Draw buffer
    DRAW_BUFFER9_WEBGL: 0x882e, // Draw buffer
    DRAW_BUFFER10_WEBGL: 0x882f, // Draw buffer
    DRAW_BUFFER11_WEBGL: 0x8830, // Draw buffer
    DRAW_BUFFER12_WEBGL: 0x8831, // Draw buffer
    DRAW_BUFFER13_WEBGL: 0x8832, // Draw buffer
    DRAW_BUFFER14_WEBGL: 0x8833, // Draw buffer
    DRAW_BUFFER15_WEBGL: 0x8834, // Draw buffer

    MAX_COLOR_ATTACHMENTS_WEBGL: 0x8cdf, // Maximum number of framebuffer color attachment points
    MAX_DRAW_BUFFERS_WEBGL: 0x8824, // Maximum number of draw buffers

    // OES_vertex_array_object

    VERTEX_ARRAY_BINDING_OES: 0x85b5, // The bound vertex array object (VAO).

    // EXT_disjoint_timer_query

    QUERY_COUNTER_BITS_EXT: 0x8864, // The number of bits used to hold the query result for the given target.
    CURRENT_QUERY_EXT: 0x8865, // The currently active query.
    QUERY_RESULT_EXT: 0x8866, // The query result.
    QUERY_RESULT_AVAILABLE_EXT: 0x8867, // A Boolean indicating whether or not a query result is available.
    TIME_ELAPSED_EXT: 0x88bf, // Elapsed time (in nanoseconds).
    TIMESTAMP_EXT: 0x8e28, // The current time.
    GPU_DISJOINT_EXT: 0x8fbb, // A Boolean indicating whether or not the GPU performed any disjoint operation.
};

export default GLConstants;
/*eslint-enable camelcase*/
