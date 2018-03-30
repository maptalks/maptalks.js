
/**
 * 
 * @param {WebGLRenderingContext} gl 
 */
const generateFramebuffer = function(gl){
    //创建帧缓冲对象
    const framebuffer = gl.createFramebuffer();
    //给定深度贴图，通常解析度设置为1024
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,800,600,0,gl.RGBA,gl.FLOAT,null);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    framebuffer.texture = texture;
    //创建缓冲区对象，并设置尺寸和参数
    const renderbuffer=gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER,renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,800,600);
    //以上构成帧缓冲的attach对象，现在将纹理和缓冲区对象attach到帧缓冲
    gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);   //纹理attach
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,renderbuffer); //渲染缓冲attach
    //清理当前render
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    gl.bindTexture(gl.TEXTURE_2D,null);
    gl.bindRenderbuffer(gl.RENDERBUFFER,null);
    //返回帧缓冲
    return framebuffer;
}

module.exports = generateFramebuffer;