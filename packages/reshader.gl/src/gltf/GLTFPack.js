import { mat4 } from 'gl-matrix';
import { defined, isNumber } from '../common/Util';
import Skin from './Skin';
import TRS from './TRS';
import * as gltf from '@maptalks/gltf-loader';
import Geometry from '../Geometry';
import { KEY_DISPOSED } from '../common/Constants.js';

const animMatrix = [];
const EMPTY_MAT = mat4.identity([]);
let timespan = 0;
const MODES = ['points', 'lines', 'line strip', 'line loop', 'triangles', 'triangle strip', 'triangle fan'];
//将GLTF规范里面的sampler数码映射到regl接口的sampler
const TEXTURE_SAMPLER = {
    '9728' : 'nearest',
    '9729' : 'linear',
    '9984' : 'nearest mipmap nearest',
    '9985' : 'linear mipmap nearest',
    '9986' : 'nearest mipmap linear',
    '9987' : 'linear mipmap linear',
    '33071' : 'clamp ro edge',
    '33684' : 'mirrored repeat',
    '10497' : 'repeat'
};
export default class GLTFPack {

    constructor(gltf, regl) {
        this.gltf = gltf;
        this.regl = regl;
        this.geometries = [];
    }

    getMeshesInfo() {
        if (this.geometries.length) {
            return this.geometries;
        }
        const nodes = this.gltf.scenes[0].nodes;
        nodes.forEach((node) => {
            this._parserNode(node, this.geometries);
        });
        return this.geometries;
    }

    dispose() {
        const geometries = this.getMeshesInfo();
        geometries.forEach(g => {
            g.geometry.dispose();
            for (const m in g.materialInfo) {
                const materialInfo = g.materialInfo[m];
                //如果是texture对象，需要销毁，如果已经销毁过，不能再重复销毁
                if (materialInfo.destroy && !materialInfo[KEY_DISPOSED]) {
                    materialInfo.destroy();
                }
            }
        });
        for (const index in this.gltf.nodes) {
            const node = this.gltf.nodes[index];
            if (node.skin && node.skin.jointTexture && !node.skin.jointTexture[KEY_DISPOSED]) {
                node.skin.jointTexture.destroy();
            }
        }
    }

    updateAnimation(time, loop, speed) {
        const json = this.gltf;
        timespan = json.animations ? gltf.GLTFLoader.getAnimationTimeSpan(json) : null;
        const animTime = (loop ? (time * speed * 0.001) % (timespan.max - timespan.min) : time * 0.001);
        json.scenes[0].nodes.forEach(node => {
            this._updateNodeMatrix(animTime, node);
        });
        for (const index in this.gltf.nodes) {
            const node = this.gltf.nodes[index];
            if (node.skin) {
                node.skin.update(node.nodeMatrix);
            }
            if (node.weights) {
                this._fillMorphWeights(node.morphWeights);
            }
        }
    }

    hasSkinAnimation() {
        return !!this._isAnimation;
    }

    _updateNodeMatrix(time, node, parentNodeMatrix) {
        const trs = node.trs;
        if (trs) {
            gltf.GLTFLoader.getAnimationClip(animMatrix, this.gltf, Number(node.nodeIndex), time);
            node.trs.update(animMatrix);
            if (trs.isTRS(animMatrix)) {
                //根据时间获取到的动画矩阵如果t、r、s都存在，需要直接赋给localMatrix
                mat4.copy(node.localMatrix, animMatrix);
            } else if (!mat4.equals(animMatrix, EMPTY_MAT)) {
                trs.setMatrix(node.localMatrix);
            }
        }
        if (parentNodeMatrix) {
            mat4.multiply(node.nodeMatrix, parentNodeMatrix, node.localMatrix);
        } else {
            mat4.copy(node.nodeMatrix, node.localMatrix);
        }
        const nodeMatrix = mat4.copy([], node.nodeMatrix);
        if (node.children) {
            node.children.forEach(child => {
                this._updateNodeMatrix(time, child, nodeMatrix);
            });
        }
        this._updateSkinTexture(node);
        if (node.weights) {
            for (let i = 0; i < node.weights.length; i++) {
                node.morphWeights[i] = node.weights[i];
            }
        }
    }

