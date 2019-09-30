import { mat4 } from 'gl-matrix';
import { defined, isNumber } from './common/Util';
import * as gltf from '@maptalks/gltf-loader';
import Skin from './gltf/Skin';
import TRS from './gltf/TRS';
import AnimationClip from './gltf/AnimationClip';
import Geometry from './Geometry';

const animMatrix = [];
const MODES = ['points', 'lines', 'line strip', 'line loop', 'triangles', 'triangle strip', 'triangle fan'];

export function getJSON(url, options) {
    return gltf.Ajax.getJSON(url, options);
}

export function getArrayBuffer(url, options) {
    return gltf.Ajax.getArrayBuffer(url, options);
}

export function exportGeometries(gltf) {
    const nodes = gltf.scenes[0].nodes;
    const geometries = [];
    nodes.forEach((node) => {
        parserNode(node, geometries);
    });
    return geometries;
}

export function createGeometry(primitive) {
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

export function updateAnimation(time, json, loop, speed, node) {
    const timespan = json.animations ? AnimationClip.getTimeSpan(json) : null;
    const animTime = loop ? (time * 0.001) % (timespan.max - timespan.min) : time * 0.001;
    AnimationClip.getAnimationClip(animMatrix, json, Number(node.nodeIndex), animTime * speed);
    return animMatrix;
}

export function load(root, options) {
    const loader = new gltf.GLTFLoader(root, options);
    return loader.load();
}

function parserNode(node, geometries) {
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
            parserNode(child, geometries);
        }
    }
    if (defined(node.mesh)) {
        node.mesh = node.meshes[0];
        node.mesh.node = node;
        node.mesh.primitives.forEach(primitive => {
            const geometry = createGeometry(primitive);
            geometries.push({
                geometry,
                material : primitive.material,
                node
            });
        });
    }
    if (node.skin) {
        const skin = node.skin;
        node.trs = new TRS();
        node.skin = new Skin(skin.joints, skin.inverseBindMatrices.array);
    }
    if (node.weights) {
        node.morphWeights = [];
    }
    node.isParsed = true;
}
