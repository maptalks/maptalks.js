import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import { extend, hasOwn } from '../../Util';
import Painter from '../Painter';
import ShadowMapPass from './ShadowMapPass.js';
import StencilShadowPass from './StencilShadowPass.js';

const SCALE = [1, 1, 1];

class PBRPainter extends Painter {
    constructor(regl, layer, symbol, sceneConfig, pluginIndex, dataConfig) {
        super(regl, layer, symbol, sceneConfig, pluginIndex, dataConfig);
        this.colorSymbol = 'polygonFill';
    }

    createGeometry(glData) {
        const geometry = new reshader.Geometry(glData.data, glData.indices);
        geometry.generateBuffers(this.regl);

        if (glData.shadowVolume && this._shadowPass && this._shadowPass.createShadowVolume) {
            const shadowGeos = this._shadowPass.createShadowVolume(glData.shadowVolume);
            geometry.shadow = shadowGeos;
        }

        return geometry;
    }

    createMesh(geometry, transform) {
        const mesh = new reshader.Mesh(geometry, this.material);
        if (this.sceneConfig.animation) {
            SCALE[2] = 0.01;
            const mat = [];
            mat4.fromScaling(mat, SCALE);
            mat4.multiply(mat, transform, mat);
            transform = mat;
        }
        mesh.setLocalTransform(transform);

        return mesh;
    }

    addMesh(mesh, progress) {
        if (progress !== null) {
            const mat = mesh.localTransform;
            if (progress === 0) {
                progress = 0.01;
            }
            SCALE[2] = progress;
            mat4.fromScaling(mat, SCALE);
            mat4.multiply(mat, mesh.properties.tileTransform, mat);
            mesh.setLocalTransform(mat);
        } else {
            mesh.setLocalTransform(mesh.properties.tileTransform);
        }
        if (mesh.material !== this.material) {
            mesh.material = this.material;
        }
        const geometry = mesh.geometry;
        this.scene.addMesh(mesh);
        if (this._shadowScene) {
            // 如果shadow mesh已经存在， 则优先用它
            const shadowMesh = geometry.shadow || mesh;
            if (shadowMesh !== mesh) {
                shadowMesh.forEach(m => m.setLocalTransform(mesh.localTransform));
            }
            this._shadowScene.addMesh(shadowMesh);
        }
    }

    paint(context) {
        const layer = this.layer;
        const map = layer.getMap();
        if (!map) {
            return {
                redraw: false
            };
        }

        const uniforms = this.getUniformValues(map);

        if (this._shadowPass) {
            this._transformGround(layer);
            const { fbo } = this._shadowPass.pass1({
                layer,
                uniforms,
                scene: this._shadowScene,
                groundScene: this._groundScene
            });
            if (this.sceneConfig.shadow.debug) {
                // this.debugFBO(shadowConfig.debug[0], depthFBO);
                this.debugFBO(this.sceneConfig.shadow.debug[1], fbo);
            }
        }

        //记录与阴影合并后的uniforms，super.paint中调用getUniformValues时，直接返回
        this._mergedUniforms = uniforms;

        const status = super.paint(context);

        if (this._shadowPass) {
            this._shadowPass.pass2();
        }

        delete this._mergedUniforms;

        return status;
    }

    updateSceneConfig(config) {
        const keys = Object.keys(config);
        if (keys.length === 1 && keys[0] === 'material') {
            this.sceneConfig.material = config.material;
            this._updateMaterial();
        } else {
            extend(this.sceneConfig, config);
            this.init();
            this.setToRedraw();
        }
    }

    startFrame() {
        super.startFrame();
        if (this._shadowScene) {
            this._shadowScene.clear();
            this._shadowScene.addMesh(this._ground);
        }
    }

    delete() {
        super.delete();
        if (this._shadowScene) {
            this._shadowScene.clear();
        }
        this.material.dispose();
        if (this._ground) {
            this._ground.geometry.dispose();
            this._ground.dispose();
        }
        if (this._shadowPass) {
            this._shadowPass.delete();
        }
    }

    _transformGround() {
        const layer = this.layer;
        const map = layer.getMap();
        // console.log(layer.getRenderer()._getMeterScale());
        const extent = map['_get2DExtentAtRes'](map.getGLRes());
        const scaleX = extent.getWidth() * 2, scaleY = extent.getHeight() * 2;
        const localTransform = this._ground.localTransform;
        mat4.identity(localTransform);
        mat4.translate(localTransform, localTransform, map.cameraLookAt);
        mat4.scale(localTransform, localTransform, [scaleX, scaleY, 1]);
    }

