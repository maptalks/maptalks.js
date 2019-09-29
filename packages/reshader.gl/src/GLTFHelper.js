import { mat4 } from 'gl-matrix';
import { defined } from './common/Util';
import * as gltf from '@maptalks/gltf-loader';
import Skin from './gltf/Skin';
import TRS from './gltf/TRS';
import AnimationClip from './gltf/AnimationClip';

const animMatrix = [];


export function getJSON(url, options) {
    return gltf.Ajax.getJSON(url, options);
}

export function getArrayBuffer(url, options) {
    return gltf.Ajax.getArrayBuffer(url, options);
}

export function exportMeshes(gltf) {
    const meshes = [];
    const nodes = gltf.scenes[0].nodes;
    nodes.forEach((node) => {
        parserNode(node, meshes);
    });
    return meshes;
}

export function updateAnimation(time, json, loop, speed, node) {
    const timespan = json.animations ? AnimationClip.getTimeSpan(json) : null;
    const animTime = loop ? (time * 0.001) % (timespan.max - timespan.min) : time * 0.001;
    //整体node动画
    AnimationClip.getAnimationClip(animMatrix, json, Number(node.nodeIndex), animTime * speed);
    node.trs.decompose(animMatrix);
    if (node.skin) {
        node.skin.joints.forEach(joint => {
            //局部骨骼动画
            AnimationClip.getAnimationClip(animMatrix, json, Number(joint.nodeIndex), animTime * speed);
            if (joint.trs) {
                node.trs.decompose(animMatrix);
            }
        });
    }
    if (node.weights) {
        for (let i = 0; i < node.weights.length; i++) {
            node.morphWeights[i] = node.weights[i];
        }
    }
}

export function load(root, options) {
    const loader = new gltf.GLTFLoader(root, options);
    return loader.load();
}

function parserNode(node, meshes) {
    if (node.isParsed) {
        return;
    }
    node.nodeMatrix = node.nodeMatrix || mat4.identity([]);
    node.localMatrix = node.localMatrix || mat4.identity([]);
    if (node.matrix) {
        node.trs = new TRS();
        node.trs.setMatrix(node.matrix);
    } else {
        node.trs = new TRS(node.translation, node.rotation, node.scale);
    }
    if (node.children) {
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            parserNode(child, meshes);
        }
    }
    if (defined(node.mesh)) {
        node.mesh = node.meshes[0];
        node.mesh.node = node;
        meshes.push(node.mesh);
    }
    if (node.skin) {
        const skin = node.skin;
        node.trs = new TRS();
        // const jointTexture = regl.texture();
        node.mesh.skin = new Skin(skin.joints, skin.inverseBindMatrices.array);
    }
    if (node.weights) {
        node.morphWeights = [];
    }
    node.isParsed = true;
}
