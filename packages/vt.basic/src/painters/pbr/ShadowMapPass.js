import { reshader, mat4, vec3 } from '@maptalks/gl';
import { isNil } from '../../Util';

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
        this.shadowShader = new reshader.ShadowDisplayShader(this._viewport, this.getDefines());
    }

    getUniforms() {
        const uniforms = [];
        uniforms.push({
            name: 'vsm_shadow_lightProjViewModelMatrix',
            type: 'function',
            fn: function (context, props) {
                const lightProjViews = props['vsm_shadow_lightProjViewMatrix'];
                const model = props['modelMatrix'];
                return  mat4.multiply([], lightProjViews, model);
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
        } else if (type === 'vsm') {
            defines['USE_VSM'] = 1;
        } else if (type === 'vsm_esm') {
            defines['USE_VSM_ESM'] = 1;
        }
        return defines;
    }

    pass1({
        layer, uniforms, scene, groundScene
    }) {
        const shadowConfig = this.sceneConfig.shadow;
        const map = layer.getMap();
        const cameraProjViewMatrix = mat4.multiply([], uniforms.projMatrix, uniforms.viewMatrix);
        const lightDir = vec3.normalize([], uniforms['lightDirection']);
        const extent = map['_get2DExtent'](map.getGLZoom());
        const arr = extent.toArray();
        const { lightProjViewMatrix, shadowMap, /* depthFBO, */ blurFBO } = this.shadowPass.render(
            scene,
            { cameraProjViewMatrix, lightDir, farPlane: arr.map(c => [c.x, c.y, 0, 1]) }
        );

        uniforms['vsm_shadow_lightProjViewMatrix'] = lightProjViewMatrix;
        uniforms['vsm_shadow_shadowMap'] = shadowMap;
        uniforms['vsm_shadow_opacity'] = shadowConfig.opacity;
        uniforms['vsm_shadow_threshold'] = this._vsmShadowThreshold;

        const ground = groundScene.meshes[0];
        //display ground shadows
        this.renderer.render(this.shadowShader, {
            'modelMatrix': ground.localTransform,
            'projMatrix': uniforms.projMatrix,
            'viewMatrix': uniforms.viewMatrix,
            'vsm_shadow_lightProjViewModelMatrix': mat4.multiply([], lightProjViewMatrix, ground.localTransform),
            'vsm_shadow_shadowMap': shadowMap,
            'vsm_shadow_threshold': this._vsmShadowThreshold,
            'vsm_shadow_opacity': shadowConfig.opacity,
            'color': shadowConfig.color || [0, 0, 0],
            'opacity': isNil(shadowConfig.opacity) ? 1 : shadowConfig.opacity
        }, groundScene);

        return {
            fbo: blurFBO
        };
    }

    pass2() {

    }

    delete() {
        this.shadowPass.dispose();
        this.shadowShader.dispose();
        delete this.renderer;
    }
}

export default VSMShadowPass;
