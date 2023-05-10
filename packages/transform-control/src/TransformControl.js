import { mat4, quat, vec3, vec2, reshader, GroupGLLayer } from '@maptalks/gl';
import { Handlerable, Eventable, Class, Point, Coordinate } from 'maptalks';
import TransformHelper from './helper/TransformHelper';
import { calFixedScale, getTranslationPoint } from './common/Util';
import vert from './common/helper.vert';
import frag from './common/helper.frag';

const translatePickingIds = [5, 6, 7, 8, 9, 10];
const translatePickingIds0 = [5, 7, 8, 9, 10];
const rotatePickingIds = [2, 4, 11];
const scalePickingIds = [1, 3, 12];
const noChangeColorPickingIds = [12, 16];
const defaultHuanPickingIds = [1, 2, 3, 4];
const scaleChnagePickingIds = [1, 2, 3, 4, 12];
const limitScale = 0.01;
const QUAT = [], SCALE = [], TRANS = [], EMPTY_VEC = [], CENTER = [], START = [], END = [];
const options = {
    scaleStrength: 2.0
};

export default class TransformControl extends Eventable(Handlerable(Class)) {
    constructor(options) {
        super(options);
        this.options = options;
        this.mouseAction = 'moving';
        this._mode = 'translate';
        this._enabled = true;
        this.TransformHelper = new TransformHelper();
        this.helperScene = new reshader.Scene([]);
        this.addToMapCount = 0;
    }

    enable() {
        this._enabled = true;
        if (this.layerRenderer) {
            this.layerRenderer.setToRedraw();
        }
        return this;
    }

    disable() {
        this._enabled = false;
        if (this.layerRenderer) {
            this.layerRenderer.setToRedraw();
        }
        if (this.map) {
            this.map.resetCursor();
        }
        return this;
    }

    isEnable() {
        return this._enabled;
    }

    _setMode(pickingId) {
        if (translatePickingIds.indexOf(pickingId) > -1) {
            this._mode = 'translate';
        } else if (rotatePickingIds.indexOf(pickingId) > -1) {
            this._mode = 'rotation';
        } else if (scalePickingIds.indexOf(pickingId) > -1) {
            this._mode = 'scaling';
        } else {
            this._mode = 'translate';
        }
    }

    _getMode() {
        return this._mode;
    }

    addTo(map) {
        if (this.map) {
            this._removeEvents();
            console.warn('transform control has been added to a map, it suggest remove from the map before');
        }
        this.addToMapCount++;
        this.map = map;
        this.container = map.getContainer();
        map.on('dom:mousemove', this._mouseMoveHandle, this);
        map.on('dom:mousedown', this._mousedownHandle, this);
        map.on('dom:mouseup', this._mouseupHandle, this);
        map.on('zooming moving dragrotating', this._viewchanging, this);
        this._initShader();
    }

    remove() {
        if (!this.map || !this.container || !this.layerRenderer) {
            return;
        }
        this._removeEvents();
        this.TransformHelper.dispose();
        this.layerRenderer.setToRedraw();
        delete this.map;
        delete this.layer;
        delete this.layerRenderer;
        delete this.container;
        delete this._target;
    }

    _removeEvents() {
        if (!this.container || !this.map) {
            return;
        }
        this.map.off('mousemove', this._mouseMoveHandle, this);
        this.map.off('mousedown', this._mousedownHandle, this);
        this.map.off('mouseup', this._mouseupHandle, this);
        this.map.off('zooming moving dragrotating', this._viewchanging, this);
        if (this.layer) {
            this.layer.off('renderend', this.render, this);
        }
    }

