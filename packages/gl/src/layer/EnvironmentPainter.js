import * as reshader from '@maptalks/reshader.gl';

const { createIBLTextures, disposeIBLTextures } = reshader.pbr.PBRUtils;

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
        const lightManager = this.getMap().getLightManager();
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
        this._shader.setMode(1, 0, sceneConfig.environment && sceneConfig.environment.mode ? 1 : 0);
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
        const ambient = this.getMap().getLightManager().getAmbientLight();
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
        const level = this._layer._getSceneConfig().environment.level || 0;
        const cubeSize = iblTexes.prefilterMap.width;
        return {
            'rgbmRange': iblTexes.rgbmRange,
            'cubeMap': iblTexes.prefilterMap,
            'bias': level,
            'size': cubeSize / Math.pow(2, Math.max(0, level - 1)),
            'environmentExposure': iblTexes.exposure,
            'diffuseSPH': iblTexes.sh,
            'viewMatrix': map.viewMatrix,
            'projMatrix': map.projMatrix,
            'resolution': [canvas.width, canvas.height],
            'hsv': ambient && ambient.hsv || [0, 0, 0]
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