    _updateSkinTexture(node) {
        if (!this.gltf.joints) {
            return;
        }
        const animations = this.gltf.animations;
        if (!animations) {
            return;
        }
        const jointsLength = this.gltf.joints.length;
        animations.forEach(animation => {
            const channels = animation.channels;
            for (let i = 0; i < channels.length; i++) {
                const channel = channels[i];
                const index = node.nodeIndex;
                if (channel.target.node === index) {
                    const skin = node.skin;
                    skin.updateJointTexture(jointsLength);
                }
            }
        });
    }

    _parserNode(node, geometries, parentNodeMatrix) {
        if (node.isParsed) {
            return;
        }
        node.nodeMatrix = node.nodeMatrix || mat4.identity([]);
        node.localMatrix = node.localMatrix || mat4.identity([]);
        if (node.matrix) {
            node.trs = new TRS();
            node.trs.decompose(node.matrix);
        } else {
            node.trs = new TRS(node.translation, node.rotation, node.scale);
        }
        const trs = node.trs;
        if (trs) {
            if (node.matrix) {
                mat4.copy(node.localMatrix, node.matrix);
            } else {
                trs.setMatrix(node.localMatrix);
            }
        }
        if (parentNodeMatrix) {
            mat4.multiply(node.nodeMatrix, parentNodeMatrix, node.localMatrix);
        } else {
            mat4.copy(node.nodeMatrix, node.localMatrix);
        }
        const nodeMatrix = node.nodeMatrix;
        if (node.children) {
            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                this._parserNode(child, geometries, nodeMatrix);
            }
        }
        if (node.skin) {
            this._isAnimation = true;
            const skin = node.skin;
            node.trs = new TRS();
            node.skin = new Skin(this.regl, skin.joints, skin.inverseBindMatrices.array);
        }

        if (node.weights) {
            node.morphWeights = [0, 0, 0, 0];
        }