    _mouseMoveHandle(e) {
        if (!this._isAvailable()) {
            return;
        }
        this.currentMousePosition = {
            x: e.containerPoint.x,
            y: e.containerPoint.y
        };
        if (this.mouseAction === 'moving') {
            //在moving的情况下，会激活translate或者rotate两种模式
            const meshes = this._getMeshes();
            this.currentPickingObject = this._getPickingPoint(this.currentMousePosition, meshes, 'meshes');
            if (this.currentPickingObject && this.currentPickingObject.pickingId != null) {
                this._setMode(this.currentPickingObject.pickingId);
                if (this.currentPickingObject.pickingId === 6) {
                    this._transformPlaneHelper(true);
                } else {
                    this._transformPlaneHelper(false);
                }
            } else {
                this._transformPlaneHelper(false);
                this._setMode();
            }
            this._meshAction();
        }
        this._transformAction(this.currentMousePosition);
    }

    _mousedownHandle(e) {
        if (!this._isAvailable()) {
            return;
        }
        const meshes = this._getMeshes();
        this.currentMousePosition = {
            x: e.containerPoint.x,
            y: e.containerPoint.y
        };
        this._needRefreshPicking = true;
        this.currentPickingObject = this._getPickingPoint(this.currentMousePosition, meshes, 'meshes');
        this.firstDownPoint = this._getPickingPoint(this.currentMousePosition, meshes, 'meshes');
        if (this.currentPickingObject && this.currentPickingObject.meshId != null) {
            this.mouseAction = 'transform';
            this._setTask(this.currentPickingObject.pickingId);
            this.map.config('zoomable', false);
            this.map.config('draggable', false);
            if (this.layerRenderer) {
                this.layerRenderer.setToRedraw();
            }
        } else {
            this.mouseAction = 'pan';
            this.map.config('zoomable', true);
            this.map.config('draggable', true);
            this._resetScale();
        }
        this.lastMousePosition = this.currentMousePosition;
        this.lastPickingObject = this.currentPickingObject;
        this.lastPickingMesh = meshes[this.currentPickingObject.meshId];
    }

    _mouseupHandle() {
        if (this.mouseAction === 'transform') {
            this.firstDownPoint = null;
            this._resetScale();
            this._needRefreshPicking = true;
            this.fire('transformend', { action: this._task, type: 'transformend' });
        }
        this.mouseAction = 'moving';
        this._mode = 'translate';
        this.map.config('zoomable', true);
        this.map.config('draggable', true);
        if (this.layerRenderer) {
            this.layerRenderer.setToRedraw();
        }
    }

    _viewchanging() {
        const planeMesh = this.TransformHelper.planeHelper.getMeshes()[0][0];
        const bearing = this.map.getBearing();
        planeMesh.rotation[2] = -bearing;
        this._updateMatrix();
    }

    _updateMatrix() {
        if (!this._isAvailable()) {
            return;
        }
        this.TransformHelper.updateMatrix(this.map, this._target, 0, 0, [0, 0, 0]);
        this._needRefreshPicking = true;
    }

    picked(coordinate) {
        if (!this.layerRenderer) {
            return false;
        }
        const meshes = this._getMeshes();
        const map = this.map;
        let containerPoint = coordinate;
        if (!(coordinate instanceof Point)) {
            containerPoint = map.coordinateToContainerPoint(new Coordinate(coordinate));
        }
        const pickingObject = this._getPickingPoint(containerPoint, meshes, 'picked');
        if (pickingObject && pickingObject.meshId !== null) {
            return true;
        }
        return false;
    }

    _resetScale() {
        const scalingMesh = this.TransformHelper.getMeshes('scaling')['scaling'][0][0];
        const scale = 340 / 177;
        scalingMesh.scaling = [0.6 * scale, 0.6 * scale, 0.6 * scale];
        if (this.layerRenderer) {
            this._resetScaleControl(scalingMesh);
            this._resetDefaultColor();
        }
    }

    _resetDefaultColor() {
        const defaultMeshes = this.TransformHelper['_meshes'].translate;
        defaultMeshes.forEach(meshes => {
            for (let i = 0; i < meshes.length; i++) {
                const mesh = meshes[i];
                if (defaultHuanPickingIds.indexOf(mesh.getUniform('uPickingId')) > -1) {
                    mesh.material.set('color', mesh.originColor);
                }
            }
        });
    }

