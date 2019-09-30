import { mat4 } from 'gl-matrix';
import { defined, isNumber } from '../common/Util';
import Skin from './Skin';
import TRS from './TRS';
import AnimationClip from './AnimationClip';
import Geometry from '../Geometry';

const animMatrix = [];
let timespan = 0;
const MODES = ['points', 'lines', 'line strip', 'line loop', 'triangles', 'triangle strip', 'triangle fan'];
export default class GLTFPack {

    constructor(gltf) {
        this.gltf = gltf;
    }

    getMeshesInfo() {
        const nodes = this.gltf.scenes[0].nodes;
        const geometries = [];
        nodes.forEach((node) => {
            parserNode(node, geometries);
        });
        return geometries;
    }

    dispose() {
        this.geometries.forEach(g => {
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
        timespan = json.animations ? AnimationClip.getTimeSpan(json) : null;
        const animTime = (loop ? (time * 0.001) % (timespan.max - timespan.min) : time * 0.001) * speed;
        json.scenes[0].nodes.forEach(node => {
            this._updateNodeMatrix(animTime, node);
        });
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
        AnimationClip.getAnimationClip(animMatrix, this.gltf, Number(node.nodeIndex), time);
        node.trs.decompose(animMatrix);
        if (node.weights) {
            for (let i = 0; i < node.weights.length; i++) {
                node.morphWeights[i] = node.weights[i];
            }
        }
    }
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
                node,
                animationMatrix : node.trs.setMatrix()
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
