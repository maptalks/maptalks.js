import { mat4 } from 'gl-matrix';
import { defined, isNumber, isInterleaved, extend } from '../common/Util';
import Skin from './Skin';
import TRS from './TRS';
import { getGLTFLoaderBundle } from '../common/GLTFBundle'
import Geometry from '../Geometry';
import { KEY_DISPOSED } from '../common/Constants.js';
import GLTFResource from './GLTFResource';
import { getPrimitive, getTextureMagFilter, getTextureMinFilter, getTextureWrap, getUniqueREGLBuffer } from '../common/REGLHelper';
import Texture from '../Texture2D';

let timespan = 0;

const MAT4 = [];

export default class GLTFPack {

    constructor(gltf, regl) {
        this.gltf = gltf;
        this.regl = regl;
        this.geometries = [];
        if (regl) {
            this._emptyTexture = regl.texture({ width: 2, height: 2 });
        }
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
        this._checkBaseColorFactor();
        return this.geometries;
    }

    getGLTFBBox() {
        if (!this.gltf) {
            return null;
        }
        const geometries = this.geometries;
        if (!geometries || !geometries.length) {
            return null;
        }
        const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
        for (let i = 0; i < geometries.length; i++) {
            const bbox = geometries[i].bbox;
            const bboxMin = bbox.min, bboxMax = bbox.max;
            if (bboxMin[0] < min[0]) {
                min[0] = bboxMin[0];
            }
            if (bboxMin[1] < min[1]) {
                min[1] = bboxMin[1];
            }
            if (bboxMin[2] < min[2]) {
                min[2] = bboxMin[2];
            }

            if (bboxMax[0] > max[0]) {
                max[0] = bboxMax[0];
            }
            if (bboxMax[1] > max[1]) {
                max[1] = bboxMax[1];
            }
            if (bboxMax[2] > max[2]) {
                max[2] = bboxMax[2];
            }
        }
        return{ min, max };
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

    //所有baseColorFactor的alpha为0时，设置为1
    _checkBaseColorFactor() {
        if (!this._checkBaseColorFactorAlpha()) {
            for (let i = 0; i < this.geometries.length; i++) {
                const baseColorFactor = this.geometries[i].materialInfo['baseColorFactor'];
                if (baseColorFactor && baseColorFactor[3] === 0) {
                    baseColorFactor[3] = 1;
                }
            }
        }
    }

    _checkBaseColorFactorAlpha() {
        for (let i = 0; i < this.geometries.length; i++) {
            const baseColorFactor = this.geometries[i].materialInfo['baseColorFactor'];
            if (baseColorFactor && baseColorFactor[3] > 0) {
                return true;
            }
        }
        return false;
    }

    dispose() {
        if (this._emptyTexture) {
            this._emptyTexture.destroy();
        }
        const geometries = this.getMeshesInfo();
        if (!geometries) {
            return;
        }
        geometries.forEach(g => {
            g.geometry.dispose();
            for (const m in g.materialInfo) {
                const materialInfo = g.materialInfo[m];
                //如果是texture对象，需要销毁，如果已经销毁过，不能再重复销毁
                if (materialInfo && materialInfo.destroy && !materialInfo[KEY_DISPOSED]) {
                    materialInfo.destroy();
                }
            }
        });
        for (const index in this._textureMap) {
            const tex = this._textureMap[index];
            if (tex && tex.destroy && !tex[KEY_DISPOSED]) {
                tex.destroy();
            }
        }
        delete this.gltf;
    }

    updateAnimation(time, loop, speed, animationName, startTime, nodeMatrixMap, skinMap, animationNodes) {
        const json = this.gltf;
        if (!json) {
            return;
        }
        const gltf = getGLTFLoaderBundle();
        timespan = json.animations ? gltf.GLTFLoader.getAnimationTimeSpan(json, animationName) : null;
        //模型切换过快，会导致上一个模型有动画执行，当前模型没有动画数据，就出现timespan为null的情况
        if (!timespan) {
            return;
        }
        time = time - startTime;
        let animTime = 0;
        if (loop || (!loop && this._isFirstLoop(time, speed, animationName, startTime))) {
            animTime = (time * speed * 0.001) % (timespan.max - timespan.min) + timespan.min;
        } else {
            animTime = time * speed * 0.001 + timespan.min;
        }
        json.scenes[0].nodes.forEach(node => {
            this._updateNodeMatrix(animationName, animTime, node, null, nodeMatrixMap, animationNodes);
        });
        for (const index in this.gltf.nodes) {
            const node = this.gltf.nodes[index];
            const nodeMatrix = nodeMatrixMap[node.nodeIndex];
            if (node.skin && nodeMatrix) {
                const jointTexture = node.skin.update(nodeMatrix, nodeMatrixMap, skinMap[node.nodeIndex] && skinMap[node.nodeIndex].jointTexture);
                if (!skinMap[node.nodeIndex]) {
                    skinMap[node.nodeIndex] =  {
                        jointTextureSize: node.skin.jointTextureSize,
                        numJoints: node.skin.joints.length
                    };
                }
                skinMap[node.nodeIndex].jointTexture = jointTexture;
            }
        }
        return;
    }

    _isFirstLoop(time, speed, animationName, startTime) {
        const json = this.gltf;
        if (!startTime || !json) {
            return true;
        }
        const gltf = getGLTFLoaderBundle();
        timespan = json.animations ? gltf.GLTFLoader.getAnimationTimeSpan(json, animationName) : null;
        return (time* speed * 0.001) / (timespan.max - timespan.min) < 1;
    }

    hasSkinAnimation() {
        return !!this._isAnimation;
    }

    _updateNodeMatrix(animationName, time, node, parentNodeMatrix, nodeMatrixMap, animationNodes) {
        const trs = node.trs;
        if (trs) {
            if (!animationNodes) {
                this._updateNodeTRS(node, time, animationName);
            } else if (animationNodes.indexOf(Number(node.nodeIndex)) > -1) {
                this._updateNodeTRS(node, time, animationName);
            }
        }
        if (parentNodeMatrix) {
            nodeMatrixMap[node.nodeIndex] = mat4.multiply(nodeMatrixMap[node.nodeIndex] || [], parentNodeMatrix, node.matrix || node.trs.getMatrix());
        } else {
            nodeMatrixMap[node.nodeIndex] = mat4.copy(nodeMatrixMap[node.nodeIndex] || [], node.matrix || node.trs.getMatrix());
        }
        if (node.children) {
            node.children.forEach(child => {
                this._updateNodeMatrix(animationName, time, child, nodeMatrixMap[node.nodeIndex], nodeMatrixMap, animationNodes);
            });
        }
    }

    _updateNodeTRS(node, time, animationName) {
        const gltf = getGLTFLoaderBundle();
        const animation = gltf.GLTFLoader.getAnimationClip(this.gltf, Number(node.nodeIndex), time, animationName);
        if (animation.weights) {
            this._updateMorph(node, animation.weights);
        }
        node.trs.update(animation);
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
                const materialInfo = this._createMaterialInfo(primitive.material);
                const geometry = createGeometry(primitive, this.regl, materialInfo.occlusionTexture);
                geometry.properties.morphTargets = primitive.morphTargets;
                //一个node下可能有多个geometry, node附带的weights会影响其下辖的所有geometry的morph变形结果，这里保存
                //geometries，方便后面morph的运算
                node.geometries.push(geometry);
                let bbox = geometry.boundingBox.copy();
                bbox = bbox.transform(mat4.identity(MAT4), nodeMatrix);
                const info = {
                    geometry,
                    bbox,
                    nodeMatrix,
                    materialInfo,
                    extraInfo: this._createExtralInfo(primitive.material),
                    animationMatrix : node.trs.getMatrix(),
                    morphWeights: node.weights,
                    nodeIndex: node.nodeIndex
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
                    if (baseColorTexture['KHR_texture_transform']) {
                        materialUniforms['khr_offset'] = baseColorTexture['KHR_texture_transform'].offset || [0, 0];
                        materialUniforms['khr_rotation'] = baseColorTexture['KHR_texture_transform'].rotation ||0;
                        materialUniforms['khr_scale'] = baseColorTexture['KHR_texture_transform'].scale || [1, 1];
                    }
                }
                if (pbrMetallicRoughness.baseColorFactor) {
                    materialUniforms['baseColorFactor'] = pbrMetallicRoughness.baseColorFactor;
                }
                if (metallicRoughnessTexture) {
                    materialUniforms['metallicRoughnessTexture'] = this._getTexture(metallicRoughnessTexture);
                } else {
                    materialUniforms['metallicFactor'] = defined(pbrMetallicRoughness.metallicFactor) ? pbrMetallicRoughness.metallicFactor : 1.0;
                    materialUniforms['roughnessFactor'] = defined(pbrMetallicRoughness.roughnessFactor) ? pbrMetallicRoughness.roughnessFactor : 1.0;
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
            materialUniforms['doubleSided'] = material.doubleSided;
            materialUniforms['alphaMode'] = material.alphaMode || 'OPAQUE';
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
        if (!texture) {
            // empty texture
            return this._emptyTexture;
        }
        const data = texture.image.array;
        const sampler = texture.sampler || {};
        const width = texture.image.width;
        const height = texture.image.height;
        return new Texture({
            width,
            height,
            data,
            mag: getTextureMagFilter(sampler.magFilter) || 'linear',
            min: getTextureMinFilter(sampler.minFilter) || 'linear mipmap linear',
            wrapS: getTextureWrap(sampler.wrapS) || 'repeat',
            wrapT: getTextureWrap(sampler.wrapT) || 'repeat'
        });
    }
}

function createGeometry(primitive, regl, hasAOMap) {
    const attributes = primitive.attributes;
    const aColor0 = attributes['COLOR_0'];
    //将float类型的颜色值转为0-255的uint8类型
    if (aColor0 && aColor0.array instanceof Float32Array) {
        const color = new Uint8Array(aColor0.array.length);
        for (let i = 0; i < color.length; i++) {
            color[i] = Math.round(aColor0.array[i] * 255);
        }
        aColor0.array = color;
    } else if (aColor0 && (aColor0.array instanceof Uint16Array ||
        aColor0.array instanceof Int16Array ||
        aColor0.array instanceof Uint32Array ||
        aColor0.array instanceof Int32Array)) {
        const color = new Uint8Array(aColor0.array);
        aColor0.array = color;
    }
    if (hasAOMap && attributes['TEXCOORD_0'] && !attributes['TEXCOORD_0']) {
        attributes['TEXCOORD_1'] = attributes['TEXCOORD_0'];
    }
    const attrs = {};
    for (const name in attributes) {
        // 把原有的array赋给attr，用于计算 bbox、buildUniqueVertex
        attrs[name] = extend({}, attributes[name]);
        if (regl) {
            attrs[name].buffer = getUniqueREGLBuffer(regl, attributes[name], { dimension: attributes[name].itemSize });
        }
    }

    //如果有morph，需要预先填充morph空数据，动画开启后，会不断向这些空数据中填充morphTargets数据
    if (primitive.morphTargets) {
        const length = isInterleaved(attrs['POSITION']) ? attrs['POSITION'].itemSize * attrs['POSITION'].count : attrs['POSITION'].array.length;
        for (let i = 0; i < 8; i++) {
            if (!attrs[`POSITION${i}`]) {
                attrs[`POSITION${i}`] = new Float32Array(length).fill(0);
            }
        }
        for (let i = 0; i < 4; i++) {
            const length = attrs['NORMAL'].array ? attrs['NORMAL'].array.length : attrs['NORMAL'].length;
            if (!attrs[`NORMAL${i}`]) {
                attrs[`NORMAL${i}`] = new Float32Array(length).fill(0);
            }
        }
    }
    let indices = primitive.indices;
    if (indices && indices.bufferView === undefined && indices.array) {
        indices = indices.array;
    }
    const modelGeometry = new Geometry(
        attrs,
        indices,
        0,
        {
            //绘制类型，例如 triangle strip, line等，根据gltf中primitive的mode来判断，默认是triangles
            primitive : isNumber(primitive.mode) ? getPrimitive(primitive.mode) : primitive.mode,
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

function numericalSort(a, b) {
    return a[ 0 ] - b[ 0 ];
}

function absNumericalSort(a, b) {
    return Math.abs(b[1]) - Math.abs(a[1]);
}
