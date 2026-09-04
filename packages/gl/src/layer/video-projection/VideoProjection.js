import { Class, Eventable, Handlerable } from 'maptalks';
import { mat3, mat4 } from 'gl-matrix';
import computeQuadHomographyElements from './computeQuadHomography';
import { coordinateToWorld, getTargetWorldPosition } from './util';

const DEFAULT_OPTIONS = {
    projCamPosition: [0, 0, 0],
    projCamParams: { fov: 30, aspect: 1, near: 0.1, far: 100 },
    orientationParams: { azimuthDeg: 0, elevationDeg: 0, rollDeg: 0 },
    source: null,
    intensity: 1.0,
    opacity: 1.0,
    projBias: 0.001,
    edgeFeather: 0.05,
    cropRect: [0, 0, 1, 1],
    quadCorners: [[0, 0], [1, 0], [1, 1], [0, 1]],
    depthSize: 2048,
    // 是否显示投影视锥体线框
    showFrustum: false,
    // 视锥体线框颜色（RGBA，0-1）
    frustumColor: [1, 0, 0, 1],
    // 视锥体线框宽度（像素）
    frustumLineWidth: 1
};

const UP = [0, 0, 1];

/**
 * 视频投影器（投影相机）
 */
class VideoProjection extends Eventable(Handlerable(Class)) {

    constructor(options) {
        super(options);
        this.options = Object.assign({}, DEFAULT_OPTIONS, options);
        this._enable = true;
        this._texture = null;
        this._updateHomography();
    }

    addTo(layer) {
        const map = layer.getMap();
        if (map) {
            this.layer = layer;
            layer.addVideoProjection(this);
            this._ensureGroundDefaults(layer);
        } else {
            layer.once('add', () => {
                this.addTo(layer);
            }, this);
        }
        return this;
    }

    /**
     * 视频投影依赖 GroupGLLayer 的 ground 平面接收/遮挡投影。
     * GroundPainter 假定 groundConfig 一定包含 symbol 与 renderPlugin；
     * 若用户只配置了 ground.enable 而未提供这两项，会触发空值错误。
     * 这里在 video 侧补全默认属性（symbol: {} / renderPlugin: { type: 'fill' }），
     * 与 GroundPainter 无 symbol 时用默认 fill 填充的行为一致，避免侵入 GroundPainter。
     */
    _ensureGroundDefaults(layer) {
        if (!layer || !layer.getGroundConfig) {
            return;
        }
        const ground = layer.getGroundConfig();
        if (!ground || !ground.enable) {
            return;
        }
        if (!ground.symbol) {
            ground.symbol = {};
        }
        if (!ground.renderPlugin) {
            ground.renderPlugin = { type: 'fill' };
        }
    }

    enable() {
        this._enable = true;
        this._redraw();
    }

    disable() {
        this._enable = false;
        this._redraw();
    }

    isEnable() {
        return this._enable;
    }

    isAnimating() {
        return this._enable && !!this.options.source && this.options.source instanceof HTMLVideoElement;
    }

    remove() {
        if (this.layer) {
            const layer = this.layer;
            delete this.layer;
            layer.removeVideoProjection(this);
            this.dispose();
        }
    }

    dispose() {
        if (this._texture) {
            this._texture.destroy && this._texture.destroy();
            this._texture = null;
        }
    }

    update(name, value) {
        this.options[name] = value;
        if (name === 'quadCorners' || name === 'cropRect') {
            this._updateHomography();
        }
        this._redraw();
    }

    /**
     * 设置投影相机位置（经纬度 + 高度，单位：米）并重新绘制
     * 支持传入数组 [lon, lat, height] 或三个参数 lon, lat, height
     */
    setCameraPosition(lon, lat, height) {
        if (Array.isArray(lon)) {
            height = lon[2];
            lat = lon[1];
            lon = lon[0];
        }
        if (!isFinite(lon) || !isFinite(lat) || !isFinite(height)) {
            throw new Error('invalid camera position');
        }
        this.update('projCamPosition', [lon, lat, height]);
        return this;
    }

    _redraw() {
        const layer = this.layer;
        if (layer) {
            const renderer = layer.getRenderer();
            if (renderer) {
                renderer.setToRedraw();
            }
        }
    }