        if (defined(node.mesh)) {
            node.mesh = node.meshes[0];
            node.mesh.node = node;
            node.mesh.primitives.forEach(primitive => {
                const geometry = createGeometry(primitive);
                const info = {
                    geometry,
                    nodeMatrix,
                    materialInfo : this._createMaterialInfo(primitive.material, node),
                    extraInfo: this._createExtralInfo(primitive.material),
                    animationMatrix : node.trs.setMatrix()
                };
                if (node.skin) {
                    info.skin = {
                        jointTextureSize: [4, 6],
                        numJoints: node.skin.joints.length,
                        jointTexture: node.skin.jointTexture
                    };
                }
                if (node.morphWeights) {
                    info.morphWeights = node.morphWeights;
                }
                geometries.push(info);
            });
        }
        node.isParsed = true;
    }

    _createMaterialInfo(material) {
        const materialUniforms = {
            baseColorFactor : [1, 1, 1, 1]
        };
        if (material) {
            const pbrMetallicRoughness = material.pbrMetallicRoughness;
            if (pbrMetallicRoughness) {
                const metallicRoughnessTexture = pbrMetallicRoughness.metallicRoughnessTexture;
                const baseColorTexture = pbrMetallicRoughness.baseColorTexture;
                if (baseColorTexture) {
                    const texture = this._toTexture(baseColorTexture);
                    materialUniforms['baseColorTexture'] = texture;
                } else if (pbrMetallicRoughness.baseColorFactor) {
                    materialUniforms['baseColorFactor'] = pbrMetallicRoughness.baseColorFactor;
                }
                if (metallicRoughnessTexture) {
                    const texture = this._toTexture(metallicRoughnessTexture);
                    materialUniforms['metallicRoughnessTexture'] = texture;
                } else {
                    if (defined(pbrMetallicRoughness.metallicFactor)) {
                        materialUniforms['metallicFactor'] = pbrMetallicRoughness.metallicFactor;
                    }
                    if (defined(pbrMetallicRoughness.roughnessFactor)) {
                        materialUniforms['roughnessFactor'] = pbrMetallicRoughness.roughnessFactor;
                    }
                }
            }
            const pbrSpecularGlossiness = material.pbrSpecularGlossiness;
            if (pbrSpecularGlossiness) {
                for (const p in pbrSpecularGlossiness) {
                    if (pbrSpecularGlossiness[p].texture) {
                        materialUniforms[p] = this._toTexture(pbrSpecularGlossiness[p]);
                    } else {
                        materialUniforms[p] = pbrSpecularGlossiness[p];
                    }
                }
            }
            if (material.normalTexture) {
                const texture = this._toTexture(material.normalTexture);
                materialUniforms['normalTexture'] = texture;
            }
            if (material.occlusionTexture) {
                const texture = this._toTexture(material.occlusionTexture);
                materialUniforms['occlusionTexture'] = texture;
            }
            if (material.emissiveTexture) {
                const texture = this._toTexture(material.emissiveTexture);
                materialUniforms['emissiveTexture'] = texture;
            }
            if (material.emissiveFactor) {
                materialUniforms['emissiveFactor'] = material.emissiveFactor;
            }
        }
        return materialUniforms;
    }

    _createExtralInfo(material) {
        const info = {};
        if (material) {
            info['doubleSided'] = material.doubleSided;
        }
        return info;
    }

    _toTexture(texture) {
        const data = texture.texture.image.array;
        const sampler = texture.texture.sampler || {};
        const width = texture.texture.image.width;
        const height = texture.texture.image.height;
        return this.regl.texture({
            width,
            height,
            data,
            mag: TEXTURE_SAMPLER[sampler.magFilter] || TEXTURE_SAMPLER['9729'],
            min: TEXTURE_SAMPLER[sampler.minFilter] || TEXTURE_SAMPLER['9729'],
            wrapS: TEXTURE_SAMPLER[sampler.wrapS] || TEXTURE_SAMPLER['10497'],
            wrapT: TEXTURE_SAMPLER[sampler.wrapT] || TEXTURE_SAMPLER['10497']
        });
    }

    _fillMorphWeights(weights) {
        if (weights.length < 4) {
            for (let i = 0; i < 4; i++) {
                if (!defined(weights[i])) {
                    weights[i] = 0;
                }
            }
        }
        return weights;
    }
}

function createGeometry(primitive) {
    const attributes = {};
    for (const attr in primitive.attributes) {
        attributes[attr] =  primitive.attributes[attr];
        if (attributes[attr].bufferView === undefined) {
            attributes[attr] = attributes[attr].array;
        }
    }
    // for morph
    if (attributes['POSITION_0']) {
        for (let i = 0; i < 4; i++) {
            if (!attributes[`POSITION_${i}`]) {
                attributes[`POSITION_${i}`] = new Array(attributes['POSITION'].length).fill(0);
            }
        }
    }
    if (attributes['COLOR_0']) {
        //将float类型的颜色值转为0-255的uint8类型
        if (attributes['COLOR_0'] instanceof Float32Array) {
            const color = new Uint8Array(attributes['COLOR_0'].length);
            for (let i = 0; i < color.length; i++) {
                color[i] = Math.round(attributes['COLOR_0'][i] * 255);
            }
            attributes['COLOR_0'] = color;
        }
    }
    let indices = primitive.indices;
    if (indices && indices.bufferView === undefined && indices.array) {
        indices = indices.array;
    }
    const modelGeometry = new Geometry(
        attributes,
        indices,
        0,
        {
            //绘制类型，例如 triangle strip, line等，根据gltf中primitive的mode来判断，默认是triangles
            primitive : isNumber(primitive.mode) ? MODES[primitive.mode] : primitive.mode,
            positionAttribute: 'POSITION',
            normalAttribute: 'NORMAL',
            uv0Attribute: 'TEXCOORD_0',
            uv1Attribute: 'TEXCOORD_1',
            color0Attribute: 'COLOR_0'
        }
    );
    if (primitive.mode > 3 && !modelGeometry.data['NORMAL']) {
        modelGeometry.createNormal('NORMAL');
    }
    return modelGeometry;
}
