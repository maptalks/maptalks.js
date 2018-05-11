import * as reshader from 'reshader.gl';
import { mat4, vec3 } from '@mapbox/gl-matrix';
import { extend, isNil } from './Util';

class PBRScenePainter {
    constructor(regl, sceneConfig) {
        this.regl = regl;
        this.sceneConfig = sceneConfig || {};
        if (!this.sceneConfig.lights) {
            this.sceneConfig.lights = {};
        }
        this._redraw = false;
        this.meshCache = {};
        this.loader = new reshader.ResourceLoader(regl.texture(2));
        this.hdr = null;
        this.loader.on('complete', () => {
            if (this.hdr && this.hdr.isReady() && !this._isIBLRecreated) {
                //环境光纹理载入，重新生成ibl纹理
                this.iblMaps = this._createIBLMaps(this.hdr);
                this._isIBLRecreated = true;
            }
            this._redraw = true;
        });
        this._init();
    }

    needToRedraw() {
        return this._redraw;
    }

    createGeometry(data, indices) {
        const geometry = new reshader.Geometry(data, indices);
        geometry.generateBuffers(this.regl);
        return geometry;
    }

    addMesh(key, geometry) {
        const mesh = new reshader.Mesh(geometry, this.material);
        this.meshCache[key] = mesh;
        this.scene.addMesh(mesh);
        return mesh;
    }

    paint(layer) {
        this._redraw = false;
        const map = layer.getMap();
        if (!map) {
            return {
                redraw : false
            };
        }

        const uniforms = this._getUniformValues(map);

        if (this.shadowPass) {
            this._transformGround(layer);
            const cameraProjView = mat4.multiply([], uniforms.projection, uniforms.view);
            const lightDir = vec3.normalize([], uniforms['dirLightDirections'][0]);
            const extent = map._get2DExtent(map.getGLZoom());
            const arr = extent.toArray();
            const { lightProjView, shadowMap, depthFBO, blurFBO } = this.shadowPass.render(
                this.scene,
                { cameraProjView, lightDir, farPlane : arr.map(c => [c.x, c.y, 0, 1]) }
            );

            if (this.sceneConfig.shadow.debug) {
                // this.debugFBO(this.sceneConfig.shadow.debug[0], depthFBO);
                this.debugFBO(this.sceneConfig.shadow.debug[1], blurFBO);
            }
            uniforms['vsm_shadow_lightProjView'] = [lightProjView];
            uniforms['vsm_shadow_shadowMap'] = [shadowMap];

            //display ground shadows
            this.renderer.render(this.shadowShader, {
                'model' : this.ground.localTransform,
                'projection' : uniforms.projection,
                'view' : uniforms.view,
                'vsm_shadow_lightProjViewModel' : [mat4.multiply([], lightProjView, this.ground.localTransform)],
                'vsm_shadow_shadowMap' : uniforms['vsm_shadow_shadowMap'],
                'color' : this.sceneConfig.shadow.color || [0, 0, 0],
                'opacity' : isNil(this.sceneConfig.shadow.opacity) ? 1 : this.sceneConfig.shadow.opacity
            }, this.groundScene);
        }

        //TODO implement shadow pass
        this.renderer.render(this.shader, uniforms, this.scene);
        return {
            redraw : false
        };
    }

    updateSceneConfig(config) {
        const keys = Object.keys(config);
        if (keys.length === 1 && keys[0] === 'material') {
            this.sceneConfig.material = config.material;
            this._updateMaterial();
        } else {
            extend(this.sceneConfig, config);
            this._init();
            this._redraw = true;
        }
    }

    getMesh(key) {
        return this.meshCache[key];
    }

    delete(key) {
        const mesh = this.meshCache[key];
        if (mesh) {
            const geometry = mesh.geometry;
            geometry.dispose();
            mesh.dispose();
            delete this.meshCache[key];
        }
    }

    clear() {
        this.meshCache = {};
        this.scene.clear();
        this.scene.addMesh(this.ground);
    }

    remove() {
        delete this.meshCache;
        this.material.dispose();
        this.shader.dispose();
        this.ground.geometry.dispose();
        this.ground.dispose();
    }

    _transformGround(layer) {
        const map = layer.getMap();
        console.log(layer.getRenderer()._getMeterScale());
        const extent = map._get2DExtent(map.getGLZoom());
        const scaleX = extent.getWidth() * 2, scaleY = extent.getHeight() * 2;
        const localTransform = this.ground.localTransform;
        mat4.identity(localTransform);
        mat4.translate(localTransform, localTransform, map.cameraLookAt);
        mat4.scale(localTransform, localTransform, [scaleX, scaleY, 1]);
    }

