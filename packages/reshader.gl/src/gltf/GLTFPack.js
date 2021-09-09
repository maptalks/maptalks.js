import { mat4 } from 'gl-matrix';
import { defined, isNumber } from '../common/Util';
import Skin from './Skin';
import TRS from './TRS';
import * as gltf from '@maptalks/gltf-loader';
import Geometry from '../Geometry';
import { KEY_DISPOSED } from '../common/Constants.js';
import GLTFResource from './GLTFResource';

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
    '33071' : 'clamp', //gl.CLAMP_TO_EDGE
    '33684' : 'mirrored', //gl.MIRRORED_REPEAT
    '10497' : 'repeat' //gl.REPEAT
};
export default class GLTFPack {

    constructor(gltf, regl) {
        this.gltf = gltf;
        this.regl = regl;
        this.geometries = [];
    }

    getMeshesInfo() {
        if (!this.gltf) {
            return null;
        }
        if (this.geometries.length) {
            return this.geometries;
        }
        this._createTextures(this.gltf.textures);
        this._createSkins(this.gltf.skins);
        const nodes = this.gltf.scenes[0].nodes;
        nodes.forEach((node) => {
            this._parserNode(node, this.geometries);
        });
        return this.geometries;
    }

    _createSkins(skins) {
        if (!skins) {
            return;
        }
        this._skinMap = {};
        for (let i = 0; i < skins.length; i++) {
            const skin = skins[i];
            skin.joints = skin.joints.map(j => this.gltf.nodes[j]);
            this._skinMap[i] = new Skin(this.regl, skin.joints, skin.inverseBindMatrices.array);
            delete skin.inverseBindMatrices;
        }
    }

    _createTextures(textures) {
        if (!textures) {
            return;
        }
        this._textureMap = {};
        for (let i = 0; i < textures.length; i++) {
            const texture = textures[i];
            //避免重复创建纹理对象
            if (!this._textureMap[i]) {
                this._textureMap[i] = this._toTexture(texture);
                //图像数据可能占有较大内存，在创建texture完成后可删除
                delete texture.image;
            }
        }
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
        for (const index in this._textureMap) {
            const tex = this._textureMap[index];
            if (tex.destroy && !tex[KEY_DISPOSED]) {
                tex.destroy();
            }
        }

        for (const index in this._skinMap) {
            const skin = this._skinMap[index];
            if (skin.jointTexture && !skin.jointTexture[KEY_DISPOSED]) {
                skin.jointTexture.destroy();
            }
        }
        for (const index in this.gltf.nodes) {
            const node = this.gltf.nodes[index];
            if (node.skin && node.skin.jointTexture && !node.skin.jointTexture[KEY_DISPOSED]) {
                node.skin.jointTexture.destroy();
            }
        }
        delete this.gltf;
    }

    updateAnimation(time, loop, speed, animationName) {
        const json = this.gltf;
        if (!json) {
            return;
        }
        timespan = json.animations ? gltf.GLTFLoader.getAnimationTimeSpan(json, animationName) : null;
        //模型切换过快，会导致上一个模型有动画执行，当前模型没有动画数据，就出现timespan为null的情况
        if (!timespan) {
            return;
        }
        const animTime = (loop ? (time * speed * 0.001) % (timespan.max - timespan.min) + timespan.min : time * speed * 0.001 + timespan.min);
        if (!this._startTime) {
            this._startTime = time;
        }
        json.scenes[0].nodes.forEach(node => {
            this._updateNodeMatrix(animationName, animTime, node);
        });
        for (const index in this.gltf.nodes) {
            const node = this.gltf.nodes[index];
            if (node.skin) {
                node.skin.update(node.nodeMatrix);
            }
        }
    }

    isFirstLoop(time, speed, animationName) {
        const json = this.gltf;
        if (!this._startTime || !json) {
            return true;
        }
        timespan = json.animations ? gltf.GLTFLoader.getAnimationTimeSpan(json, animationName) : null;
        return ((time - this._startTime) * speed * 0.001) / (timespan.max - timespan.min) < 1;
    }

    hasSkinAnimation() {
        return !!this._isAnimation;
    }

    _updateNodeMatrix(animationName, time, node, parentNodeMatrix) {
        const trs = node.trs;
        if (trs) {
            const animation = gltf.GLTFLoader.getAnimationClip(this.gltf, Number(node.nodeIndex), time, animationName);
            if (animation.weights) {
                this._updateMorph(node, animation.weights);
            }
            node.trs.update(animation);
        }
        if (parentNodeMatrix) {
            mat4.multiply(node.nodeMatrix, parentNodeMatrix, node.matrix || node.trs.getMatrix());
        } else {
            mat4.copy(node.nodeMatrix, node.matrix || node.trs.getMatrix());
        }
        const nodeMatrix = node.nodeMatrix;
        if (node.children) {
            node.children.forEach(child => {
                this._updateNodeMatrix(animationName, time, child, nodeMatrix);
            });
        }
        this._updateSkinTexture(node);
    }

