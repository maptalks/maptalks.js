//参考资料：
// gltf 1.0规范 :  https://github.com/KhronosGroup/glTF/tree/master/specification/1.0
// gltf 2.0规范 ： https://github.com/KhronosGroup/glTF/tree/master/specification/2.0
// gltf 1.0和2.0区别： https://github.com/KhronosGroup/glTF/issues/605
// glTF-WebGL-PBR : https://github.com/KhronosGroup/glTF-WebGL-PBR
// glTF tutorial : https://github.com/KhronosGroup/glTF-Tutorials/tree/master/gltfTutorial
// osgjs 的 gltf 实现： https://github.com/cedricpinson/osgjs/blob/master/sources/osgPlugins/ReaderWriterGLTF.js
// KHR_binary_glTF : https://github.com/KhronosGroup/glTF/tree/master/extensions/1.0/Khronos/KHR_binary_glTF
// glTF 2.0 GLB格式 : https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#glb-file-format-specification

export { default as GLTFLoader } from './GLTFLoader.js';
export { default as Ajax } from './core/Ajax.js';
