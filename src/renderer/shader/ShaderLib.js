/**
 *  本地shader索引
 */
import { GLFragmentShader, GLVertexShader } from './../gl/GLShader';

// import physics_fragment from './physics.fragment';
// import physics_vertex from './physics.vertex';
import point_fragment from './default.fragment';
import point_vertex from './default.vertex';

const shadersName=[
    // 'physics',
    'default'
];

const ShaderLibConstants = {
    // physics_fragment: physics_fragment,
    // physics_vertex: physics_vertex,
    default_fragment: point_fragment,
    default_vertex: point_vertex
}

const ShaderFactory = {
    /**
     * 构造和创建shader
     * @param {String} name 
     * @param {WebGLRenderingContext} gl 
     * @param {GLExtension} extension 
     * 
     * @return [GLVertexShader,GLFragmentShader]
     */
    create(name, gl, extension) {
        const fragmentKey = `${name}_fragment`,
            vertexKey = `${name}_vertex`;
        return [new GLVertexShader(gl, ShaderLibConstants[vertexKey], extension), new GLFragmentShader(gl, ShaderLibConstants[fragmentKey], extension)];
    }

}

export { ShaderFactory, shadersName }