    _resetScaleControl(mesh) {
        const coordinate = this._target.getCoordinates();
        const p = this.map.coordinateToPointAtRes(coordinate, this.map.getGLRes());
        const trans = [p.x, p.y, 0];
        const originTrans = getTranslationPoint(this.map, this._target.getTranslation());
        vec3.add(trans, trans, originTrans);
        const translate = vec3.copy([], mesh.translate);
        const scaling = mesh.scaling;
        let fixedScale = calFixedScale(this._target, this.map);
        fixedScale = vec3.set([], fixedScale, fixedScale, fixedScale);
        vec3.multiply(translate, translate, fixedScale);
        vec3.multiply(fixedScale, fixedScale, scaling);
        vec3.add(translate, translate, trans);
        mat4.fromRotationTranslationScale(mesh.localTransform, [0, 0, 0, 1], translate, fixedScale);
        const meshes = this._getMeshes();
        meshes.forEach(mesh => {
            const meshid = mesh.getUniform('uPickingId');
            if (meshid === 1 || meshid === 3 || meshid === 2 || meshid === 4) {
                const translate = vec3.copy([], mesh.translate);
                const scale = 170 / 177;
                mesh.scaling = [scale, scale, scale];
                const scaling = mesh.scaling;
                const rotation = mesh.rotation;
                let fixedScale = calFixedScale(this._target, this.map);
                fixedScale = vec3.set([], fixedScale, fixedScale, fixedScale);
                vec3.multiply(translate, translate, fixedScale);
                vec3.multiply(fixedScale, fixedScale, scaling);
                vec3.add(translate, translate, trans);
                const rotate = quat.fromEuler([], rotation[0], rotation[1], rotation[2]);
                mat4.fromRotationTranslationScale(mesh.localTransform, rotate, translate, fixedScale);
            }
        });
    }

    _getWorldPosition(containerPoint) {
        const coordinate = this.map.containerPointToCoordinate(containerPoint);
        const worldPosition = this.map.coordinateToPointAtRes(coordinate, this.map.getGLRes());
        return {
            point: [worldPosition.x, worldPosition.y]
        };
    }

