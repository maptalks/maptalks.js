import * as reshader from '@maptalks/reshader.gl';
// import { vec2, mat3 } from 'gl-matrix';
import * as maptalks from 'maptalks';

const RESOLUTION = [];
const TEMP_COORD = new maptalks.Coordinate(0, 0);
let EMPTY_MAT3_MAP = {};
class ScanEffectPainter {
    constructor(regl, layer) {
        this._regl = regl;
        this._layer = layer;
        this._init();
    }

    _init() {
        this.renderer = new reshader.Renderer(this._regl);
        const layerRenderer = this._layer.getRenderer();
        const viewport = this._viewport = {
            x : 0,
            y : 0,
            width : () => {
                return layerRenderer.canvas ? layerRenderer.canvas.width : 1;
            },
            height : () => {
                return layerRenderer.canvas ? layerRenderer.canvas.height : 1;
            }
        };
        this._width = viewport.width, this._height = viewport.height;
        this._fbo = this._regl.framebuffer({
            color: this._regl.texture({
                width: layerRenderer.canvas ? layerRenderer.canvas.width : 1,
                height: layerRenderer.canvas ? layerRenderer.canvas.height : 1,
                wrap: 'clamp',
                mag : 'linear',
                min : 'linear'
            }),
            depth: true
        });
        this.EMPTY_TEXTURE = this._regl.texture({ with: 2, height: 2 });
        this._shader = new reshader.ScanEffectShader();
        this._pass = new reshader.ScanEffectPass(this._regl, viewport, this._layer);
        this._shader.version = 300;
    }

    getMap() {
        return this._layer && this._layer.getMap();
    }

    paint(tex, meshes) {
        if (!meshes || !meshes.length) {
            return tex;
        }
        const map = this._layer.getMap();
        this._resize();
        const config = this._layer.getScanEffectConfig();
        const uniforms = {};
        const { effects } = config;
        const glRes = map.getGLRes();
        const effectInfos = [];
        if (this._effectLength !== effects.length) { //减少临时数组的生成
            EMPTY_MAT3_MAP = {};
        }
        for (let i = 0; i < effects.length; i++) {
            const { center, radius, speed, color, direction, height } = effects[i];
            const coord = toCoordinate(center);
            const effectCenter = map.coordinateToPointAtRes(coord, glRes, TEMP_COORD).toArray();
            const effectRadius = map.distanceToPointAtRes(radius, 0, glRes).x;
            const dir = direction === 'vertical' ? 1 : 0;
            const h = map.altitudeToPoint(height || 0, glRes);
            EMPTY_MAT3_MAP[i] = EMPTY_MAT3_MAP[i] || [];
            const effectInfo = reshader.mat3.set(EMPTY_MAT3_MAP[i], effectCenter[0], effectCenter[1], effectRadius, speed, color[0], color[1], color[2], dir, h);
            effectInfos.push(effectInfo);
        }
        const options = {
            projMatrix: map.projMatrix,
            viewMatrix: map.viewMatrix,
            effectInfos,
            effectTime: this._getTimeSpan() / 1000
        };
        const layerRenderer = this._layer.getRenderer();
        const fbo = this._pass.render(meshes, options) || this.EMPTY_TEXTURE;
        uniforms['scanEffectMap'] = layerRenderer._getFBOColor(fbo);
        uniforms['sceneMap'] = tex;
        uniforms['resolution'] = reshader.vec2.set(RESOLUTION, this._fbo.width, this._fbo.height);
        this.renderer.render(this._shader, uniforms, null, this._fbo);
        return this._fbo;
    }

    _getTimeSpan() {
        if (!this._layer) {
            return 0;
        }
        if (this._currentFrameTime === undefined) {
            this._currentFrameTime = 0;
        }
        if (this.isPlaying()) {
            const render = this._layer.getRenderer();
            this._currentFrameTime = render.getFrameTime();
        }
        return  this._currentFrameTime;
    }

    isPlaying() {
        const config = this._layer.getScanEffectConfig();
        if (config) {
            if (config.playing === false) {//明确指定暂停扫描动画
                return false;
            }
            return true;
        }
        return false;
    }

    _resize() {
        const width = this._width(), height =this._height();
        if (this._fbo && (this._fbo.width !== width || this._fbo.height !== height)) {
            this._fbo.resize(width, height);
        }
    }

    dispose() {
        if (this._fbo) {
            this._fbo.destroy();
        }
        if (this._shader) {
            this._shader.dispose();
            delete this._shader;
        }
        if (this._pass) {
            this._pass.dispose();
        }
    }
}

function toCoordinate(center) {
    if (Array.isArray(center)) {
        TEMP_COORD.x = center[0];
        TEMP_COORD.y = center[1];
        return TEMP_COORD;
    }
    return center;
}

export default ScanEffectPainter;