    //更新morph的基本思路是，计算node下每一帧的weights，然后对weights排序，最后根据
    //primitives[i].attributes.POSITION +
    //weights[0] * primitives[i].targets[0].POSITION +
    //weights[1] * primitives[i].targets[1].POSITION +
    //weights[2] * primitives[i].targets[2].POSITION + ...
    //方式去更新POSITION
    //如果morphTargets数量超过8个，例如36个，由于shader中对attributes的数量有限制，每次丢到shader中的morphTargets按照gltf规范，数量为8
    //需要实时计算这8个morphTarget的索引，来决定哪几个丢到shader中。
    _updateMorph(node, weights) {
        const length = weights.length;
        if (!node.influencesList) {
            node.influencesList = [];
            for (let i = 0; i < length; i++) {
                node.influencesList[i] = [i, 0];
            }
        }
        const influences = node.influencesList;
        for (let i =  0; i < influences.length; i++) {
            const influence = influences[i];
            influence[0] = i;
            influence[1] = weights[i];
        }
        influences.sort(absNumericalSort);
        const workInfluences = [];
        for (let i = 0; i < 8; i++) {
            workInfluences[i] = [i, 0];
        }
        for (let i = 0; i < 8; i++) {
            if (i < length && influences[i][1]) {
                workInfluences[i][0] = influences[i][0];
                workInfluences[i][1] = influences[i][1];
            } else {
                workInfluences[i][0] = Number.MAX_SAFE_INTEGER;
                workInfluences[i][1] = 0;
            }
        }
        workInfluences.sort(numericalSort);
        const geometries = node.geometries;
        geometries.forEach(geometry => {
            const morphTargets = geometry.properties.morphTargets;
            for (let ii = 0; ii < 8; ii++) {
                const influence = workInfluences[ii];
                const index = influence[0];
                const value = influence[1];
                if (index !== Number.MAX_SAFE_INTEGER && value) {
                    geometry.updateData('POSITION' + ii, morphTargets['POSITION_' + index].array);
                    geometry.properties.morphWeights[ii] = value;
                } else {
                    geometry.properties.morphWeights[ii] = 0;
                }
            }
        });
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
        node.localMatrix = node.trs.getMatrix();
        if (parentNodeMatrix) {
            mat4.multiply(node.nodeMatrix, parentNodeMatrix, node.matrix || node.localMatrix);
        } else {
            mat4.copy(node.nodeMatrix, node.matrix || node.localMatrix);
        }
        const nodeMatrix = node.nodeMatrix;
        if (node.children) {
            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                this._parserNode(child, geometries, nodeMatrix);
            }
        }
        if (defined(node.skin)) {
            this._isAnimation = true;
            const skin = node.skin;
            node.trs = new TRS();
            node.skin = this._skinMap[skin];
        }

