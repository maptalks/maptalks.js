import { Coordinate } from "maptalks";
import { vec3 } from '@maptalks/gl';

const EMPTY_VEC = [];
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
            const currentCoordinate = target.getCoordinates();
            const currentWorldPos = map.coordinateToPointAtRes(currentCoordinate, map.getGLRes());
            const currentRotation = target.getRotation();
            const currentScaling = target.getScale();
            const currentWorlPosition = vec3.set([], currentWorldPos.x, currentWorldPos.y, currentCoordinate.z || 0);

            const targetWorldPosition = vec3.add(currentWorlPosition, currentWorlPosition, deltaTranslate);
            const targetCoordinate = map.pointAtResToCoordinate(new Coordinate(targetWorldPosition[0], targetWorldPosition[1]), map.getGLRes());
            targetCoordinate.z = targetWorldPosition[2];
            let tempScale = null;
            //放大时，拉伸的空间可无限大，但是缩小时，是向圈内缩放，空间有限，需要增加缩小的倍数
            if (deltaScale >= 0) {
                tempScale = deltaScale;
            } else {
                tempScale = deltaScale * (this.options && this.options.scaleStrength || 1.0);
            }
            const targetScale = vec3.add([], vec3.set(EMPTY_VEC, tempScale, tempScale * (currentScaling[1] / currentScaling[0]), tempScale * (currentScaling[2] / currentScaling[0])), currentScaling);
            const minScale = Math.min(...targetScale);
            //minScale可能会出现<=0的情况，所以minScale只作为判断是否要限定scale的依据，计算的逻辑则用当前target的scale去计算，当前target的scale可以保证>=0.01
            if (minScale < limitScale) {
                const currentMinScale = Math.min(...targetScale);
                targetScale[0] = targetScale[0] * (limitScale / currentMinScale);
                targetScale[1] = targetScale[1] * (limitScale / currentMinScale);
                targetScale[2] = targetScale[2] * (limitScale / currentMinScale);
            }
            const targetRotation = vec3.add(currentRotation, deltaRotation, currentRotation);
            if (task.indexOf('translate') > -1) {
                transformcontrol.fire('positionchange', { action: task, type: 'positionchange', target: this, coordinate: targetCoordinate });
                target.setCoordinates(targetCoordinate);
            } else {
                this._scaleXYZ(task, targetScale, currentScaling);
                const currentTrans = target.getTranslation();
                target.setTRS(currentTrans, targetRotation, targetScale);
                transformcontrol.fire('transforming', { action: this._task, type: 'transforming', target: this, translate: currentTrans, rotation: targetRotation, scale: targetScale });
            }
        }
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
        return this._translating;
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
        return new Coordinate(cx, cy, cz);
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
