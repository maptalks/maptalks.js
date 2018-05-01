
/**
 * reference:
 * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext
 * 
 * 具有返回对象的操作
 * -code 操作代码
 * -return 具有返回值的操作,特指需要返回代替索引的操作
 * -replace 需要使用新对象代替引用的操作
 * -ptIndex 替换参数的位置索引
 * -change 判断当前操作的program环境
 */

const merge = require('./../utils/merge');

const Encrypt_WebGLContext = {
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/canvas
     * @property
     */
    'canvas': { code: 0, return: 1, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/commit
     */
    'commit': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawingBufferWidth
     * @property
     */
    'drawingBufferWidth': { code: 0, return: 1, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawingBufferHeight
     * @property
     */
    'drawingBufferHeight': { code: 0, return: 1, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getContextAttributes
     */
    'getContextAttributes': { code: 0, return: 1, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/isContextLost
     */
    'isContextLost': { code: 0, return: 1, replace: 0 },
}

const Encrypt_Viewing_And_Clipping = {
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/scissor
     */
    'scissor': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/viewport
     */
    'viewport': { code: 0, return: 0, replace: 0 },
};

const Encrypt_State_Information = {
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/activeTexture
     */
    'activeTexture': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendColor
     */
    'blendColor': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendEquation
     */
    'blendEquation': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendEquationSeparate
     */
    'blendEquationSeparate': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFunc
     */
    'blendFunc': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFuncSeparate
     */
    'blendFuncSeparate': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearColor
     */
    'clearColor': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearDepth
     */
    'clearDepth': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearStencil
     */
    'clearStencil': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/colorMask
     */
    'colorMask': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/cullFace
     */
    'cullFace': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthFunc
     */
    'depthFunc': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthMask
     */
    'depthMask': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthRange
     */
    'depthRange': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/disable
     */
    'disable': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/enable
     */
    'enable': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/frontFace
     */
    'frontFace': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
     * @description 
     * warning return appropriate value by the parameter 'pname'
     */
    'getParameter': { code: 0, return: 1, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getError
     */
    'getError': { code: 0, return: 1, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/hint
     */
    'hint': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/isEnabled
     */
    'isEnabled': { code: 0, return: 1, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/lineWidth
     */
    'lineWidth': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/pixelStorei
     */
    'pixelStorei': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/polygonOffset
     */
    'polygonOffset': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/sampleCoverage
     */
    'sampleCoverage': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilFunc
     */
    'stencilFunc': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilFuncSeparate
     */
    'stencilFuncSeparate': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilMask
     */
    'stencilMask': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilMaskSeparate
     */
    'stencilMaskSeparate': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilOp
     */
    'stencilOp': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilOpSeparate
     */
    'stencilOpSeparate': { code: 0, return: 0, replace: 0 },
};

const Encrypt_Buffers = {
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindBuffer
     */
    'bindBuffer': { code: 0, return: 0, replace: 1, ptIndex: [1] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferData
     */
    'bufferData': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferSubData
     */
    'bufferSubData': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createBuffer
     */
    'createBuffer': { code: 0, return: 1, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/deleteBuffer
     */
    'deleteBuffer': { code: 0, return: 0, replace: 1, ptIndex: [0] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getBufferParameter
     */
    'getBufferParameter': { code: 0, return: 1, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/isBuffer
     */
    'isBuffer': { code: 0, return: 1, replace: 0 },
};

const Encrypt_Framebuffers = {
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindFramebuffer
     */
    'bindFramebuffer': { code: 0, return: 0, replace: 1, ptIndex: [1] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/checkFramebufferStatus
     */
    'checkFramebufferStatus': { code: 0, return: 1, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createFramebuffer
     */
    'createFramebuffer': { code: 0, return: 1, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/deleteFramebuffer
     */
    'deleteFramebuffer': { code: 0, return: 0, replace: 1, ptIndex: [0] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/framebufferRenderbuffer
     */
    'framebufferRenderbuffer': { code: 0, return: 0, replace: 1, ptIndex: [3] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/framebufferTexture2D
     */
    'framebufferTexture2D': { code: 0, return: 0, replace: 1, ptIndex: [3] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getFramebufferAttachmentParameter
     */
    'getFramebufferAttachmentParameter': { code: 0, return: 1, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/isFramebuffer
     */
    'isFramebuffer': { code: 0, return: 1, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/readPixels
     */
    'readPixels': { code: 0, return: 0, replace: 0 },
};

const Encrypt_Renderbuffers = {
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindRenderbuffer
     */
    'bindRenderbuffer': { code: 0, return: 0, replace: 1, ptIndex: [1] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createRenderbuffer
     */
    'createRenderbuffer': { code: 0, return: 1, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/deleteRenderbuffer
     */
    'deleteRenderbuffer': { code: 0, return: 0, replace: 1, ptIndex: [0] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getRenderbufferParameter
     */
    'getRenderbufferParameter': { code: 0, return: 1, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/isRenderbuffer
     */
    'isRenderbuffer': { code: 0, return: 1, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/renderbufferStorage
     */
    'renderbufferStorage': { code: 0, return: 0, replace: 0 },
};

const Encrypt_Textures = {
    /**
 * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindTexture
 */
    'bindTexture': { code: 0, return: 0, replace: 1, ptIndex: [1] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/compressedTexImage2D
     */
    'compressedTexImage2D': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/copyTexImage2D
     */
    'copyTexImage2D': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/copyTexSubImage2D
     */
    'copyTexSubImage2D': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createTexture
     */
    'createTexture': { code: 0, return: 1, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/deleteTexture
     */
    'deleteTexture': { code: 0, return: 0, replace: 1, ptIndex: [0] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/generateMipmap
     */
    'generateMipmap': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getTexParameter
     */
    'getTexParameter': { code: 0, return: 1, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/isTexture
     */
    'isTexture': { code: 0, return: 1, replace: 1, ptIndex: [0] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
     */
    'texImage2D': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texSubImage2D
     */
    'texSubImage2D': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
     */
    'texParameterf': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
     */
    'texParameteri': { code: 0, return: 0, replace: 0 },
};

const Encrypt_Programs_And_Shaders = {
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/attachShader
     * @augments
     */
    'attachShader': { code: 0, return: 0, replace: 2, ptIndex: [0, 1] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindAttribLocation
     * @augments
     */
    'bindAttribLocation': { code: 0, return: 0, replace: 1, ptIndex: [0] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/compileShader
     */
    'compileShader': { code: 0, return: 0, replace: 1, ptIndex: [0] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createProgram
     */
    'createProgram': { code: 0, return: 1, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createShader
     */
    'createShader': { code: 0, return: 1, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/deleteProgram
     */
    'deleteProgram': { code: 0, return: 0, replace: 1, ptIndex: [0] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/deleteShader
     */
    'deleteShader': { code: 0, return: 0, replace: 1, ptIndex: [0] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/detachShader
     */
    'detachShader': { code: 0, return: 0, replace: 2, ptIndex: [0, 1] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getAttachedShaders
     */
    'getAttachedShaders': { code: 0, return: 1, replace: 1, ptIndex: [0] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getProgramParameter
     */
    'getProgramParameter': { code: 0, return: 1, replace: 1, ptIndex: [0] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getProgramInfoLog
     */
    'getProgramInfoLog': { code: 0, return: 1, replace: 1, ptIndex: [0] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getShaderParameter
     */
    'getShaderParameter': { code: 0, return: 1, replace: 1, ptIndex: [0] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getShaderPrecisionFormat
     */
    'getShaderPrecisionFormat': { code: 0, return: 1, replace: [0] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getShaderInfoLog
     */
    'getShaderInfoLog': { code: 0, return: 1, replace: 1, ptIndex: [0] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getShaderSource
     */
    'getShaderSource': { code: 0, return: 1, replace: 1, ptIndex: [0] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/isProgram
     */
    'isProgram': { code: 0, return: 1, replace: 1, ptIndex: [0] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/isShader
     */
    'isShader': { code: 0, return: 1, replace: 1, ptIndex: [0] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/linkProgram
     */
    'linkProgram': { code: 0, return: 0, replace: 1, ptIndex: [0] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/shaderSource
     */
    'shaderSource': { code: 0, return: 0, replace: 1, ptIndex: [0] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/useProgram
     */
    'useProgram': { code: 0, return: 0, replace: 1, ptIndex: [0] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/validateProgram
     */
    'validateProgram': { code: 0, return: 0, replace: 1, ptIndex: [0] },
};

const Encrypt_Uniforms_And_Attributes = {
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/disableVertexAttribArray
     */
    'disableVertexAttribArray': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/enableVertexAttribArray
     */
    'enableVertexAttribArray': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getActiveAttrib
     */
    'getActiveAttrib': { code: 0, return: 1, replace: 1, ptIndex: [0] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getActiveUniform
     */
    'getActiveUniform': { code: 0, return: 1, replace: 1, ptIndex: [0] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getAttribLocation
     * }{ debug return directly,no need to cache,
     */
    'getAttribLocation': { code: 0, return: 0, replace: 1, ptIndex: [0] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getUniformLocation
     */
    'getUniformLocation': { code: 0, return: 1, replace: 1, ptIndex: [0] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getVertexAttrib
     */
    'getVertexAttrib': { code: 0, return: 1, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getVertexAttribOffset
     */
    'getVertexAttribOffset': { code: 0, return: 1, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
     */
    'vertexAttribPointer': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniformMatrix
     */
    'uniformMatrix2fv': { code: 0, return: 0, replace: 1, ptIndex: [0], change: 1 },
    'uniformMatrix3fv': { code: 0, return: 0, replace: 1, ptIndex: [0], change: 1 },
    'uniformMatrix4fv': { code: 0, return: 0, replace: 1, ptIndex: [0], change: 1 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniform
     */
    'uniform1f': { code: 0, return: 0, replace: 1, ptIndex: [0], change: 1 },
    'uniform1fv': { code: 0, return: 0, replace: 1, ptIndex: [0], change: 1 },
    'uniform1i': { code: 0, return: 0, replace: 1, ptIndex: [0], change: 1 },
    'uniform1iv': { code: 0, return: 0, replace: 1, ptIndex: [0], change: 1 },
    'uniform2f': { code: 0, return: 0, replace: 1, ptIndex: [0], change: 1 },
    'uniform2fv': { code: 0, return: 0, replace: 1, ptIndex: [0], change: 1 },
    'uniform2i': { code: 0, return: 0, replace: 1, ptIndex: [0], change: 1 },
    'uniform2iv': { code: 0, return: 0, replace: 1, ptIndex: [0], change: 1 },
    'uniform3f': { code: 0, return: 0, replace: 1, ptIndex: [0], change: 1 },
    'uniform3fv': { code: 0, return: 0, replace: 1, ptIndex: [0], change: 1 },
    'uniform3i': { code: 0, return: 0, replace: 1, ptIndex: [0], change: 1 },
    'uniform3iv': { code: 0, return: 0, replace: 1, ptIndex: [0], change: 1 },
    'uniform4f': { code: 0, return: 0, replace: 1, ptIndex: [0], change: 1 },
    'uniform4fv': { code: 0, return: 0, replace: 1, ptIndex: [0], change: 1 },
    'uniform4i': { code: 0, return: 0, replace: 1, ptIndex: [0], change: 1 },
    'uniform4iv': { code: 0, return: 0, replace: 1, ptIndex: [0], change: 1 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttrib
     */
    'vertexAttrib1f': { code: 0, return: 0, replace: 0 },
    'vertexAttrib2f': { code: 0, return: 0, replace: 0 },
    'vertexAttrib3f': { code: 0, return: 0, replace: 0 },
    'vertexAttrib4f': { code: 0, return: 0, replace: 0 },
    'vertexAttrib1fv': { code: 0, return: 0, replace: 0 },
    'vertexAttrib2fv': { code: 0, return: 0, replace: 0 },
    'vertexAttrib3fv': { code: 0, return: 0, replace: 0 },
    'vertexAttrib4fv': { code: 0, return: 0, replace: 0 },
};

const Encrypt_Drawing_Buffers = {
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clear
     */
    'clear': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawArrays
     */
    'drawArrays': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements
     */
    'drawElements': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/finish
     */
    'finish': { code: 0, return: 0, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/flush
     */
    'flush': { code: 0, return: 0, replace: 0 },
};

const Encrypt_Working_With_Extensions = {
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getSupportedExtensions
     */
    'getSupportedExtensions': { code: 0, return: 1, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getExtension
     */
    'getExtension': { code: 0, return: 1, replace: 0 },
}

/** 
 * only in webgl2
*/
const Experimental_Encrypt_Vertex_Array_Objects = {
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/createVertexArray
     */
    'createVertexArray': { code: 0, return: 1, replace: 0 },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/deleteVertexArray
     */
    'deleteVertexArray': { code: 0, return: 0, replace: 1, ptIndex: [0] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/isVertexArray
     */
    'isVertexArray': { code: 0, return: 0, replace: 1, ptIndex: [0] },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/bindVertexArray
     */
    'bindVertexArray': { code: 0, return: 0, replace: 1, ptIndex: [0] }
}

module.exports = merge({},
    Encrypt_Buffers,
    Encrypt_Drawing_Buffers,
    Encrypt_Framebuffers,
    Encrypt_Programs_And_Shaders,
    Encrypt_Renderbuffers,
    Encrypt_State_Information,
    Encrypt_Textures,
    Encrypt_Uniforms_And_Attributes,
    Encrypt_Viewing_And_Clipping,
    Encrypt_WebGLContext,
    Encrypt_Working_With_Extensions);