    init() {
        this._initHDR();
        const regl = this.regl;

        const shadowEnabled = this.sceneConfig.shadow && this.sceneConfig.shadow.enable;

        this.renderer = new reshader.Renderer(regl);

        if (shadowEnabled && this.sceneConfig.lights && this.sceneConfig.lights.dirLights) {
            const planeGeo = new reshader.Plane();
            planeGeo.generateBuffers(regl);
            this._ground = new reshader.Mesh(planeGeo);
            this._groundScene = new reshader.Scene([this._ground]);

            this._shadowScene = new reshader.Scene();
            this._shadowScene.addMesh(this._ground);
            if (this.sceneConfig.shadow.type === 'vsm') {
                this._shadowPass = new ShadowMapPass(this.sceneConfig, this.renderer);
            } else {
                this._shadowPass = new StencilShadowPass(this.sceneConfig, this.renderer);
            }
        }

        const viewport = {
            x: 0,
            y: 0,
            width: () => {
                return this.canvas ? this.canvas.width : 1;
            },
            height: () => {
                return this.canvas ? this.canvas.height : 1;
            }
        };

        const config = {
            vert: reshader.pbr.StandardVert,
            frag: reshader.pbr.StandardFrag,
            uniforms: this._getUniforms(),
            defines: this._getDefines(),
            extraCommandProps: {
                //enable cullFace
                cull: {
                    enable: true,
                    face: 'back'
                },
                viewport
                // polygonOffset: {
                //     enable: true,
                //     offset: {
                //         factor: -100,
                //         units: -100
                //     }
                // }
            }
        };

        this.shader = new reshader.MeshShader(config);

        this._updateMaterial();

        this._initCubeLight();

        const pickingConfig = {};
        pickingConfig.vert = `
            attribute vec3 aPosition;
            uniform mat4 projViewModelMatrix;
            #include <fbo_picking_vert>
            void main() {
                vec4 pos = vec4(aPosition, 1.0);
                gl_Position = projViewModelMatrix * pos;
                fbo_picking_setData(gl_Position.w, true);
            }
        `;
        let u;
        for (let i = 0; i < config.uniforms.length; i++) {
            if (config.uniforms[i] === 'projViewModelMatrix' || config.uniforms[i].name === 'projViewModelMatrix') {
                u = config.uniforms[i];
                break;
            }
        }
        pickingConfig.uniforms = [u];
        this.picking = [new reshader.FBORayPicking(this.renderer, pickingConfig, this.layer.getRenderer().pickingFBO, this.getMap())];

    }

    _initHDR() {
        const regl = this.regl;
        if (!this.sceneConfig.lights) {
            this.sceneConfig.lights = {};
        }
        this._loader = new reshader.ResourceLoader(regl.texture(2));
        this._hdr = null;
        this._loader.on('complete', () => {
            if (this._hdr && this._hdr.isReady() && !this._isIBLRecreated) {
                //环境光纹理载入，重新生成ibl纹理
                this.iblMaps = this._createIBLMaps(this._hdr);
                this._isIBLRecreated = true;
            }
            this.setToRedraw();
        });
    }

    _createIBLMaps(hdr) {
        const regl = this.regl;
        return reshader.pbr.PBRHelper.createIBLMaps(regl, {
            envTexture: hdr.getREGLTexture(regl),
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
            if (hasOwn(materialConfig, p)) {
                if (p.indexOf('Map') > 0) {
                    //a texture image
                    material[p] = new reshader.Texture2D({
                        url: materialConfig[p],
                        wrapS: 'repeat', wrapT: 'repeat'
                    }, this._loader);
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
                url: cubeLightConfig.url,
                arrayBuffer: true,
                hdr: true,
                type: 'float',
                format: 'rgba',
                flipY: true
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
            this._hdr = new reshader.Texture2D(
                props,
                this._loader
            );

            //生成ibl纹理
            this.iblMaps = this._createIBLMaps(this._hdr);
        }
    }

    _getUniforms() {
        const uniforms = [
            'modelMatrix',
            'camPos',
            'ambientIntensity',
            'ambientColor',
            {
                name: 'projViewModelMatrix',
                type: 'function',
                fn: function (context, props) {
                    const projViewModelMatrix = [];
                    mat4.multiply(projViewModelMatrix, props['viewMatrix'], props['modelMatrix']);
                    mat4.multiply(projViewModelMatrix, props['projMatrix'], projViewModelMatrix);
                    return projViewModelMatrix;
                }
            },
            {
                name: 'viewModelMatrix',
                type: 'function',
                fn: function (context, props) {
                    const viewModel = [];
                    mat4.multiply(viewModel, props['viewMatrix'], props['modelMatrix']);
                    return viewModel;
                }
            }
        ];

        const lightConfig = this.sceneConfig.lights;

        if (lightConfig.dirLights) {
            const numOfDirLights = lightConfig.dirLights.length;
            uniforms.push(`dirLightDirections[${numOfDirLights}]`);
            uniforms.push(`dirLightColors[${numOfDirLights}]`);
            if (this._shadowPass) {
                const shadowUniforms = this._shadowPass.getUniforms(numOfDirLights);
                shadowUniforms.forEach(u => uniforms.push(u));
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

    getUniformValues(map) {
        if (this._mergedUniforms) {
            return this._mergedUniforms;
        }
        const viewMatrix = map.viewMatrix,
            projMatrix = map.projMatrix,
            camPos = map.cameraPosition;
        const lightUniforms = this._getLightUniforms();
        return extend({
            viewMatrix, projMatrix, camPos
        }, lightUniforms);
    }

    _getLightUniforms() {
        const lightConfig = this.sceneConfig.lights;

        const ambientColor = lightConfig.ambientColor || [0.08, 0.08, 0.08];
        const aoIntensity = lightConfig.ambientIntensity;
        const uniforms = {
            ambientColor,
            ambientIntensity: aoIntensity === 0 ? 0 : (aoIntensity || 1)
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
            'USE_COLOR': 1
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
        if (this._shadowPass) {
            const shadowDefines = this._shadowPass.getDefines();
            extend(defines, shadowDefines);
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
            framebuffer: fbo
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

export default PBRPainter;