    _transformAction(mousePosition) {
        if (this.mouseAction === 'transform') {
            const mode = this._getMode();
            const currentTrans = getTranslationPoint(this.map, this._target.getTranslation());
            const z = this._target.getPointZ();
            const currentCoordinate = this._target.getCoordinates();
            const currentWorldPos = this.map.coordinateToPointAtRes(currentCoordinate, this.map.getGLRes());
            const currentRotation = this._target.getRotation();
            const currentScaling = this._target.getScale();
            let planeInteract = null, lastPlaneInteract = null;
            if (currentTrans[2] + z < 0.01 && this._task !== 'z-translate') { //target不是贴着地面的情况下
                planeInteract = this._getWorldPosition(this.currentMousePosition);
                lastPlaneInteract = this._getWorldPosition(this.lastMousePosition);
            } else {
                const planeMesh = this.TransformHelper.planeHelper.getMeshes()[0];
                planeInteract = this._getPickingPoint(this.currentMousePosition, planeMesh, 'plane');
                lastPlaneInteract = this._getPickingPoint(this.lastMousePosition, planeMesh, 'plane');
                if (!planeInteract || planeInteract.meshId === null || !lastPlaneInteract || lastPlaneInteract.meshId === null) {
                    return;
                }
            }
            const deltaTranslate = [0, 0, 0];
            const rotation = [0, 0, 0];
            let deltaScale = 0;
            let deltaAngle = 0;
            let helperDeltaScale = 0;
            if (mode === 'translate') {
                if (this._task === 'xy-translate') {
                    const deltaTransX = planeInteract.point[0] - lastPlaneInteract.point[0];
                    const deltaTransY = planeInteract.point[1] - lastPlaneInteract.point[1];
                    deltaTranslate[0] = deltaTransX;
                    deltaTranslate[1] = deltaTransY;
                } else if (this._task === 'x-translate') {
                    const deltaTransX = planeInteract.point[0] - lastPlaneInteract.point[0];
                    deltaTranslate[0] = deltaTransX;
                } else if (this._task === 'y-translate') {
                    const deltaTransY = planeInteract.point[1] - lastPlaneInteract.point[1];
                    deltaTranslate[1] = deltaTransY;
                } else if (this._task === 'z-translate') {
                    let deltaTransZ = 0;
                    if (!this._isInMapCenter()) {
                        deltaTransZ = planeInteract.point[2] - lastPlaneInteract.point[2];
                    } else {
                        const glRes = this.map.getGLRes();
                        const lastContainerPoint = this.map['_pointAtResToContainerPoint'](new Point(lastPlaneInteract.point[0], lastPlaneInteract.point[1]), glRes);
                        const currentContainerPoint = this.map['_pointAtResToContainerPoint'](new Point(planeInteract.point[0], planeInteract.point[1]), glRes);
                        const distance = vec2.length(vec2.set(EMPTY_VEC, planeInteract.point[0] - lastPlaneInteract.point[0], planeInteract.point[1] - lastPlaneInteract.point[1]));
                        if (currentContainerPoint.y < lastContainerPoint.y) {
                            deltaTransZ = distance;
                        } else {
                            deltaTransZ = -distance;
                        }
                    }
                    deltaTranslate[2] = Math.sign(deltaTransZ) * this.map.pointAtResToAltitude(deltaTransZ, this.map.getGLRes());
                }
            } else if (mode === 'rotation') {
                deltaAngle = this._calAngle(planeInteract.point, lastPlaneInteract.point);
                if (deltaAngle >= 0) {
                    this.TransformHelper._setRotateClockwise(true);
                } else {
                    this.TransformHelper._setRotateClockwise(false);
                }
                rotation[2] += deltaAngle;
            } else if (mode === 'scaling') {
                const center = this._getCurrentCenter();
                const firstDistance = vec2.length(vec2.set(EMPTY_VEC, this.firstDownPoint.point[0] - center[0], this.firstDownPoint.point[1] - center[1]));
                const scaleDistance = vec2.length(vec2.set(EMPTY_VEC, lastPlaneInteract.point[0] - center[0], lastPlaneInteract.point[1] - center[1]));
                deltaScale = this._calDirection(planeInteract.point, lastPlaneInteract.point, center, scaleDistance, currentScaling);
                helperDeltaScale = this._calDirection(planeInteract.point, lastPlaneInteract.point, center, firstDistance);
            }
            const currentWorlPosition = vec3.set([], currentWorldPos.x, currentWorldPos.y, currentCoordinate.z || 0);
            const targetWorldPosition = vec3.add(currentWorlPosition, currentWorlPosition, deltaTranslate);
            const targetCoordinate = this.map.pointAtResToCoordinate(new Coordinate(targetWorldPosition[0], targetWorldPosition[1]), this.map.getGLRes());
            targetCoordinate.z = targetWorldPosition[2];
            let tempScale = null;
            //放大时，拉伸的空间可无限大，但是缩小时，是向圈内缩放，空间有限，需要增加缩小的倍数
            if (deltaScale >= 0) {
                tempScale = deltaScale;
            } else {
                tempScale = deltaScale * (this.options && this.options.scaleStrength || 1.0);
            }
            const targetScale = vec3.add(currentScaling, vec3.set(EMPTY_VEC, tempScale, tempScale * (currentScaling[1] / currentScaling[0]), tempScale * (currentScaling[2] / currentScaling[0])), currentScaling);
            const minScale = Math.min(...targetScale);
            //minScale可能会出现<=0的情况，所以minScale只作为判断是否要限定scale的依据，计算的逻辑则用当前target的scale去计算，当前marker的scale可以保证>=0.01
            if (minScale < limitScale) {
                const currentMinScale = Math.min(...currentScaling);
                targetScale[0] = currentScaling[0] * (limitScale / currentMinScale);
                targetScale[1] = currentScaling[1] * (limitScale / currentMinScale);
                targetScale[2] = currentScaling[2] * (limitScale / currentMinScale);
            }
            const targetRotation = vec3.add(currentRotation, rotation, currentRotation);
            this.TransformHelper.updateMatrix(this.map, this._target, deltaAngle, helperDeltaScale, deltaTranslate);
            if (this._task.indexOf('translate') > -1) {
                this.fire('positionchange', { action: this._task, type: 'positionchange', target: this._target, coordinate: targetCoordinate });
            } else {
                this.fire('transforming', { action: this._task, type: 'transforming', target: this._target, translate: currentTrans, rotation: targetRotation, scale: targetScale });
            }

        }
        this.lastMousePosition = mousePosition;
        this.lastPickingObject = this.currentPickingObject;
        const meshes = this._getMeshes();
        this.lastPickingMesh = meshes[this.currentPickingObject.meshId];
    }

