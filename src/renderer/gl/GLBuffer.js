/**
 * 渲染缓冲区是OpenGl管理的有效内存，包含了格式化的图像数据(texture)
 * 绑定渲染缓冲区后，并没有分配存储空间来存储图像数据，需要分配存储空间并指定其图像格式，然后才可以把渲染缓冲区附加到一个帧缓冲区并向其中进行渲染
 * 
 * reference https://www.web-tinker.com/article/20169.html
 * 
 * 使用帧缓冲和缓冲区缓冲来加速绘制
 * 提供framebuffer和renderbuffer
 * 
 * renderBuffer 用于离屏渲染，即将渲染场景渲染到renderbuffer object，RBO是一个数据存储区，包括一副图像和内部渲染格式，用于存储gl没有纹理格式的逻辑缓冲区。如模版和深度缓冲区
 * 
 * 
 * 
 */