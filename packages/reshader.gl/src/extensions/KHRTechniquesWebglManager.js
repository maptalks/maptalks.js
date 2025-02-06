// implementation of GLTF 2.0 extension khr_techniques_webgl
// https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Archived/KHR_techniques_webgl

import MeshShader from '../shader/MeshShader';
import { extend, hashCode } from '../common/Util';
import { getPrimitive, getTextureMagFilter, getTextureMinFilter, getTextureWrap, getMaterialType, getMaterialFormat, getUniqueREGLBuffer } from '../common/REGLHelper';
import Material from '../Material';
import Geometry from '../Geometry';
import Texture2D from '../Texture2D';
import { mat3, mat4 } from 'gl-matrix';

const excludeFilter = mesh => mesh && mesh.geometry && mesh.geometry.properties.shaderHash === undefined;

const TEMP_MAT4 = [];
const TEMP_MAT3 = [];
const UNIFORM_DECLARES = [
    {
        name: 'modelViewMatrix',
        type: 'function',
        fn: (_, props) => {
            return mat4.multiply(TEMP_MAT4, props['viewMatrix'], props['modelMatrix']);
        }
    },
    {
        name: 'modelViewProjMatrix',
        type: 'function',
        fn: (_, props) => {
            const viewProj = mat4.multiply(TEMP_MAT4, props['viewMatrix'], props['modelMatrix']);
            return mat4.multiply(TEMP_MAT4, props['projMatrix'], viewProj);
        }
    },
    {
        name: 'modelMatrixInverse',
        type: 'function',
        fn: (_, props) => {
            return mat4.invert(TEMP_MAT4, props['modelMatrix']);
        }
    },
    {
        name: 'projMatrixInverse',
        type: 'function',
        fn: (_, props) => {
            return mat4.invert(TEMP_MAT4, props['projMatrix']);
        }
    },
    {
        name: 'modelViewMatrixInverse',
        type: 'function',
        fn: (_, props) => {
            mat4.multiply(TEMP_MAT4, props['viewMatrix'], props['modelMatrix']);
            return mat4.invert(TEMP_MAT4, TEMP_MAT4);
        }
    },
    {
        name: 'modelViewProjMatrixInverse',
        type: 'function',
        fn: (_, props) => {
            const viewProj = mat4.multiply(TEMP_MAT4, props['viewMatrix'], props['modelMatrix']);
            mat4.multiply(TEMP_MAT4, props['projMatrix'], viewProj);
            return mat4.invert(TEMP_MAT4, TEMP_MAT4);
        }
    },
    {
        name: 'modelInverseTransposeMatrix',
        type: 'function',
        fn: (_, props) => {
            const model3 = mat3.fromMat4(TEMP_MAT3, props['modelMatrix']);
            const transposed = mat3.transpose(model3, model3);
            const inverted = mat3.invert(transposed, transposed);
            return inverted;
        }
    },
    {
        name: 'modelViewInverseTransposeMatrix',
        type: 'function',
        fn: (_, props) => {
            const modelView = mat4.multiply(TEMP_MAT4, props['viewMatrix'], props['modelMatrix']);
            const modelView3 = mat3.fromMat4(TEMP_MAT3, modelView);
            const transposed = mat3.transpose(modelView3, modelView3);
            const inverted = mat3.invert(transposed, transposed);
            return inverted;
        }
    },
];

const DEFAULT_UNIFORM_SEMANTICS = {
    'LOCAL': 'positionMatrix',
    'MODEL': 'modelMatrix',
    'VIEW': 'viewMatrix',
    'PROJECTION': 'projMatrix',
    'MODELVIEW': 'modelViewMatrix',
    'MODELVIEWPROJECTION': 'modelViewProjMatrix',
    'MODELINVERSE': 'modelMatrixInverse',
    'VIEWINVERSE': 'viewMatrixInverse',
    'PROJECTIONINVERSE': 'projMatrixInverse',
    'MODELVIEWINVERSE': 'modelViewMatrixInverse',
    'MODELVIEWPROJECTIONINVERSE': 'modelViewProjMatrixInverse',
    'MODELINVERSETRANSPOSE': 'modelInverseTransposeMatrix',
    'MODELVIEWINVERSETRANSPOSE': 'modelViewInverseTransposeMatrix',
    'VIEWPORT': 'viewport',
    'JOINTMATRIX': 'jointMatrix',
    'ALPHACUTOFF': 'alphaCutoff'
};

