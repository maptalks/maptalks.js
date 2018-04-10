
/**
 * 
 * @param {WebGLRenderingContext} gl 
 */
const generateFramebuffer = function (gl) {
    //创建帧缓冲对象
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    //deferred render - 颜色位置缓冲
    const positionTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, positionTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 800, 600, 0, gl.RGB, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, positionTexture, 0);
    //deferrd render - 法线颜色缓冲
    const normalTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, normalTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 800, 600, 0, gl.RGB, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, normalTexture, 0);
    //deferred render - 颜色+镜面颜色缓冲
    const albedspecTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, albedspecTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 800, 600, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT2, gl.TEXTURE_2D, albedspecTexture, 0);
    //texture设置
    framebuffer.positionTexture = positionTexture;
    framebuffer.normalTexture = normalTexture;
    framebuffer.albedspecTexture = albedspecTexture;
    //创建缓冲区对象，并设置尺寸和参数
    const renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 800, 600);
    //渲染缓冲attach
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer); 
    //end----以上构成帧缓冲的attach对象，现在将纹理和缓冲区对象attach到帧缓冲
    //清理当前render
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    //返回帧缓冲
    return framebuffer;
}

module.exports = generateFramebuffer;