    _calDirection(from, to, center, distance, currentScaling) {
        const distanceFrom = vec2.length(vec2.set(EMPTY_VEC, from[0] - center[0], from[1] - center[1]));
        const distanceTo = vec2.length(vec2.set(EMPTY_VEC, to[0] - center[0], to[1] - center[1]));
        const scalar = (distanceFrom - distanceTo) / distance;
        if (currentScaling) {
            return (currentScaling[0] - limitScale) * scalar;
        }
        return scalar;
    }

    _getCurrentCenter() {
        const map = this.map;
        const coordinate = this._target.getCoordinates();
        const center = map.coordinateToPointAtRes(coordinate, map.getGLRes());
        const trans = vec3.set(CENTER, center.x, center.y, 0);
        const currentTrans = getTranslationPoint(map, this._target.getTranslation());
        vec3.add(trans, trans, currentTrans);
        return trans;
    }

    _transformPlaneHelper(rotated) {
        const planeMesh = this.TransformHelper.planeHelper.getMeshes()[0][0];
        const trans = mat4.getTranslation(TRANS, planeMesh.localTransform);
        const scaling = mat4.getScaling(SCALE, planeMesh.localTransform);
        let rotation = quat.fromEuler(QUAT, 0, 0, 0);
        const bearing = this.map.getBearing();
        if (rotated && !this._isInMapCenter()) {
            rotation = quat.fromEuler(QUAT, 90, 0, -bearing);
            if (planeMesh.rotation[0] === 0) {
                this._needRefreshPicking = true;
            }
            vec3.set(planeMesh.rotation, 90, 0, -bearing);
        } else {
            if (planeMesh.rotation[0] === 90) {
                this._needRefreshPicking = true;
            }
            vec3.set(planeMesh.rotation, 0, 0, -bearing);
        }
        mat4.fromRotationTranslationScale(planeMesh.localTransform, rotation, trans, scaling);
    }

    _isInMapCenter() {
        if (this.map.getPitch()) {
            return false;
        }
        const cameraPos = this.map.cameraPosition;
        const centerPos = this.map.coordinateToPointAtRes(this.map.getCenter(), this.map.getGLRes());
        vec3.set(centerPos, centerPos.x, centerPos.y, 0);
        const coordinate = this._target.getCoordinates();
        const p = this.map.coordinateToPointAtRes(coordinate, this.map.getGLRes());
        const trans = getTranslationPoint(this.map, this._target.getTranslation());
        const position = vec3.set(TRANS, p.x, p.y, 0);
        const worldPos = vec3.add(position, position, trans);
        const vTargetToCamera = vec3.subtract([], cameraPos, worldPos);
        const vCenterToCamera = vec3.subtract([], cameraPos, centerPos);
        const angle = vec3.angle(vTargetToCamera, vCenterToCamera);
        const theta = (1 / 180) * Math.PI;
        if (angle < theta) {
            return true;
        }
        return false;
    }

