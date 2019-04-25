import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import { extend } from '../../Util';
import Painter from '../Painter';
import VSMShadowPass from './VSMShadowPass.js';

const SCALE = [1, 1, 1];

class LitPainter extends Painter {
    constructor(regl, layer, sceneConfig, pluginIndex) {
        super(regl, layer, sceneConfig, pluginIndex);
        // this.colorSymbol = 'polygonFill';
    }

    createGeometry(glData) {
        const data = {
            aPosition: glData.vertices,
            aTexCoord0: glData.uvs,
            aNormal: glData.normals,
            aColor: glData.colors,
            aPickingId: glData.featureIndexes
        };
        const geometry = new reshader.Geometry(data, glData.indices, 0, {
            uv0Attribute: 'aTexCoord0'
        });
        //创建 tangent
        geometry.createTangent('aTangent');
        geometry.generateBuffers(this.regl);
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
        const defines = this.shader.getGeometryDefines(geometry);
        mesh.setDefines(defines);
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
        this.scene.addMesh(mesh);
        if (this._shadowScene) {
            // 如果shadow mesh已经存在， 则优先用它
            const shadowMesh = mesh;
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

    deleteMesh(meshes, keepGeometry) {
        if (!meshes) {
            return;
        }
        this.scene.removeMesh(meshes);
        if (Array.isArray(meshes)) {
            for (let i = 0; i < meshes.length; i++) {
                if (!keepGeometry) {
                    meshes[i].geometry.dispose();
                }
                meshes[i].dispose();
            }
        } else {
            if (!keepGeometry) {
                meshes.geometry.dispose();
            }
            meshes.dispose();
        }
    }

    delete() {
        super.delete();
        this._disposeIblMaps();
        if (this._emptyCube) {
            this._emptyCube.destroy();
        }
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
        const extent = map['_get2DExtent'](map.getGLZoom());
        const scaleX = extent.getWidth() * 2, scaleY = extent.getHeight() * 2;
        const localTransform = this._ground.localTransform;
        mat4.identity(localTransform);
        mat4.translate(localTransform, localTransform, map.cameraLookAt);
        mat4.scale(localTransform, localTransform, [scaleX, scaleY, 1]);
    }

    init() {
        if (!this.sceneConfig.lights) {
            this.sceneConfig.lights = {};
        }
        const lightConfig = this.sceneConfig.lights;
        lightConfig.camera = lightConfig.camera || {};
        lightConfig.ambient = lightConfig.ambient || {};

        this._initHDR();
        const regl = this.regl;

        const shadowEnabled = this.sceneConfig.shadow && this.sceneConfig.shadow.enable;

        this.renderer = new reshader.Renderer(regl);

        if (shadowEnabled && this.sceneConfig.lights && this.sceneConfig.lights.directional) {
            const planeGeo = new reshader.Plane();
            planeGeo.generateBuffers(regl);
            this._ground = new reshader.Mesh(planeGeo);
            this._groundScene = new reshader.Scene([this._ground]);

            this._shadowScene = new reshader.Scene();
            this._shadowScene.addMesh(this._ground);
            if (this.sceneConfig.shadow.type === 'vsm') {
                this._shadowPass = new VSMShadowPass(this.sceneConfig, this.renderer);
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
            uniforms: this._shadowPass ? this._shadowPass.getUniforms() : null,
            defines: this._getDefines(),
            extraCommandProps: {
                //enable cullFace
                cull: {
                    enable: true,
                    face: 'back'
                },
                stencil: {
                    enable: false
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

        this.shader = new reshader.pbr.LitShader(config);

        this._updateMaterial();

        this._initCubeLight();

        const pickingConfig = {
            vert: `
                attribute vec3 aPosition;
                uniform mat4 projViewModelMatrix;
                #include <fbo_picking_vert>
                void main() {
                    vec4 pos = vec4(aPosition, 1.0);
                    gl_Position = projViewModelMatrix * pos;
                    fbo_picking_setData(gl_Position.w, true);
                }
            `,
            uniforms: [
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: (context, props) => {
                        return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                    }
                }
            ]
        };
        this.picking = new reshader.FBORayPicking(this.renderer, pickingConfig, this.layer.getRenderer().pickingFBO);

    }

    _initHDR() {
        const regl = this.regl;
        this._emptyCube = regl.texture(2);
        this._loader = new reshader.ResourceLoader(this._emptyCube);
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
        if (this.iblMaps) {
            this._disposeIblMaps();
        }
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
            if (materialConfig.hasOwnProperty(p)) {
                if (p.indexOf('Texture') > 0) {
                    //a texture image
                    let texConf = materialConfig[p];
                    if (typeof texConf === 'string') {
                        texConf = {
                            url: texConf,
                            wrap: 'repeat'
                        };
                    }
                    material[p] = new reshader.Texture2D(texConf, this._loader);
                } else {
                    material[p] = materialConfig[p];
                }
            }
        }
        this.material = new reshader.pbr.LitMaterial(material);
    }

    _initCubeLight() {
        const cubeLightConfig = this.sceneConfig.lights && this.sceneConfig.lights.ambient;
        if (cubeLightConfig) {
            if (!cubeLightConfig.url && !cubeLightConfig.data) {
                throw new Error('Must provide url or data(ArrayBuffer) for ambient cube light');
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

    getUniformValues(map) {
        if (this._mergedUniforms) {
            return this._mergedUniforms;
        }
        const viewMatrix = map.viewMatrix,
            projMatrix = map.projMatrix,
            cameraPosition = map.cameraPosition;
        const lightUniforms = this._getLightUniforms();
        return extend({
            viewMatrix,
            projMatrix,
            projViewMatrix: map.projViewMatrix,
            cameraPosition,
            resolution: [map.width, map.height, 1 / map.width, 1 / map.height],
            time: 0
        }, lightUniforms);
    }

    _getLightUniforms() {
        const iblMaps = this.iblMaps;
        const lightConfig = this.sceneConfig.lights;

        const aperture = lightConfig.camera.aperture || 16; //光圈
        const speed = lightConfig.camera.speed || 1 / 125; //快门速度
        const iso = lightConfig.camera.iso || 100; //iso感光度
        const ev100 = computeEV100(aperture, speed, iso);
        const uniforms = {
            'light_iblDFG': iblMaps.dfgLUT,
            'light_iblSpecular': iblMaps.prefilterMap,
            'iblSH': iblMaps.sh,
            'iblLuminance': lightConfig.ambient.luminance || 12000,
            'exposure': ev100toExposure(ev100),
            'ev100': ev100,
            'sun': [1, 1, 1, -1],
        };

        if (lightConfig.directional) {
            uniforms['lightColorIntensity'] = [...(lightConfig.directional.color || [1, 1, 1]), lightConfig.directional.intensity || 30000];
            uniforms['lightDirection'] = lightConfig.directional.direction || [1, 1, -1];
        }
        return uniforms;
    }

    _getDefines() {
        const shadowEnabled = this.sceneConfig.shadow && this.sceneConfig.shadow.enable;
        const lightConfig = this.sceneConfig.lights;
        const defines = {
            'IBL_MAX_MIP_LEVEL': (Math.log(lightConfig.ambient.prefilterCubeSize || 256) / Math.log(2)) + '.0'
        };
        if (shadowEnabled) {
            defines['HAS_SHADOWING'] = 1;
        }
        if (lightConfig.directional) {
            defines['HAS_DIRECTIONAL_LIGHTING'] = 1;
        }

        if (this._shadowPass) {
            const shadowDefines = this._shadowPass.getDefines();
            extend(defines, shadowDefines);
        }
        return defines;
    }

    _disposeIblMaps() {
        for (const p in this.iblMaps) {
            if (this.iblMaps[p].destroy) {
                this.iblMaps[p].destroy();
            }
        }
    }
}

//根据快门参数，计算ev100
function computeEV100(aperture, shutterSpeed, ISO) {
    // log2((N^2*S)/(t*100))
    return Math.log2(((aperture * aperture) * 100.0) / (shutterSpeed * ISO));
}

function ev100toExposure(EV100) {
    return 1.0 / (1.2 * Math.pow(2.0, EV100));
}

export default LitPainter;