export default class KHRTechniquesWebglManager {
    // extraCommandProps是创建shader时统一的 extraCommandProps
    constructor(regl, extraCommandProps, resLoader) {
        this._regl = regl;
        this._khrShaders = {};
        this._commandProps = extraCommandProps;
        this._resLoader = resLoader;
    }

    // 用来排除 KHRTechniquesWebgl Mesh的filter
    getExcludeFilter() {
        return excludeFilter;
    }

    /**
     * 遍历Shader
     *
     * */
    forEachShader(cb) {
        for (const hash in this._khrShaders) {
            const item = this._khrShaders[hash];
            cb(item.shader, item.filter, item.uniformSemantics);
        }
    }

    // khr technique中的shader是webgl 2语法时，需要把useWebGL2参数设为true
    createMesh(primitive, gltf, excludeElementsInVAO, useWebGL2) {
        const extension = gltf.extensions['KHR_techniques_webgl'];
        const matInfo = gltf.materials[primitive.material].extensions['KHR_techniques_webgl'];
        const { technique: techIndex, values } = matInfo;
        const technique = extension.techniques[techIndex];
        const program = extension.programs[technique.program];
        const vert = extension.shaders[program.vertexShader];
        const frag = extension.shaders[program.fragmentShader];
        frag.content = checkFrag(frag.content);

        const vertHash = hashCode(vert.content);
        const fragHash = hashCode(frag.content);
        const hash = vertHash + '-' + fragHash;
        if (!this._khrShaders[hash]) {
            this._khrShaders[hash] = this._createTechniqueShader(hash, extension, techIndex, this._commandProps, useWebGL2);
        }
        const { attributeSemantics } = this._khrShaders[hash];
        const geometry = this._createGeometry(primitive, attributeSemantics, excludeElementsInVAO, hash);
        const matValues = extend({}, values);
        for (const p in values) {
            // sampler 2D
            if (technique.uniforms[p] && technique.uniforms[p].type === 35678) {
                const texIndex = values[p].index;
                const texInfo = gltf.textures[texIndex];
                matValues[p] = this._getTexture(texInfo);
            }
        }
        const material = new Material(matValues);
        return { geometry, material };
    }

    _createGeometry(gltfMesh, attributeSemantics, excludeElementsInVAO, shaderHash) {
        // TODO buffer只创建一次
        const attributes = gltfMesh.attributes;
        const color0Name = 'COLOR_0';
        // 把Float32类型的color0改为uint8类型数组
        if (attributes[color0Name]) {
            const colors =  attributes[color0Name].array || attributes[color0Name];
            if (colors instanceof Float32Array) {
                const color = new Uint8Array(colors.length);
                for (let i = 0; i < color.length; i++) {
                    color[i] = Math.round(colors[i] * 255);
                }
                if (attributes[color0Name].array) {
                    attributes[color0Name].array = color;
                    attributes[color0Name].componentType = 5121;
                } else {
                    attributes[color0Name] = color;
                }

            }
        }
        const attrs = {};
        for (const p in attributes) {
            const buffer = getUniqueREGLBuffer(this._regl, attributes[p], { dimension: attributes[p].itemSize, name: p });
            // 优先采用 attributeSemantics中定义的属性
            const name = attributeSemantics[p] || p;
            attrs[name] = {
                buffer
            };
            if (attributes[p].quantization) {
                attrs[name].quantization = attributes[p].quantization;
            }
            if (name === attributeSemantics['POSITION']) {
                // 用来计算vertexCount和boundingbox
                attrs[name].array = attributes[p].array;
            }
        }
        const geometry = new Geometry(
            attrs,
            gltfMesh.indices.array ? gltfMesh.indices.array : gltfMesh.indices,
            0,
            {
                positionAttribute: attributeSemantics['POSITION'],
                normalAttribute: attributeSemantics['NORMAL'],
                uv0Attribute: attributeSemantics['TEXCOORD_0'],
                uv1Attribute: attributeSemantics['TEXCOORD_1'],
                color0Attribute: attributeSemantics['COLOR_0'],
                tangentAttribute: attributeSemantics['TANGENT'],
                textureCoordMatrixAttribute: attributeSemantics['TextureCoordMatrix'],//for s3m
                primitive: gltfMesh.mode === undefined ? 'triangles' : getPrimitive(gltfMesh.mode)
            }
        );
        geometry.generateBuffers(this._regl, { excludeElementsInVAO });
        geometry.properties.shaderHash = shaderHash;
        const positionData = geometry.data[geometry.desc.positionAttribute];
        if (positionData && positionData.array) {
            delete positionData.array;
        }
        return geometry;
    }