    getCameraPosition() {
        return this.options.projCamPosition;
    }

    getCameraParams() {
        const params = this.options.projCamParams || {};
        let aspect = params.aspect == null ? 1 : params.aspect;
        const source = this.options.source;
        if (aspect == null || aspect === 1) {
            const sourceWidth = source && (source.videoWidth || source.width);
            const sourceHeight = source && (source.videoHeight || source.height);
            if (sourceWidth && sourceHeight && sourceWidth !== sourceHeight) {
                aspect = sourceWidth / sourceHeight;
            }
        }
        return {
            fov: params.fov == null ? 30 : params.fov,
            aspect,
            near: params.near == null ? 0.1 : params.near,
            far: params.far == null ? 100 : params.far
        };
    }

    getOrientation() {
        const o = this.options.orientationParams || {};
        return {
            azimuthDeg: o.azimuthDeg == null ? 0 : o.azimuthDeg,
            elevationDeg: o.elevationDeg == null ? 0 : o.elevationDeg,
            rollDeg: o.rollDeg == null ? 0 : o.rollDeg
        };
    }

    /**
     * 投影相机世界坐标位置
     */
    getCameraWorldPosition(map) {
        const pos = this.getCameraPosition();
        return coordinateToWorld(map, pos[0], pos[1], pos[2]);
    }

    /**
     * 投影相机朝向的目标点世界坐标（方位角/俯仰角/距离=far 解算）
     */
    getTargetWorldPosition(map) {
        const pos = this.getCameraPosition();
        const o = this.getOrientation();
        const params = this.getCameraParams();
        return getTargetWorldPosition(map, pos, o.azimuthDeg, o.elevationDeg, params.far);
    }

    /**
     * 投影相机 view 矩阵（世界坐标 -> 投影相机空间），含 roll 旋转
     * @param {boolean} [skipRoll=false] 为 true 时返回不含 roll 的 lookAt 矩阵
     */
    getViewMatrix(map, skipRoll) {
        const o = this.getOrientation();
        const eye = this.getCameraWorldPosition(map);
        const target = this.getTargetWorldPosition(map);
        const viewMatrix = mat4.lookAt(mat4.create(), eye, target, UP);
        // 沿视线方向（相机空间 z 轴）旋转，实现 roll
        const rollRad = o.rollDeg * Math.PI / 180;
        if (!skipRoll && rollRad !== 0) {
            mat4.multiply(viewMatrix, mat4.fromZRotation(mat4.create(), rollRad), viewMatrix);
        }
        return viewMatrix;
    }

    /**
     * 投影相机投影矩阵（透视）
     */
    getProjMatrix() {
        const params = this.getCameraParams();
        const fovRad = params.fov * Math.PI / 180;
        return mat4.perspective(mat4.create(), fovRad, params.aspect, params.near, params.far);
    }

    /**
     * 投影相机的 projView 矩阵（用于深度渲染）
     */
    getProjViewMatrix(map) {
        const viewMatrix = this.getViewMatrix(map);
        const projMatrix = this.getProjMatrix();
        return mat4.multiply(mat4.create(), projMatrix, viewMatrix);
    }

    /**
     * 全屏合成矩阵：主相机 NDC -> 投影相机 NDC
     * = P_proj * V_proj * inv(V_cam) * inv(P_cam)
     */
    getProjectorClipMatrix(map) {
        const viewMatrix = this.getViewMatrix(map);
        const projMatrix = this.getProjMatrix();
        const invViewMatrix = mat4.invert(mat4.create(), map.viewMatrix);
        const invProjMatrix = mat4.invert(mat4.create(), map.projMatrix);
        const m1 = mat4.multiply(mat4.create(), viewMatrix, invViewMatrix);
        const m2 = mat4.multiply(mat4.create(), projMatrix, m1);
        return mat4.multiply(mat4.create(), m2, invProjMatrix);
    }