        if (defined(node.mesh)) {
            const meshIndex = node.mesh;
            node.mesh = this.gltf.meshes[meshIndex];
            node.mesh.node = node;
            node.geometries = node.geometries || [];
            node.mesh.primitives.forEach(primitive => {
                const geometry = createGeometry(primitive);
                geometry.properties.morphTargets = primitive.morphTargets;
                //一个node下可能有多个geometry, node附带的weights会影响其下辖的所有geometry的morph变形结果，这里保存
                //geometries，方便后面morph的运算
                node.geometries.push(geometry);
                const materialInfo = this._createMaterialInfo(primitive.material);
                const info = {
                    geometry,
                    nodeMatrix,
                    materialInfo,
                    extraInfo: this._createExtralInfo(primitive.material),
                    animationMatrix : node.trs.getMatrix(),
                    morphWeights: node.weights
                };
                if (node.skin) {
                    info.skin = {
                        jointTextureSize: [4, 6],
                        numJoints: node.skin.joints.length,
                        jointTexture: node.skin.jointTexture
                    };
                }
                const resource = new GLTFResource(info);
                geometries.push(resource);
            });
        }
        node.isParsed = true;
    }

    _createMaterialInfo(materialIndex) {
        const materialUniforms = {
        };
        if (this.gltf.materials && this.gltf.materials[materialIndex]) {
            const material = this.gltf.materials[materialIndex];
            const pbrMetallicRoughness = material.pbrMetallicRoughness;
            if (pbrMetallicRoughness) {
                const metallicRoughnessTexture = pbrMetallicRoughness.metallicRoughnessTexture;
                const baseColorTexture = pbrMetallicRoughness.baseColorTexture;
                if (baseColorTexture) {
                    materialUniforms['baseColorTexture'] = this._getTexture(baseColorTexture);
                }
                if (pbrMetallicRoughness.baseColorFactor) {
                    materialUniforms['baseColorFactor'] = pbrMetallicRoughness.baseColorFactor;
                }
                if (metallicRoughnessTexture) {
                    materialUniforms['metallicRoughnessTexture'] = this._getTexture(metallicRoughnessTexture);
                } else {
                    if (defined(pbrMetallicRoughness.metallicFactor)) {
                        materialUniforms['metallicFactor'] = pbrMetallicRoughness.metallicFactor;
                    }
                    if (defined(pbrMetallicRoughness.roughnessFactor)) {
                        materialUniforms['roughnessFactor'] = pbrMetallicRoughness.roughnessFactor;
                    }
                }
            }
            const extensions = material.extensions;
            if (extensions && extensions['KHR_materials_pbrSpecularGlossiness']) {
                const pbrSpecularGlossiness = extensions['KHR_materials_pbrSpecularGlossiness'];
                materialUniforms.name = 'pbrSpecularGlossiness';
                for (const p in pbrSpecularGlossiness) {
                    if (defined(pbrSpecularGlossiness[p].index)) {
                        materialUniforms[p] = this._getTexture(pbrSpecularGlossiness[p]);
                    } else {
                        materialUniforms[p] = pbrSpecularGlossiness[p];
                    }
                }
            }
            if (material.normalTexture) {
                materialUniforms['normalTexture'] = this._getTexture(material.normalTexture);
            }
            if (material.occlusionTexture) {
                materialUniforms['occlusionTexture'] = this._getTexture(material.occlusionTexture);
            }
            if (material.emissiveTexture) {
                materialUniforms['emissiveTexture'] = this._getTexture(material.emissiveTexture);
            }
            if (material.emissiveFactor) {
                materialUniforms['emissiveFactor'] = material.emissiveFactor;
            }
            materialUniforms['alphaCutoff'] = material.alphaCutoff || 0.5;
        }
        return materialUniforms;
    }

    _createExtralInfo(material) {
        const info = {};
        if (this.gltf.materials && this.gltf.materials[material]) {
            const mat = this.gltf.materials[material];
            info['doubleSided'] = mat.doubleSided;
            info['alphaMode'] = mat.alphaMode || 'OPAQUE';
        }
        return info;
    }

    _getTexture(texInfo) {
        const extensions = texInfo.extensions;
        const index = texInfo.index;
        if (!defined(index)) {
            return null;
        }
        if (extensions && extensions['KHR_texture_transform']) {
            texInfo['KHR_texture_transform'] = extensions['KHR_texture_transform'];
        }
        const texture = this._textureMap[index];
        texture.texInfo = texInfo;
        return texture;
    }

    _toTexture(texture) {
        const data = texture.image.array;
        const sampler = texture.sampler || {};
        const width = texture.image.width;
        const height = texture.image.height;
        const widthHeightIsPowerOf2 = isPowerOf2(width) && isPowerOf2(width);
        return this.regl.texture({
            width,
            height,
            data,
            mag: TEXTURE_SAMPLER[sampler.magFilter] || TEXTURE_SAMPLER['9729'],
            min: widthHeightIsPowerOf2 ? TEXTURE_SAMPLER[sampler.minFilter] || TEXTURE_SAMPLER['9729'] : TEXTURE_SAMPLER['9729'],
            wrapS: widthHeightIsPowerOf2 ? TEXTURE_SAMPLER[sampler.wrapS] || TEXTURE_SAMPLER['10497'] : TEXTURE_SAMPLER['33071'],
            wrapT: widthHeightIsPowerOf2 ? TEXTURE_SAMPLER[sampler.wrapT] || TEXTURE_SAMPLER['10497'] : TEXTURE_SAMPLER['33071']
        });
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
    //如果有morph，需要预先填充morph空数据，动画开启后，会不断向这些空数据中填充morphTargets数据
    if (primitive.morphTargets) {
        for (let i = 0; i < 8; i++) {
            if (!attributes[`POSITION${i}`]) {
                attributes[`POSITION${i}`] = new Float32Array(attributes['POSITION'].length).fill(0);
            }
        }
        for (let i = 0; i < 4; i++) {
            if (!attributes[`NORMAL${i}`]) {
                attributes[`NORMAL${i}`] = new Float32Array(attributes['NORMAL'].length).fill(0);
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
    if (primitive.morphTargets) {
        modelGeometry.properties.morphWeights = [];
    }
    if (primitive.mode > 3 && !modelGeometry.data['NORMAL']) {
        modelGeometry.createNormal('NORMAL');
    }
    return modelGeometry;
}

function isPowerOf2(value) {
    return (value > 0) && (value & (value - 1)) === 0;
}

function numericalSort(a, b) {
    return a[ 0 ] - b[ 0 ];
}

function absNumericalSort(a, b) {
    return Math.abs(b[1]) - Math.abs(a[1]);
}
