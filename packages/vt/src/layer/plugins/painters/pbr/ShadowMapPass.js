import { reshader, mat4, vec3 } from '@maptalks/gl';
import { isNil } from '../../Util';
import { MapStateCache } from 'maptalks';


const COORD_THRESHOLD = 100;

class VSMShadowPass {
    constructor(sceneConfig, renderer, viewport) {
        this.renderer = renderer;
        this.sceneConfig = sceneConfig;
        this._vsmShadowThreshold = 0.5;
        this._viewport = viewport;
        this._init();
    }

    _init() {
        let shadowRes = 512;
        const quality = this.sceneConfig.shadow.quality;
        if (quality === 'high') {
            shadowRes = 2048;
        } else if (quality === 'medium') {
            shadowRes = 1024;
        }
        this.shadowPass = new reshader.ShadowPass(this.renderer, { width: shadowRes, height: shadowRes, blurOffset: this.sceneConfig.shadow.blurOffset });
        this.shadowShader = new reshader.ShadowDisplayShader(this.getDefines());
    }

    getUniforms() {
        const uniforms = [];
        uniforms.push({
            name: 'vsm_shadow_lightProjViewModelMatrix',
            type: 'function',
            fn: function (context, props) {
                const lightProjViews = props['vsm_shadow_lightProjViewMatrix'];
                const model = props['modelMatrix'];
                return mat4.multiply([], lightProjViews, model);
            }
        });
        uniforms.push('vsm_shadow_shadowMap', 'vsm_shadow_opacity', 'vsm_shadow_threshold');
        return uniforms;
    }

    getDefines() {
        const defines = {
            'USE_SHADOW_MAP': 1
        };
        const type = this.sceneConfig.shadow.type;
        if (type === undefined || type === 'esm') {
            //默认的阴影类型
            defines['USE_ESM'] = 1;
        }
        return defines;
    }

    pass1({
        layer, uniforms, scene, groundScene
    }) {
        const shadowConfig = this.sceneConfig.shadow;
        const changed = this._shadowChanged(layer, scene);
        let matrix, smap, fbo;
        if (changed) {
            const map = layer.getMap();
            const cameraProjViewMatrix = mat4.multiply([], uniforms.projMatrix, uniforms.viewMatrix);
            const lightDir = vec3.normalize([], uniforms['lightDirection']);
            const extent = map['_get2DExtentAtRes'](map.getGLRes());
            const arr = extent.toArray();
            const { lightProjViewMatrix, shadowMap, /* depthFBO, */ blurFBO } = this.shadowPass.render(
                scene,
                { cameraProjViewMatrix, lightDir, farPlane: arr.map(c => [c.x, c.y, 0, 1]) }
            );
            matrix = this._lightProjViewMatrix = lightProjViewMatrix;
            smap = this._shadowMap = shadowMap;
            fbo = this._blurFBO = blurFBO;
            this._renderedShadows = scene.getMeshes().reduce((ids, m) => {
                ids[m.properties.meshKey] = 1;
                return ids;
            }, {});
            const cache = MapStateCache[map.id];
            const pitch = cache ? cache.pitch : map.getPitch();
            const bearing = cache ? cache.bearing : map.getBearing();
            const center = cache ? cache.center : map.getCenter();
            this._renderedView = {
                center,
                bearing,
                pitch
            };
        } else {
            matrix = this._lightProjViewMatrix;
            smap = this._shadowMap;
            fbo = this._blurFBO;
        }

        uniforms['vsm_shadow_lightProjViewMatrix'] = matrix;
        uniforms['vsm_shadow_shadowMap'] = smap;
        uniforms['vsm_shadow_opacity'] = shadowConfig.opacity;
        uniforms['vsm_shadow_threshold'] = this._vsmShadowThreshold;

        const ground = groundScene.meshes[0];
        //display ground shadows
        this.renderer.render(this.shadowShader, {
            'modelMatrix': ground.localTransform,
            'projMatrix': uniforms.projMatrix,
            'viewMatrix': uniforms.viewMatrix,
            'vsm_shadow_lightProjViewModelMatrix': mat4.multiply([], matrix, ground.localTransform),
            'vsm_shadow_shadowMap': smap,
            'vsm_shadow_threshold': this._vsmShadowThreshold,
            'vsm_shadow_opacity': shadowConfig.opacity,
            'color': shadowConfig.color || [0, 0, 0],
            'opacity': isNil(shadowConfig.opacity) ? 1 : shadowConfig.opacity
        }, groundScene);

        return {
            fbo: fbo
        };
    }

    pass2() {

    }

    delete() {
        this.shadowPass.dispose();
        this.shadowShader.dispose();
        delete this.renderer;
    }

    _shadowChanged(layer, scene) {
        if (!this._renderedShadows) {
            return true;
        }
        const meshes = scene.getMeshes();
        let changed = false;
        for (let i = 0; i < meshes.length; i++) {
            if (!this._renderedShadows[meshes[i].properties.meshKey]) {
                return true;
            }
        }
        const map = layer.getMap();
        const cp = map.coordToContainerPoint(this._renderedView.center);
        const cache = MapStateCache[map.id];
        const pitch = cache ? cache.pitch : map.getPitch();
        const bearing = cache ? cache.bearing : map.getBearing();
        changed = (cp._sub(map.width / 2, map.height / 2).mag() > COORD_THRESHOLD) ||
            Math.abs(this._renderedView.bearing - bearing) > 30 ||
            Math.abs(this._renderedView.pitch - pitch) > 15;
        return changed;
    }
}

export default VSMShadowPass;