    _meshAction() {
        const meshes = this._getMeshes();
        if (this.currentPickingObject && this.currentPickingObject.meshId != null) {
            this._setCursor();
            if (this.lastPickingObject && this.lastPickingObject.meshId != null && this.lastPickingObject.meshId !== this.currentPickingObject.meshId) {
                this._resetColor();
            }
            const pickedMesh = meshes[this.currentPickingObject.meshId];
            if (pickedMesh && noChangeColorPickingIds.indexOf(this.currentPickingObject.pickingId) < 0) {
                const color = [pickedMesh.originColor[0], pickedMesh.originColor[1], pickedMesh.originColor[2], 0.8];
                pickedMesh.material.set('color', color);
                this._setTranslateMeshesColor(pickedMesh, 0.5);
            }
            this.layerRenderer.setToRedraw();
        } else if (this.lastPickingObject && this.lastPickingObject.meshId != null) {
            this.map.resetCursor();
            this._resetColor();
            this.layerRenderer.setToRedraw();
        }
    }

    _setCursor() {
        if (this.currentPickingObject.pickingId === 6) {
            this.map.setCursor('ns-resize');
        } else if (translatePickingIds0.indexOf(this.currentPickingObject.pickingId) > -1) {
            this.map.setCursor('move');
        } else {
            this.map.setCursor('pointer');
        }
    }

    _resetColor() {
        const lastMesh = this.lastPickingMesh;
        if (!lastMesh) {
            return;
        }
        const pickedId = lastMesh.getUniform('uPickingId');
        const meshes = this._getMeshes();
        if (translatePickingIds0.indexOf(pickedId) > -1) {
            meshes.forEach(mesh => {
                if (translatePickingIds0.indexOf(mesh.getUniform('uPickingId')) > -1) {
                    mesh.material.set('color', mesh.originColor);
                }
            });
        } else if (scaleChnagePickingIds.indexOf(pickedId) > -1) {
            meshes.forEach(mesh => {
                const meshid = mesh.getUniform('uPickingId');
                if (defaultHuanPickingIds.indexOf(meshid) > -1) {
                    mesh.material.set('color', mesh.originColor);
                }
            });
        } else if (pickedId === 11) {
            meshes.forEach(mesh => {
                if (defaultHuanPickingIds.indexOf(mesh.getUniform('uPickingId')) > -1) {
                    mesh.material.set('color', mesh.originColor);
                }
            });
        }
        lastMesh.material.set('color', lastMesh.originColor);
    }

    _setTranslateMeshesColor(pickedMesh, opacity) {
        const pickedId = pickedMesh.getUniform('uPickingId');
        const meshes = this._getMeshes();
        if (translatePickingIds0.indexOf(pickedId) > -1) {
            meshes.forEach(mesh => {
                if (translatePickingIds0.indexOf(mesh.getUniform('uPickingId')) > -1) {
                    if (mesh.getUniform('uPickingId') !== pickedMesh.getUniform('uPickingId')) {
                        const color = [mesh.originColor[0], mesh.originColor[1], mesh.originColor[2], opacity];
                        mesh.material.set('color', color);
                    }
                }
            });
        } else if (this._mode === 'scaling') {
            meshes.forEach(mesh => {
                const meshid = mesh.getUniform('uPickingId');
                if (meshid === 1 || meshid === 3 || meshid === 2 || meshid === 4) {
                    const color = [149 / 255, 179 / 255, 199 / 255, 0.8];
                    mesh.material.set('color', color);
                }
            });
        } else if (this._mode === 'rotation') {
            meshes.forEach(mesh => {
                const meshid = mesh.getUniform('uPickingId');
                if (meshid === 1 || meshid === 3 || meshid === 2 || meshid === 4) {
                    const color = mesh.originColor;
                    mesh.material.set('color', [color[0], color[1], color[2], 0]);
                }
            });
        }
    }

