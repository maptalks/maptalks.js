import { mat4, vec3, quat } from '@maptalks/gl';
import TranslateHelper from './TranslateHelper';
import RotationHelper from './RotationHelper';
import ScalingHelper from './ScalingHelper';
import PlaneHelper from './PlaneHelper';
import { prepareMesh, calFixedScale, getTranslationPoint } from '../common/Util.js';

const VEC3 = [], TRANS = [], MAT4 = [], QUAT = [], SCALE = [], ratio = [177 / 170, 177 / 170, 177 / 170];
const scaleChangePickingIds = [1, 2, 3, 4, 12];

export default class TransformHelper {
    constructor() {
        this.translate = new TranslateHelper();
        this.rotation = new RotationHelper();
        this.scaling = new ScalingHelper();
        this.planeHelper = new PlaneHelper();
        this._meshes = this._prepareMeshes();
        this._rotateClockwise = true;
    }

    _prepareMeshes() {
        const meshes = {};
        meshes['translate'] = this.translate.getMeshes();
        meshes['rotation'] = this.rotation.getMeshes();
        meshes['scaling'] = this.scaling.getMeshes();
        meshes['planeHelper'] = this.planeHelper.getMeshes();
        const scale = 340 / 177;
        const wn = prepareMesh('yuanhuan41', [-2.745 * scale, 2.745 * scale, 0], [90, 0, 0], [scale * 0.5, scale * 0.5, scale * 0.5], [149 / 255, 179 / 255, 199 / 255, 0.6], 1);//缩放
        const en = prepareMesh('yuanhuan41', [2.745 * scale, 2.745 * scale, 0], [-90, 0, 180], [scale * 0.5, scale * 0.5, scale * 0.5], [50 / 255, 130 / 255, 184 / 255, 0.5], 2);
        const es = prepareMesh('yuanhuan41', [2.745 * scale, -2.745 * scale, 0], [90, 0, 180], [scale * 0.5, scale * 0.5, scale * 0.5], [149 / 255, 179 / 255, 199 / 255, 0.6], 3);//缩放
        const ws = prepareMesh('yuanhuan41', [-2.745 * scale, -2.745 * scale, 0], [-90, 0, 0], [scale * 0.5, scale * 0.5, scale * 0.5], [50 / 255, 130 / 255, 184 / 255, 0.5], 4);
        const yuanpan = prepareMesh('yuanpan', [0, 0, 0], [90, 0, 0], [scale * 0.5, scale * 0.5, scale * 0.5], [89 / 255, 206 / 255, 147 / 255, 0.5], 5);
        const zzhou = prepareMesh('zzhou', [0, 0, 6.5], [90, 0, 0], [1, 1, 1], [14 / 255, 127 / 255, 191 / 255, 1], 6);
        meshes['translate'].push(wn, en, es, ws, yuanpan, zzhou);
        return meshes;
    }

    updateMatrix(map, target, angle, scalar, deltaTrans) {
        const coordinate = target.getCoordinates();
        const p = map.coordinateToPointAtRes(coordinate, map.getGLRes());
        const z = target.getPointZ();
        vec3.set(TRANS, p.x, p.y, z);
        const deltaTranslate = vec3.copy(VEC3, deltaTrans);
        const currentTrans = getTranslationPoint(map, target.getTranslation()); //由于gltfmarker中translation单位改成了米，不能直接这样加，需要转换一下
        vec3.add(TRANS, TRANS, currentTrans);
        vec3.add(TRANS, TRANS, deltaTranslate);
        for (const name in this._meshes) {
            for (let i = 0; i < this._meshes[name].length; i++) {
                const m = this._meshes[name][i];
                for (let j = 0; j < m.length; j++) {
                    const mesh = m[j];
                    const pickingId = mesh.getUniform('uPickingId');
                    const translate = vec3.copy(VEC3, mesh.translate);
                    const rotation = [mesh.rotation[0], mesh.rotation[1], mesh.rotation[2]];
                    const scaling = mesh.scaling;
                    if (pickingId === 11) {
                        if (this._rotateClockwise) {
                            rotation[2] += angle;
                            mesh.rotation[2] += angle;
                        } else if (!this._rotateClockwise) {
                            rotation[2] += angle;
                            mesh.rotation[2] += angle;
                            rotation[0] = 360;
                            rotation[2] -= 90;
                        }
                    }
                    if (scaleChangePickingIds.indexOf(pickingId) > -1) {
                        if (pickingId !== 12) {
                            scaling[0] += scalar;
                            scaling[1] += scalar;
                            scaling[2] += scalar;
                        } else {
                            const translateMesh = this._meshes['translate'][4][0];
                            scaling[0] = translateMesh.scaling[0] * 1.2;
                            scaling[1] = translateMesh.scaling[0] * 1.2;
                            scaling[2] = translateMesh.scaling[0] * 1.2;
                        }
                    }
                    let fixedScale = calFixedScale(target, map);
                    fixedScale = vec3.set(MAT4, fixedScale, fixedScale, fixedScale);
                    vec3.multiply(translate, translate, fixedScale);
                    vec3.multiply(fixedScale, fixedScale, scaling);
                    if (pickingId === 1 || pickingId === 2 || pickingId === 3 || pickingId === 4) {
                        const tmpScale = vec3.multiply(SCALE, scaling, ratio);
                        vec3.multiply(translate, translate, tmpScale);
                    }
                    const rotate = quat.fromEuler(QUAT, rotation[0], rotation[1], rotation[2]);
                    vec3.add(translate, translate, TRANS);
                    mat4.fromRotationTranslationScale(mesh.localTransform, rotate, translate, fixedScale);
                }
            }
        }
    }

    getMeshes(mode) {
        const meshes = {};
        meshes['translate'] = this._meshes.translate;
        if (mode && mode !== 'translate') {
            meshes[mode] = this._meshes[mode];
        }
        return meshes;
    }

    _setRotateClockwise(clockwise) {
        this._rotateClockwise = clockwise;
    }

    dispose() {
        for (const name in this._meshes) {
            for (let i = 0; i < this._meshes[name].length; i++) {
                const m = this._meshes[name][i];
                for (let j = 0; j < m.length; j++) {
                    const mesh = m[j];
                    mesh.geometry.dispose();
                    mesh.dispose();
                }
            }
        }
    }
}
