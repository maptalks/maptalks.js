
/**
 * 处理改变全局状态的操心
 * 需要在draw执行完后，复原之前的状态
 */
/**
 * 需要记录前序状态的操作
 */
const OVERRAL_TINY_ENUM = {
    //'texParameteri': true,
    //'texImage2D': true,
    //'depthFunc': true,
    //'clearColor': true,
    //'clearDepth': true,
    //'clear': true,
    //'clearStencil': true,
    //'frontFace': true,
    //'cullFace': true,
    //'generateMipmap': true,
    //'pixelStorei': true,
    'activeTexture': true,
    //'blendEquationSeparate': true,
    //'blendFuncSeparate': true,
    'blendEquation': true,
    'blendFunc': true,
    'scissor': true,
    'stencilOp': true,
    'stencilFunc': true,
    'stencilMask': true,
    //'depthMask': true,
    //'colorMask': true,
    'texParameterf': true,
    'hint': true
};

class OverrallTiny{
    
}

module.exports ={
    OVERRAL_TINY_ENUM,
    OverrallTiny
}