    reset() {
        if (!this.map || !this._target) {
            return;
        }
        this._target.setTranslation(this._target.originTrans);
        this._target.setRotation(this._originRotation);
        this._target.setScale(this._originScale);
        const currentTrans = getTranslationPoint(this.map, this._target.getTranslation());
        vec3.scale(currentTrans, currentTrans, -1);
        this.TransformHelper.updateMatrix(this.map, this._target, 0, 1, [0, 0, 0]);
    }

    _calAngle(to, from) {
        const center = this._getCurrentCenter();
        const startDirection = vec2.set(START, from[0] - center[0], from[1] - center[1]);
        const endDirection = vec2.set(END, to[0] - center[0], to[1] - center[1]);
        const startAngle = Math.atan2(startDirection[1], startDirection[0]);
        const endAngle = Math.atan2(endDirection[1], endDirection[0]);
        return ((endAngle - startAngle) / Math.PI) * 180;
    }

    _setTask(pickingId) {
        //根据pickingId来判断被鼠标命中的是哪个辅助部件，从而判定当前执行的操作
        if (pickingId === 5) {
            this._task = 'xy-translate';
        } else if (pickingId === 6) {
            this._task = 'z-translate';
        } else if (pickingId === 7 || pickingId === 9) {
            this._task = 'x-translate';
        } else if (pickingId === 8 || pickingId === 10) {
            this._task = 'y-translate';
        } else if (pickingId === 11) {
            this._task = 'z-rotate';
        } else {
            this._task = 'scale';
        }
        return this._task;
    }

    transform(target) {
        if (this.layerRenderer && this.layerRenderer.layer) {
            this.layerRenderer.layer.off('renderend', this.render);
            this.layerRenderer.layer.off('resizeCanvas', this._resize);
        }
        if (this._target) {
            this._target.off('remove', this._onRemoveTarget, this);
            delete this._target;
        }
        this._target = target;
        this._target.on('remove', this._onRemoveTarget, this);
        if (!this.map) {
            console.error('should add to a target first');
            return;
        }
        const map = this.map;
        if (!this._target.originTrans) {
            this._target.originTrans = getTranslationPoint(map, this._target.getTranslation());
            this._target.originRotation = this._target.getRotation();
            this._target.originScale = this._target.getScale();
        }
        this.TransformHelper.updateMatrix(map, target, 0, 0, [0, 0, 0]);
        this._prepareContext();
        this._needRefreshPicking = true;
    }

    getTransformTarget() {
        return this._target;
    }

    _onRemoveTarget() {
        delete this._target;
    }

    _prepareContext() {
        const layer = this._target.getLayer();
        if (layer) {
            layer.off('renderend', this.render);
            layer.off('resizeCanvas', this._resize);
        }
        const layers = this.map.getLayers();
        let gllayer = null;
        for (let i = 0; i < layers.length; i++) {
            if (layers[i] instanceof GroupGLLayer) {
                gllayer = layers[i];
                break;
            }
        }
        if (!gllayer) {
            return;
        }
        const gllayers = gllayer.getLayers();
        const layerIndex = gllayers.indexOf(layer);
        if (layerIndex < 0) {
            return;
        }
        gllayers.splice(layerIndex, 1);
        gllayers.push(layer);
        const map = this.map;
        const layerRenderer = layer.getRenderer();
        this.layerRenderer = layerRenderer;
        this.regl = layerRenderer.regl;
        this.renderer = layerRenderer.renderer;
        this._picking = this.layerRenderer.getFBORayPicking();
        this._uniforms = {
            'projViewMatrix' : map.projViewMatrix
        };
        layer.on('renderend', this.render, this);
        layer.on('resizeCanvas', this._resize, this);
        layerRenderer.setToRedraw();
    }

