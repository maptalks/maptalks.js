//use polyfill
import './../node_modules/babel-polyfill/dist/polyfill';
/**
 * improt from namespace core
 */
import Container from './core/Container';
import { PerspectiveCamera } from './core/Camera';
//import EventNames from './core/EventNames';
import RenderManager from './core/RenderManager';
import RenderNode from './core/RenderNode';

export {
    Container,
    PerspectiveCamera,
    RenderManager,
    RenderNode
}

/**
 * import from namespace renderer
 */
import { ShaderFactory } from './renderer/shader/ShaderLib';
import { GLFragmentShader, GLVertexShader } from './renderer/gl/GLShader';
import Context from './renderer/Context';
import { GLVertexBuffer, GLIndexBuffer } from './renderer/gl/GLBuffer.js';

export {
    ShaderFactory,
    GLFragmentShader,
    GLVertexShader,
    Context,
    GLVertexBuffer,
    GLIndexBuffer
}

