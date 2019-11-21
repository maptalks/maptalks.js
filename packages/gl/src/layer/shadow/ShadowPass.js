import { mat4, vec3 } from 'gl-matrix';
import * as reshader from '@maptalks/reshader.gl';
// import { isNil } from '../../Util';


const COORD_THRESHOLD = 100;

class ShadowPass {
    constructor(regl, sceneConfig, layer) {
        this.renderer = new reshader.Renderer(regl);
        this.sceneConfig = sceneConfig;
        this._esmShadowThreshold = 0.3;
        this._layer = layer;
        this._init();
    }

    resize() {
        const canvas = this.canvas;
        canvas.width = this._layer.getRenderer().canvas.width;
        canvas.height = this._layer.getRenderer().canvas.height;
    }

    _init() {
        const canvas = this._layer.getRenderer().canvas;
        const viewport = {
            x: 0,
            y: 0,
            width: () => {
                return canvas ? canvas.width : 1;
            },
            height: () => {
                return canvas ? canvas.height : 1;
            }
        };

        const shadowConfig = this.sceneConfig.shadow;
        let shadowRes = 512;
        const quality = shadowConfig.quality;
        if (quality === 'high') {
            shadowRes = 2048;
        } else if (quality === 'medium') {
            shadowRes = 1024;
        }
        const defines = this.getDefines();
        this._shadowPass = new reshader.ShadowPass(this.renderer, { width: shadowRes, height: shadowRes, blurOffset: shadowConfig.blurOffset, defines });
        this._shadowDisplayShader = new reshader.ShadowDisplayShader(viewport, defines);

        this._createGround();
    }

    getUniformDeclares() {
        const uniforms = [];
        uniforms.push({
            name: 'shadow_lightProjViewModelMatrix',
            type: 'function',
            fn: function (context, props) {
                const lightProjViews = props['shadow_lightProjViewMatrix'];
                const model = props['modelMatrix'];
                return  mat4.multiply([], lightProjViews, model);
            }
        });
        uniforms.push('shadow_shadowMap', 'shadow_opacity', 'esm_shadow_threshold');
        return uniforms;
    }

    getDefines() {
        const defines = {
            'HAS_SHADOWING': 1,
            'PACK_FLOAT': 1
        };
        const type = this.sceneConfig.shadow.type;
        if (type === undefined || type === 'esm') {
            //默认的阴影类型
            defines['USE_ESM'] = 1;
        } else if (type === 'vsm') {
            defines['USE_VSM'] = 1;
        }
        return defines;
    }

    render(projMatrix, viewMatrix, lightDirection, scene, halton, framebuffer) {
        this._transformGround();
        const map = this._layer.getMap();
        const shadowConfig = this.sceneConfig.shadow;
        const changed = this._shadowChanged(map, scene, lightDirection);
        let matrix, smap;
        if (changed) {
            const cameraProjViewMatrix = mat4.multiply([], projMatrix, viewMatrix);
            const lightDir = vec3.normalize([], lightDirection);
            const extent = map['_get2DExtent'](map.getGLZoom());
            const arr = extent.toArray();
            scene.addMesh(this._ground);
            const { lightProjViewMatrix, shadowMap, /* depthFBO, */ blurFBO } = this._shadowPass.render(
                scene,
                { cameraProjViewMatrix, lightDir, farPlane: arr.map(c => [c.x, c.y, 0, 1]) }
            );
            matrix = this._lightProjViewMatrix = lightProjViewMatrix;
            smap = this._shadowMap = shadowMap;
            this._blurFBO = blurFBO;
            this._renderedShadows = scene.getMeshes().reduce((ids, m) => {
                ids[m.properties.meshKey] = 1;
                return ids;
            }, {});
            this._renderedView = {
                zoom: map.getZoom(),
                center: map.getCenter(),
                bearing: map.getBearing(),
                pitch: map.getPitch(),
                lightDirection: vec3.copy([], lightDirection)
            };
        } else {
            matrix = this._lightProjViewMatrix;
            smap = this._shadowMap;
            // fbo = this._blurFBO;
        }
        this._projMatrix = projMatrix;
        this._viewMatrix = viewMatrix;
        if (scene.getMeshes().length) {
            this.displayShadow(halton, framebuffer);
        }
        const uniforms = {
            'shadow_lightProjViewMatrix': matrix,
            'shadow_shadowMap': smap,
            'shadow_opacity': shadowConfig.opacity,
            'esm_shadow_threshold': this._esmShadowThreshold
        };

        return uniforms;
    }

