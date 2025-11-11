import { Coordinate, Point } from "maptalks";
import { vec3, mat4, quat } from '@maptalks/gl';

const EMPTY_VEC = [], EMPTY_QUAT = [], EMPTY_MAT = [], TEMP_POINT = new Point(0, 0), TEMP_VEC_1 = [], TEMP_VEC_2 = [], TEMP_SCALE = [], EMPTY_TRANS = [0, 0, 0];
export default class TransformTarget {
    constructor() {
        this._targetList = [];
        this._translating = [0, 0, 0];
        this._scaling = [1, 1, 1];
        this._rotation = [0, 0, 0];
    }

    _add(target) {
        if (Array.isArray(target)) {
            target.forEach(t => {
                this._add(t);
            });
        } else {
            target.on('remove', this._onRemoveTarget, this);
            target._originTRS = {
                coordinate: target.getCoordinates(),
                translation: target.getTranslation(),
                rotation: target.getRotation(),
                scale: target.getScale()
            };
            this._targetList.push(target);
        }
    }

    _clear() {
        this._targetList.forEach(t => {
            t.off('remove', this._onRemoveTarget, this);
        });
        this._targetList = [];
    }

    _updateTRS(task, deltaTranslate, deltaRotation, deltaScale, limitScale, map, transformcontrol) {
        for (let i = 0; i < this._targetList.length; i++) {
            const target = this._targetList[i];
            const currentRotation = target.getRotation();
            const currentScaling = target.getScale();
            const targetCoordinate = this._calNewCenter(map, target, deltaScale, deltaRotation, deltaTranslate);
            let tempScale = null;
            //放大时，拉伸的空间可无限大，但是缩小时，是向圈内缩放，空间有限，需要增加缩小的倍数
            if (deltaScale >= 0) {
                tempScale = deltaScale;
            } else {
                tempScale = deltaScale * (this.options && this.options.scaleStrength || 1.0);
            }
            const targetScale = vec3.add(TEMP_SCALE, vec3.set(EMPTY_VEC, tempScale *  currentScaling[0], tempScale * currentScaling[1], tempScale * currentScaling[2]), currentScaling);
            const minScale = Math.min(...targetScale);
            //minScale可能会出现<=0的情况，所以minScale只作为判断是否要限定scale的依据，计算的逻辑则用当前target的scale去计算，当前target的scale可以保证>=0.01
            if (Math.abs(minScale) < limitScale) {//scale有可能是负，例如翻转的情况
                const currentMinScale = Math.abs(minScale);
                targetScale[0] = targetScale[0] * (limitScale / currentMinScale);
                targetScale[1] = targetScale[1] * (limitScale / currentMinScale);
                targetScale[2] = targetScale[2] * (limitScale / currentMinScale);
            }
            const targetRotation = vec3.add(currentRotation, deltaRotation, currentRotation);
            target.setCoordinates(targetCoordinate);
            this._scaleXYZ(task, targetScale, currentScaling);
            const currentTrans = target.getTranslation();
            target.setTRS(currentTrans, targetRotation, targetScale);
        }
        vec3.set(TEMP_SCALE, deltaScale, deltaScale, deltaScale);
        vec3.add(this._rotation, deltaRotation, this._rotation);
        vec3.add(this._scaling, TEMP_SCALE, this._scaling);
        vec3.add(this._translating, deltaTranslate, this._translating);
        if (task.indexOf('translate') > -1) {
            transformcontrol.fire('positionchange', { action: task, type: 'positionchange', transformtarget: this._targetList, center: this.getCoordinates(), scale: this._scaling, rotation: this._rotation, translation: this._translating, deltaTranslate, deltaRotation, deltaScale });
        } else {
            transformcontrol.fire('transforming', { action: task, type: 'transforming', transformtarget: this._targetList, center: this._targetList[0].getTransformOrigin(), scale: this._scaling, rotation: this._rotation, translation: this._translating, deltaTranslate, deltaRotation, deltaScale });
        }
    }