    /**
     * 投影相机视锥体 12 条棱的端点（世界坐标），按 LINES 展开为 24 个顶点
     * 采用米制近/远距离：投影合成只按 UV 判定覆盖区，视锥方向（fov 锥）与地面
     * 的交线即视频投影足迹，因此用米制视锥才能得到与实际投影区域一致的线框。
     * @returns {number[]} [x0,y0,z0, x1,y1,z1, ...]
     */
    getFrustumWorldVertices(map) {
        const o = this.getOrientation();
        const params = this.getCameraParams();
        const camPos = this.getCameraPosition();
        if (!map || !camPos) {
            return [];
        }
        const eye = this.getCameraWorldPosition(map);
        if (!eye) {
            return [];
        }
        const halfFovV = params.fov * Math.PI / 180 / 2;
        const halfFovH = Math.atan(Math.tan(halfFovV) * params.aspect);
        const rollRad = o.rollDeg * Math.PI / 180;
        const cosRoll = Math.cos(rollRad);
        const sinRoll = Math.sin(rollRad);
        // 相机空间 4 个角方向（沿 -Z 视线），先绕视线做 roll 旋转
        const dirs = [];
        const sx = [-1, 1, 1, -1];
        const sy = [-1, -1, 1, 1];
        for (let i = 0; i < 4; i++) {
            let ax = sx[i] * halfFovH;
            let ay = sy[i] * halfFovV;
            const rx = ax * cosRoll - ay * sinRoll;
            const ry = ax * sinRoll + ay * cosRoll;
            const len = Math.sqrt(rx * rx + ry * ry + 1);
            dirs.push([rx / len, ry / len, -1 / len]);
        }
        // 相机方向 -> 世界方向（viewMatrix 左上 3x3 的转置，即相机->世界旋转）
        // 注意：必须用不含 roll 的 lookAt 矩阵——dirs 已手动应用 roll，
        // 若用含 roll 的矩阵转换，R_roll^T * R_roll = I，roll 会被完全抵消
        const viewMatrix = this.getViewMatrix(map, true);
        const worldDirs = dirs.map(([dx, dy, dz]) => [
            viewMatrix[0] * dx + viewMatrix[1] * dy + viewMatrix[2] * dz,
            viewMatrix[4] * dx + viewMatrix[5] * dy + viewMatrix[6] * dz,
            viewMatrix[8] * dx + viewMatrix[9] * dy + viewMatrix[10] * dz
        ]);
        // 相机 LLA（米）
        const camLatRad = camPos[1] * Math.PI / 180;
        const cosLat = Math.cos(camLatRad);
        const R_EARTH = 6378137;
        // 米制偏移 -> 经纬度/高度（小范围近似），再转 maptalks 世界坐标
        const corners = [];
        const distances = [params.near, params.far];
        for (const dist of distances) {
            for (const wd of worldDirs) {
                const dLat = wd[1] * dist / R_EARTH * 180 / Math.PI;
                const dLon = wd[0] * dist / (R_EARTH * cosLat) * 180 / Math.PI;
                const dAlt = wd[2] * dist;
                const w = coordinateToWorld(map, camPos[0] + dLon, camPos[1] + dLat, camPos[2] + dAlt);
                if (w) {
                    corners.push(w);
                }
            }
        }
        if (corners.length < 8) {
            return [];
        }
        const positions = [];
        const indices = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7];
        for (const idx of indices) {
            const c = corners[idx];
            positions.push(c[0], c[1], c[2]);
        }
        return positions;
    }

    /**
     * 四角透视校正矩阵（投影UV -> 视频UV），列主序 mat3
     */
    getQuadHomography() {
        return this._quadHomography;
    }

    _updateHomography() {
        const elements = computeQuadHomographyElements(this.options.quadCorners);
        // 行主序 -> 列主序（WebGL uniform mat3 为列主序）
        const m = [];
        for (let c = 0; c < 3; c++) {
            for (let r = 0; r < 3; r++) {
                m[c * 3 + r] = elements[r * 3 + c];
            }
        }
        this._quadHomography = mat3.fromValues(m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8]);
    }

    /**
     * 获取（或更新）视频/图片纹理
     */
    getVideoTexture(device) {
        const source = this.options.source;
        if (!source) {
            return null;
        }
        if (!this._texture) {
            this._texture = device.texture({
                width: 2,
                height: 2,
                wrap: 'clamp',
                mag: 'linear',
                min: 'linear'
            });
        }
        if (this._texture.update) {
            this._texture.update({ data: source });
        } else {
            this._texture(source);
        }
        return this._texture;
    }
}

export default VideoProjection;