    displayShadow(halton, framebuffer) {
        const matrix = this._lightProjViewMatrix;
        const shadowConfig = this.sceneConfig.shadow;
        const ground = this._ground;
        const groundLightProjViewModelMatrix = this._groundLightProjViewModelMatrix || [];
        const canvas = this._layer.getRenderer().canvas;
        //display ground shadows
        this.renderer.render(this._shadowDisplayShader, {
            'halton': halton || [0, 0],
            'globalTexSize': [canvas.width, canvas.height],
            'modelMatrix': ground.localTransform,
            'projMatrix': this._projMatrix,
            'viewMatrix': this._viewMatrix,
            'shadow_lightProjViewModelMatrix': mat4.multiply(groundLightProjViewModelMatrix, matrix, ground.localTransform),
            'shadow_shadowMap': this._shadowMap,
            'esm_shadow_threshold': this._esmShadowThreshold,
            'shadow_opacity': shadowConfig.opacity,
            'color': shadowConfig.color || [0, 0, 0],
            'opacity': !shadowConfig.opacity && shadowConfig.opacity !== 0 ? 1 : shadowConfig.opacity
        }, this._groundScene, framebuffer);
    }

    delete() {
        this._shadowPass.dispose();
        this._shadowDisplayShader.dispose();
        // if (this._shadowMap) {
        // //已经在shadowPass中destroy了
        //     this._shadowMap.destroy();
        // }
        // if (this._blurFBO) {
        //     this._blurFBO.destroy();
        // }
        if (this._ground) {
            this._ground.dispose();
        }
        delete this.renderer;
    }

    _shadowChanged(map, scene, lightDirection) {
        // if (this._rendered || !this._rendered && scene.getMeshes().length > 5) {
        //     this._rendered = true;
        //     return false;
        // }
        if (!this._renderedShadows) {
            return true;
        }
        const renderedView = this._renderedView;
        if (!vec3.equals(lightDirection, renderedView.lightDirection)) {
            return true;
        }
        if (!map.isInteracting() && map.getZoom() !== renderedView.zoom) {
            return true;
        }
        const meshes = scene.getMeshes();
        let changed = false;
        for (let i = 0; i < meshes.length; i++) {
            if (!this._renderedShadows[meshes[i].properties.meshKey]) {
                return true;
            }
        }
        const cp = map.coordToContainerPoint(this._renderedView.center);
        changed = (cp._sub(map.width / 2, map.height / 2).mag() > COORD_THRESHOLD) ||
            Math.abs(renderedView.bearing - map.getBearing()) > 30 ||
            Math.abs(renderedView.pitch - map.getPitch()) > 15;
        return changed;
    }

    _createGround() {
        const planeGeo = new reshader.Plane();
        planeGeo.generateBuffers(this.renderer.regl);
        this._ground = new reshader.Mesh(planeGeo);
        this._groundScene = new reshader.Scene([this._ground]);
    }

    _transformGround() {
        //改为inifinite plane
        const SCALE = this._SCALE || [];
        const layer = this._layer;
        const map = layer.getMap();
        const extent = map['_get2DExtent'](map.getGLZoom());
        const scaleX = extent.getWidth() * 32, scaleY = extent.getHeight() * 32;
        const localTransform = this._ground.localTransform;
        mat4.identity(localTransform);
        mat4.translate(localTransform, localTransform, map.cameraLookAt);
        mat4.scale(localTransform, localTransform, vec3.set(SCALE, scaleX, scaleY, 1));
        this._ground.setLocalTransform(localTransform);
    }
}

export default ShadowPass;