    _getTexture(texInfo) {
        // texInfo.image.color 表示图片被精简成了颜色
        const config = {
            type : texInfo.type ? getMaterialType(texInfo.type) : 'uint8',
            format : texInfo.format ? getMaterialFormat(texInfo.format) : 'rgba',
            flipY : !!texInfo.flipY
        };

        const image = texInfo.image;
        if (image.array) {
            config.data = image.array;
        } else if (image.mipmap) {
            config.mipmap = image.mipmap;
        }
        config.width = image.width;
        config.height = image.height;

        const sampler = texInfo.sampler || texInfo.texture.sampler;
        if (sampler) {
            if (sampler.magFilter) config['mag'] = getTextureMagFilter(sampler.magFilter);
            if (sampler.minFilter) config['min'] = getTextureMinFilter(sampler.minFilter);
            if (sampler.wrapS) config['wrapS'] = getTextureWrap(sampler.wrapS);
            if (sampler.wrapT) config['wrapT'] = getTextureWrap(sampler.wrapT);
        }

        return new Texture2D(config, this._resLoader);

    }

    _createTechniqueShader(hash, extension, techIndex, extraCommandProps, useWebGL2) {
        const { techniques, programs, shaders } = extension;
        const technique = techniques[techIndex];
        const program = programs[technique.program];
        const vert = shaders[program.vertexShader].content;
        const frag = shaders[program.fragmentShader].content;
        const uniformSemantics = {};
        for (const name in technique.uniforms) {
            const semantic = technique.uniforms[name];
            if (semantic.semantic) {
                uniformSemantics[semantic.semantic] = name;
            }
        }
        const uniformDeclares = UNIFORM_DECLARES.slice();//extend({}, UNIFORM_DECLARES);
        for (const semanticName in uniformSemantics) {
            const name = uniformSemantics[semanticName];
            uniformDeclares.push({
                name,
                type: 'function',
                fn:  (_, props) => {
                    const realName = DEFAULT_UNIFORM_SEMANTICS[semanticName];
                    return props[realName];
                }
            });
        }
        const shader = new MeshShader({
            vert, frag,
            uniforms: uniformDeclares,
            extraCommandProps
        });
        if (useWebGL2) {
            shader.version = 300;
        }
        const attributeSemantics = {};
        for (const name in technique.attributes) {
            const semantic = technique.attributes[name];
            attributeSemantics[semantic.semantic] = name;
        }
        return {
            shader,
            filter: mesh => mesh && mesh.geometry && mesh.geometry.properties.shaderHash === hash,
            uniformSemantics,
            attributeSemantics
        };
    }


    dispose() {
        for (const p in this._khrShaders) {
            const { shader } = this._khrShaders[p];
            shader.dispose();
        }
        this._khrShaders = {};
    }
}

function checkFrag(fragCode) {
    if (fragCode && fragCode.indexOf('precision') < 0) {
        // 有些模型的frag里缺少precision定义
        return 'precision mediump float;\n' + fragCode;
    }
    return fragCode;
}
