import { mat4 } from 'gl-matrix';
import { defined, isNumber } from '../common/Util';
import Skin from './Skin';
import TRS from './TRS';
import * as gltf from '@maptalks/gltf-loader';
import Geometry from '../Geometry';

const animMatrix = [];
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
            if (g.material) {
                g.material.dispose();
            }
            if (g.node.skin && g.node.skin.jointTexture) {
                g.node.skin.jointTexture.destroy();
            }
        });
    }

    updateAnimation(time, loop, speed) {
        const json = this.gltf;
        timespan = json.animations ? gltf.GLTFLoader.getAnimationTimeSpan(json) : null;
        const animTime = (loop ? (time * 0.001) % (timespan.max - timespan.min) : time * 0.001) * speed;
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

    _updateNodeMatrix(time, node, parentNodeMatrix) {
        const trs = node.trs;
        if (trs) {
            trs.setMatrix(node.localMatrix);
        }
        if (parentNodeMatrix) {
            mat4.multiply(node.nodeMatrix, parentNodeMatrix, node.localMatrix);
        } else {
            mat4.copy(node.nodeMatrix, node.localMatrix);
        }
        const nodeMatrix = node.nodeMatrix;
        if (node.children) {
            node.children.forEach(child => {
                this._updateNodeMatrix(time, child, nodeMatrix);
            });
        }
        gltf.GLTFLoader.getAnimationClip(animMatrix, this.gltf, Number(node.nodeIndex), time);
        node.trs.decompose(animMatrix);
        if (node.weights) {
            for (let i = 0; i < node.weights.length; i++) {
                node.morphWeights[i] = node.weights[i];
            }
        }
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
            trs.setMatrix(node.localMatrix);
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
                geometries.push({
                    geometry,
                    node,
                    materialInfo : this._createMaterialInfo(primitive.material, node),
                    animationMatrix : node.trs.setMatrix()
                });
            });
        }
        node.isParsed = true;
    }

    _createMaterialInfo(material, node) {
        const materialUniforms = {
            baseColorFactor : [1, 1, 1, 1]
        };
        if (node.skin) {
            materialUniforms.skinAnimation = 1;
            materialUniforms.jointTextureSize = [4, 6];
            materialUniforms.numJoints = node.skin.joints.length;
            materialUniforms.jointTexture = node.skin.jointTexture;
        }
        if (node.morphWeights) {
            materialUniforms.morphWeights = node.morphWeights;
        }
        if (material) {
            const pbrMetallicRoughness = material.pbrMetallicRoughness;
            //TODO 对pbrSpecularGlossiness、unlit的解析
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

    _toTexture(texture) {
        const data = texture.texture.image.array;
        const sampler = texture.texture.sampler || {};
        const width = texture.texture.image.width;
        const height = texture.texture.image.height;
        return this.regl.texture({
            width,
            height,
            data,
            mag: TEXTURE_SAMPLER[sampler.magFilter] || TEXTURE_SAMPLER['9728'],
            min: TEXTURE_SAMPLER[sampler.minFilter] || TEXTURE_SAMPLER['9728'],
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
        attributes[attr] =  primitive.attributes[attr].array;
    }
    if (attributes['POSITION_0']) {
        for (let i = 0; i < 4; i++) {
            if (!attributes[`POSITION_${i}`]) {
                attributes[`POSITION_${i}`] = new Array(attributes['POSITION'].length).fill(0);
            }
        }
    }
    const modelGeometry = new Geometry(
        attributes,
        primitive.indices,
        0,
        {
            //绘制类型，例如 triangle strip, line等，根据gltf中primitive的mode来判断，默认是triangles
            primitive : isNumber(primitive.mode) ? MODES[primitive.mode] : primitive.mode,
            positionAttribute : 'POSITION'
        }
    );
    if (!modelGeometry.data['NORMAL']) {
        modelGeometry.createNormal('NORMAL');
    }
    return modelGeometry;
}