    _resize() {
        this._picking.clear();
        this._needRefreshPicking = true;
    }

    _getPickingPoint(containerPoint, meshes, task) {
        const map = this.map;
        if (!map || !this._picking || !this.layerRenderer || !this.layerRenderer.canvas) {
            return null;
        }
        const dpr = map.getDevicePixelRatio();
        const x = containerPoint.x * dpr, y = containerPoint.y * dpr;
        const uniforms = { projViewMatrix: this.map.projViewMatrix, pointSize: 1.0 };
        const inGroup = this.layerRenderer.canvas.gl && this.layerRenderer.canvas.gl.wrap;
        if (this._needRefreshPicking || inGroup || !this._pickTask || this._pickTask !== task) {
            this._picking.render(meshes, uniforms, true);
            this._pickTask = task;
            this._needRefreshPicking = false;
        }
        const picked = this._picking.pick(
            x,   // 屏幕坐标 x轴的值
            y,  // 屏幕坐标 y轴的值
            10,
            uniforms,
            {
                viewMatrix : this.map.viewMatrix,  //viewMatrix和projMatrix用于计算点的世界坐标值
                projMatrix : this.map.projMatrix,
                returnPoint : true
            }
        );
        return picked;
    }

    _initShader() {
        const dpr = this.map.getDevicePixelRatio();
        const viewport = {
            x : 0,
            y : 0,
            width : () => {
                return this.map ? this.map.width * dpr : 1;
            },
            height : () => {
                return this.map ? this.map.height * dpr : 1;
            }
        };
        this._shader = new reshader.MeshShader({
            vert,
            frag,
            uniforms : [
                'color',
                {
                    name : 'projViewModelMatrix',
                    type : 'function',
                    fn : function (context, props) {
                        return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                    }
                }
            ],
            extraCommandProps: {
                viewport,
                depth: {
                    enable: true,
                    func: 'always',
                    mask: true,
                    range: [0, 0]
                },
                blend: {
                    enable: true,
                    func: {
                        src: 'src alpha',
                        dst: 'one minus src alpha'
                    },
                    equation: 'add'
                }
            },
            defines : {
            }
        });
    }

    render() {
        if (!this._isAvailable()) {
            return;
        }
        const meshes = this._getMeshes();
        this.helperScene.setMeshes(meshes);
        const drawContext = this.layerRenderer.getFrameContext();
        //避免tc的mesh多次绘制
        if (drawContext && drawContext.renderTarget && this.layerRenderer.getFrameTimestamp() !== drawContext.timestamp) {
            return;
        }
        this._updateMatrix();
        this._shader.filter = drawContext && drawContext.sceneFilter;
        const targetFBO = drawContext && drawContext.renderTarget && drawContext.renderTarget.fbo;
        this.renderer.render(this._shader, this._uniforms, this.helperScene, targetFBO);
    }

    _getMeshes() {
        let meshes = [];
        const meshMap = this.TransformHelper.getMeshes(this._mode);
        for (const p in meshMap) {
            if (p === 'translate') {
                continue;
            }
            const meshList = meshMap[p];
            for (let i = 0; i < meshList.length; i++) {
                meshes = meshes.concat(meshList[i]);
            }
        }
        //为避免z轴被其他mesh覆盖，最后绘制z轴的mesh
        const translateMeshes = meshMap['translate'];
        for (let i = 0; i < translateMeshes.length; i++) {
            meshes = meshes.concat(translateMeshes[i]);
        }
        return meshes;
    }

    _isAvailable() {
        const renderer = this.layerRenderer;
        const layer = renderer && renderer.layer;
        return renderer && this._target && layer && layer.isVisible() && this._target.isVisible() && this.regl && this._enabled;
    }
}

TransformControl.mergeOptions(options);