    _calNewCenter(map, target, deltaScale, deltaRotation, deltaTranslate) {
        const center = target.getCenter();
        const originCenter = target.getTransformOrigin();
        const glRes = map.getGLRes();
        const pCenter = map.coordinateToPointAtRes(center, glRes, TEMP_POINT);
        pCenter.z = map.altitudeToPoint(center.z, glRes);
        vec3.set(TEMP_VEC_1, pCenter.x, pCenter.y, pCenter.z || 0);
        const pOriginCenter = map.coordinateToPointAtRes(originCenter, glRes, TEMP_POINT);
        pOriginCenter.z = map.altitudeToPoint(originCenter.z, glRes);
        vec3.set(TEMP_VEC_2, pOriginCenter.x , pOriginCenter.y, pOriginCenter.z || 0);
        const point = vec3.sub(EMPTY_VEC, TEMP_VEC_1, TEMP_VEC_2);
        const rotation = quat.fromEuler(EMPTY_QUAT, 0, 0, deltaRotation[2]);
        vec3.set(TEMP_SCALE, deltaScale + 1, deltaScale + 1, deltaScale + 1);
        const trsMatrix = mat4.fromRotationTranslationScale(EMPTY_MAT, rotation, deltaTranslate, TEMP_SCALE);
        vec3.transformMat4(point, point, trsMatrix);
        vec3.add(point, point, TEMP_VEC_2);
        TEMP_POINT.set(point[0], point[1]);
        const newCenter = map.pointAtResToCoordinate(TEMP_POINT, glRes);
        newCenter.z = point[2] / map.altitudeToPoint(1, glRes);
        return newCenter;
    }

    _scaleXYZ(task, targetScale, currentScaling) {
        if (task === 'x-scale') {
            targetScale[1] = currentScaling[1];
            targetScale[2] = currentScaling[2];
        } if (task === 'y-scale') {
            targetScale[0] = currentScaling[0];
            targetScale[2] = currentScaling[2];
        } if (task === 'z-scale') {
            targetScale[0] = currentScaling[0];
            targetScale[1] = currentScaling[1];
        }
        return targetScale;
    }

    _reset() {
        this._targetList.forEach(target => {
            if (target._originTRS) {
                const { coordinate, translation, rotation, scale } = target._originTRS;
                target.setCoordinates(coordinate);
                target.setTRS(translation, rotation, scale);
            }
        });
    }

    getScale() {
        return this._scaling;
    }

    getTranslation() {
        if (this._targetList.length === 1) {
            return this._targetList[0].getTranslation() || EMPTY_TRANS;
        }
        return EMPTY_TRANS;
    }

    getRotation() {
        return this._rotation;
    }

    _getLayer() {
        if (this._targetList[0]) {
            return this._targetList[0].getLayer();
        }
        return null;
    }

    getCoordinates() {
        let cx = 0, cy = 0, cz = 0
        const len = this._targetList.length;
        if (!len) {
            return null;
        }
        for (let i = 0; i < len; i++) {
            const center = this._targetList[i].getCenter();
            cx += center.x;
            cy += center.y;
            cz += center.z || 0;
        }
        cx = cx / len;
        cy = cy / len;
        cz = cz / len;
        const newCenter = new Coordinate(cx, cy, cz);
        for (let i = 0; i < len; i++) {
            this._targetList[i].setTransformOrigin(newCenter);
        }
        return newCenter;
    }

    _onRemoveTarget(e) {
        const target = e.target;
        const index = this._targetList.indexOf(target);
        if (index > -1) {
            delete target._originTRS;
            this._targetList.splice(index, 1);
        }
    }

    getTargets() {
        return this._targetList;
    }

    _getPointZ() {
        let pz = 0
        const len = this._targetList.length;
        for (let i = 0; i < len; i++) {
            const pointZ = this._targetList[i].getPointZ();
            pz += pointZ;
        }
        pz = pz / len;
        return pz;
    }

    _isVisible() {
        for (let i = 0; i < this._targetList.length; i++) {
            if (this._targetList[i].isVisible()) {
                return true;
            }
        }
        return false;
    }
}
