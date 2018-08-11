import { reshader, mat4, vec3 } from '@maptalks/gl';
import { isNil } from './Util';

class VSMShadowPass {
    constructor(sceneConfig, renderer) {
        this.renderer = renderer;
        this.sceneConfig = sceneConfig;
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
        this.shadowPass = new reshader.ShadowPass(this.renderer, { width : shadowRes, height : shadowRes, blurOffset : this.sceneConfig.shadow.blurOffset });
        this.shadowShader = new reshader.ShadowDisplayShader(this.sceneConfig.lights.dirLights.length);
    }

    getUniforms(numOfDirLights) {
        const uniforms = [];
        uniforms.push({
            name : `vsm_shadow_lightProjViewModel[${numOfDirLights}]`,
            type : 'function',
            fn : function (context, props) {
                const lightProjViews = props['vsm_shadow_lightProjView'];
                const model = props['model'];
                return lightProjViews.map(mat => mat4.multiply([], mat, model));
            }
        });
        uniforms.push(`vsm_shadow_shadowMap[${numOfDirLights}]`);
        return uniforms;
    }

    getDefines() {
        return {
            'USE_SHADOW_MAP' : 1
        };
    }

    pass1({
        layer, uniforms, scene, groundScene
    }) {
        const shadowConfig = this.sceneConfig.shadow;
        const map = layer.getMap();
        const cameraProjView = mat4.multiply([], uniforms.projection, uniforms.view);
        const lightDir = vec3.normalize([], uniforms['dirLightDirections'][0]);
        const extent = map._get2DExtent(map.getGLZoom());
        const arr = extent.toArray();
        const { lightProjView, shadowMap, /* depthFBO, */ blurFBO } = this.shadowPass.render(
            scene,
            { cameraProjView, lightDir, farPlane : arr.map(c => [c.x, c.y, 0, 1]) }
        );

        uniforms['vsm_shadow_lightProjView'] = [lightProjView];
        uniforms['vsm_shadow_shadowMap'] = [shadowMap];

        const ground = groundScene.meshes[0];
        //display ground shadows
        this.renderer.render(this.shadowShader, {
            'model' : ground.localTransform,
            'projection' : uniforms.projection,
            'view' : uniforms.view,
            'vsm_shadow_lightProjViewModel' : [mat4.multiply([], lightProjView, ground.localTransform)],
            'vsm_shadow_shadowMap' : [shadowMap],
            'color' : shadowConfig.color || [0, 0, 0],
            'opacity' : isNil(shadowConfig.opacity) ? 1 : shadowConfig.opacity
        }, groundScene);

        return {
            fbo : blurFBO
        };
    }

    pass2() {

    }

    remove() {
        this.shadowPass.dispose();
        this.shadowShader.dispose();
        delete this.renderer;
    }
}

export default VSMShadowPass;
