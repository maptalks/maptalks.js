import * as reshader from '@maptalks/reshader.gl';
import { mat3, vec3 } from '@maptalks/reshader.gl';
import { isNumber } from './util/util.js';

const { createIBLTextures, disposeIBLTextures } = reshader.pbr.PBRUtils;

const EMPTY_HSV = [0, 0, 0];
const HSV = [];
const OUTSIZE = [];

class EnvironmentPainter {
    constructor(regl, layer) {
        this._maxLevel = 4;
        this._regl = regl;
        this.renderer = new reshader.Renderer(regl);
        this._layer = layer;
        this._init();
        this._updateMode();
    }

    paint(context) {
        if (!this.isEnable() || !this._resource) {
            return;
        }
        const uniforms = this._getUniformValues(context);
        const fbo = context && context.renderTarget && context.renderTarget.fbo;
        this.renderer.render(this._shader, uniforms, null, fbo);
    }

    update() {
        const map = this.getMap();
        if (!map || !this.isEnable()) {
            return;
        }
        const lightManager = map.getLightManager();
        const resource = lightManager && lightManager.getAmbientResource();
        if (resource !== this._resource && this._iblTexes) {
            disposeIBLTextures(this._iblTexes);
            delete this._iblTexes;
        }
        this._resource = resource;
        this._updateMode();
    }

    dispose() {
        this._shader.dispose();
        disposeIBLTextures(this._iblTexes);
        delete this._shader;
        delete this._iblTexes;
        delete this._resource;
    }

    getMap() {
        return this._layer.getMap();
    }

    _updateMode() {
        if (!this._resource) {
            return;
        }
        const sceneConfig = this._layer._getSceneConfig();
        const environment = sceneConfig.environment || {};
        this._shader.setMode(environment.toneMapping, environment.mode ? 1 : 0);
    }

    isEnable() {
        const sceneConfig = this._layer._getSceneConfig();
        return this._hasIBL() && sceneConfig && sceneConfig.environment && sceneConfig.environment.enable;
    }

    _hasIBL() {
        const lightManager = this.getMap().getLightManager();
        const resource = lightManager && lightManager.getAmbientResource();
        return !!resource;
    }

    _getUniformValues() {
        const map = this.getMap();
        const lightManager = this.getMap().getLightManager();
        const ambient = lightManager && lightManager.getAmbientLight();
        let iblTexes = this._iblTexes;
        if (!iblTexes) {
            iblTexes = this._iblTexes = createIBLTextures(this._regl, map);
            // const lightManager = this.getMap().getLightManager();
            // const resource = lightManager.getAmbientResource();
            //     this._iblTexes.prefilterMap = this._regl.cube({
            //     width: resource.prefilterMap.width,
            //     height: resource.prefilterMap.height,
            //     faces: resource.prefilterMap.faces,
            //     min : 'linear mipmap linear',
            //     mag : 'linear',
            //     format: 'rgba',
            //     // mipmap: true
            // })
        }
        const canvas = this._layer.getRenderer().canvas;
        const envConfig = this._layer._getSceneConfig().environment || {};
        const level = envConfig.level || 0;
        const cubeSize = iblTexes.prefilterMap.width;
        const transform = this._transform = this._transform || [];
        const hsv = ambient && ambient.hsv || EMPTY_HSV;
        const brightness = envConfig.brightness || 0;
        const intensity = envConfig.intensity || 1;
        vec3.copy(HSV, hsv);
        if (brightness) {
            HSV[2] += brightness;
        }
        OUTSIZE[0] = canvas.width;
        OUTSIZE[1] = canvas.height;
        return {
            'cubeMap': iblTexes.prefilterMap,
            'bias': level,
            'size': cubeSize / Math.pow(2, Math.max(0, level - 1)),
            'environmentExposure': isNumber(ambient && ambient.exposure) ? ambient.exposure : 1,
            'backgroundIntensity': intensity,
            'diffuseSPH': iblTexes.sh,
            'viewMatrix': map.viewMatrix,
            'projMatrix': map.projMatrix,
            'resolution': OUTSIZE,
            'hsv': HSV,
            'transformMatrix': mat3.fromRotation(transform, ambient && Math.PI / 180 * -ambient.orientation || 0)
        };
    }

    _init() {
        const map = this.getMap();
        map.on('updatelights', this.update, this);
        this._shader = new reshader.SkyboxShader();
        if (map.options.lights) {
            const lightManager = this.getMap().getLightManager();
            const resource = lightManager.getAmbientResource();
            this._resource = resource;
        }
    }
}

export default EnvironmentPainter;
