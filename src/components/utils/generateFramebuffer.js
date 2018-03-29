
/**
 * 
 * @param {WebGLRenderingContext} gl 
 */
const generateFramebuffer = function(gl){
    //深度缓冲
    const deptFbo = gl.createFramebuffer();
    //给定深度贴图，通常解析度设置为1024
    const depthTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,depthTexture);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT,1024,1024,0,gl.DEPTH_COMPONENT,gl.FLOAT,null);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
    //将深度纹理贴图作为帧缓冲的深度缓冲
    gl.bindFramebuffer(gl.FRAMEBUFFER,deptFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,depthTexture,0);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    //1.渲染深度贴图
    gl.viewport(0,0,1024,1024);
    gl.bindFramebuffer(gl.FRAMEBUFFER,deptFbo);
    gl.clear(gl.DEPTH_BUFFER_BIT);
}

module.exports = generateFramebuffer;