    _init() {
        const regl = this.regl;
        this.shader = new reshader.MeshShader({
            vert : reshader.pbr.StandardVert,
            frag : reshader.pbr.StandardFrag,
            uniforms : this._getUniforms(),
            defines : this._getDefines(),
            extraCommandProps : {
                //enable cullFace
                cull : {
                    enable: true,
                    face: 'back'
                },
                // stencil: {
                //     enable: false,
                //     mask: 0x0,
                //     func: {
                //         cmp: '=',
                //         ref: regl.prop('stencilRef'),
                //         mask: 0xff
                //     }
                // },
                // polygonOffset: {
                //     enable: true,
                //     offset: {
                //         factor: -100,
                //         units: -100
                //     }
                // }
            }
        });

        this.scene = new reshader.Scene();

        const planeGeo = new reshader.Plane();
        planeGeo.generateBuffers(regl);
        this.ground = new reshader.Mesh(planeGeo);
        this.groundScene = new reshader.Scene([this.ground]);

        this.scene.addMesh(this.ground);
        this.shader.filter = mesh => mesh !== this.ground;

        const shadowEnabled = this.sceneConfig.shadow && this.sceneConfig.shadow.enable;

        this.renderer = new reshader.Renderer(regl);

        if (shadowEnabled && this.sceneConfig.lights && this.sceneConfig.lights.dirLights) {
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

        this._updateMaterial();

        this._initCubeLight();
    }

    _createIBLMaps(hdr) {
        const regl = this.regl;
        return reshader.pbr.PBRHelper.createIBLMaps(regl, {
            envTexture : hdr.getREGLTexture(regl),
            // prefilterCubeSize : 256
        });
    }

    _updateMaterial() {
        if (this.material) {
            this.material.dispose();
        }
        const materialConfig = this.sceneConfig.material;
        const material = {};
        for (const p in materialConfig) {
            if (materialConfig.hasOwnProperty(p)) {
                if (p.indexOf('Map') > 0) {
                    //a texture image
                    material[p] = new reshader.Texture2D({
                        url : materialConfig[p],
                        wrapS : 'repeat', wrapT : 'repeat'
                    }, this.loader);
                } else {
                    material[p] = materialConfig[p];
                }
            }
        }
        this.material = new reshader.pbr.StandardMaterial(material);
    }

    _initCubeLight() {
        const cubeLightConfig = this.sceneConfig.lights && this.sceneConfig.lights.ambientCubeLight;
        if (cubeLightConfig) {
            if (!cubeLightConfig.url && !cubeLightConfig.data) {
                throw new Error('Must provide url or data(ArrayBuffer) for ambientCubeLight');
            }
            const props = {
                url : cubeLightConfig.url,
                arrayBuffer : true,
                hdr : true,
                type : 'float',
                format : 'rgba',
                flipY : true
            };
            this._isIBLRecreated = !!cubeLightConfig.data;
            if (cubeLightConfig.data) {
                let data = cubeLightConfig.data;
                if (cubeLightConfig.data instanceof ArrayBuffer) {
                    // HDR raw data
                    data = reshader.HDR.parseHDR(cubeLightConfig.data);
                    props.data = data.pixels;
                    props.width = data.width;
                    props.height = data.height;
                } else {
                    props.data = data;
                }
            }
            this.hdr = new reshader.Texture2D(
                props,
                this.loader
            );

            //生成ibl纹理
            this.iblMaps = this._createIBLMaps(this.hdr);
        }
    }

    _getUniforms() {
        const uniforms = [
            'model',
            'camPos',
            'ambientIntensity',
            'ambientColor',
            {
                name : 'projectionViewModel',
                type : 'function',
                fn : function (context, props) {
                    const projectionViewModel = [];
                    mat4.multiply(projectionViewModel, props['view'], props['model']);
                    mat4.multiply(projectionViewModel, props['projection'], projectionViewModel);
                    return projectionViewModel;
                }
            },
            {
                name : 'viewModel',
                type : 'function',
                fn : function (context, props) {
                    const viewModel = [];
                    mat4.multiply(viewModel, props['view'], props['model']);
                    return viewModel;
                }
            }
        ];

        const lightConfig = this.sceneConfig.lights;

        if (lightConfig.dirLights) {
            const numOfDirLights = lightConfig.dirLights.length;
            uniforms.push(`dirLightDirections[${numOfDirLights}]`);
            uniforms.push(`dirLightColors[${numOfDirLights}]`);
            if (this.sceneConfig.shadow && this.sceneConfig.shadow.enable) {
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
            }
        }
        if (lightConfig.spotLights) {
            uniforms.push(`spotLightPositions[${lightConfig.spotLights.length}]`);
            uniforms.push(`spotLightColors[${lightConfig.spotLights.length}]`);
        }
        if (lightConfig.ambientCubeLight) {
            uniforms.push('irradianceMap', 'prefilterMap', 'brdfLUT');
        }

        return uniforms;
    }

    _getUniformValues(map) {
        const view = map.viewMatrix,
            projection = map.projMatrix,
            camPos = map.cameraPosition;
        const lightUniforms = this._getLightUniforms();
        return extend({
            view, projection, camPos
        }, lightUniforms);
    }

    _getLightUniforms() {
        const lightConfig = this.sceneConfig.lights;

        const ambientColor = lightConfig.ambientColor || [0.08, 0.08, 0.08];
        const aoIntensity = lightConfig.ambientIntensity;
        const uniforms = {
            ambientColor,
            ambientIntensity : aoIntensity === 0 ? 0 : (aoIntensity || 1)
        };

        if (lightConfig.dirLights) {
            uniforms['dirLightDirections'] = lightConfig.dirLights.map(light => light.direction);
            uniforms['dirLightColors'] = lightConfig.dirLights.map(light => light.color);
        }
        if (lightConfig.spotLights) {
            uniforms['spotLightPositions'] = lightConfig.spotLights.map(light => light.position);
            uniforms['spotLightColors'] = lightConfig.spotLights.map(light => light.color);
        }
        if (lightConfig.ambientCubeLight) {
            uniforms['irradianceMap'] = this.iblMaps.irradianceMap;
            uniforms['prefilterMap'] = this.iblMaps.prefilterMap;
            uniforms['brdfLUT'] = this.iblMaps.brdfLUT;
        }

        return uniforms;
    }

    _getDefines() {
        const defines =  {
            'USE_COLOR' : 1,
            'SUPPORT_TEXTURE_LOD' : 1
        };

        const lightConfig = this.sceneConfig.lights;

        if (lightConfig.dirLights) {
            defines['USE_DIR_LIGHT'] = 1;
            defines['NUM_OF_DIR_LIGHTS'] = `(${lightConfig.dirLights.length})`;
        }
        if (lightConfig.spotLights) {
            defines['USE_SPOT_LIGHT'] = 1;
            defines['NUM_OF_SPOT_LIGHTS'] = `(${lightConfig.spotLights.length})`;
        }
        if (lightConfig.ambientCubeLight) {
            defines['USE_AMBIENT_CUBEMAP'] = 1;
        }
        if (this.sceneConfig.shadow && this.sceneConfig.shadow.enable) {
            defines['USE_SHADOW'] = 1;
        }
        return defines;
    }

    debugFBO(id, fbo) {
        const canvas = document.getElementById(id);
        const width = fbo.width, height = fbo.height;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const pixels = this.regl.read({
            framebuffer : fbo
        });

        const halfHeight = height / 2 | 0;  // the | 0 keeps the result an int
        const bytesPerRow = width * 4;

        for (let i = 0; i < pixels.length; i++) {
            pixels[i] *= 255;
        }

        // make a temp buffer to hold one row
        const temp = new Uint8Array(width * 4);
        for (let y = 0; y < halfHeight; ++y) {
            const topOffset = y * bytesPerRow;
            const bottomOffset = (height - y - 1) * bytesPerRow;

            // make copy of a row on the top half
            temp.set(pixels.subarray(topOffset, topOffset + bytesPerRow));

            // copy a row from the bottom half to the top
            pixels.copyWithin(topOffset, bottomOffset, bottomOffset + bytesPerRow);

            // copy the copy of the top half row to the bottom half
            pixels.set(temp, bottomOffset);
        }

        // This part is not part of the answer. It's only here
        // to show the code above worked
        // copy the pixels in a 2d canvas to show it worked
        const imgdata = new ImageData(width, height);
        imgdata.data.set(pixels);
        ctx.putImageData(imgdata, 0, 0);
    }
}

export default PBRScenePainter;
