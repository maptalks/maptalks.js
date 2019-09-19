import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import { extend, isNumber } from '../../Util';
import Painter from '../Painter';
import { setUniformFromSymbol } from '../../Util';

const SCALE = [1, 1, 1];

class StandardPainter extends Painter {

    createGeometry(glData) {
        const geometry = new reshader.Geometry(glData.data, glData.indices, 0, {
            uv0Attribute: 'aTexCoord0'
        });
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
        if (geometry.data.aExtrude) {
            defines['IS_LINE_EXTRUSION'] = 1;
            const symbol = this.getSymbol();
            const { tileResolution, tileRatio } = geometry.properties;
            const map = this.getMap();
            Object.defineProperty(mesh.uniforms, 'linePixelScale', {
                enumerable: true,
                get: function () {
                    return tileRatio * map.getResolution() / tileResolution;
                }
            });
            setUniformFromSymbol(mesh.uniforms, 'lineWidth', symbol, 'lineWidth');
        }
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
            mesh.setMaterial(this.material);
        }
        this.scene.addMesh(mesh);
    }

    getShadowMeshes() {
        return this.scene.getMeshes();
    }

    updateSceneConfig(config) {
        extend(this.sceneConfig, config);
        this.init();
        this.setToRedraw();
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
        this.material.dispose();
        if (this._hdr) {
            this._hdr.dispose();
        }
    }

    updateSymbol() {
        super.updateSymbol();
        this._updateMaterial();
    }

    init(context) {
        //保存context，updateSceneConfig时读取
        this._context = this._context || context;
        if (!this.sceneConfig.lights) {
            this.sceneConfig.lights = {};
        }
        const lightConfig = this.sceneConfig.lights;
        lightConfig.camera = lightConfig.camera || {};
        lightConfig.ambient = lightConfig.ambient || {};

        this._initHDR();
        const regl = this.regl;

        this.renderer = new reshader.Renderer(regl);

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
            uniforms: this._context.shadow && this._context.shadow.uniformDeclares || null,
            defines: this._getDefines(this._context.shadow && this._context.shadow.defines),
            extraCommandProps: {
                cull: {
                    enable: true,
                    face: 'back'
                },
                stencil: {
                    enable: true,
                    func: {
                        cmp: '<=',
                        ref: (context, props) => {
                            return props.level;
                        },
                        // mask: 0xff
                    },
                    opFront: {
                        fail: 'keep',
                        zfail: 'keep',
                        zpass: 'replace'
                    },
                    opBack: {
                        fail: 'keep',
                        zfail: 'keep',
                        zpass: 'keep'
                    }
                },
                viewport,
                polygonOffset: {
                    enable: true,
                    offset: {
                        factor: -(this.pluginIndex + 1),
                        units: -(this.pluginIndex + 1)
                    }
                }
            }
        };

        this.shader = this.getShader(config);

        this._bindedOnTextureLoad = this._onTextureLoad.bind(this);
        this._bindDisposeCachedTexture = this.disposeCachedTexture.bind(this);

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
    }

    _onTextureLoad({ resources }) {
        if (this._hdr && this._hdr.isReady() && !this._isIBLRecreated) {
            //环境光纹理载入，重新生成ibl纹理
            this.iblMaps = this._createIBLMaps(this._hdr);
            this._isIBLRecreated = true;
        }
        for (let i = 0; i < resources.length; i++) {
            this.addCachedTexture(resources[i].url, resources[i].data);
        }
        this.setToRedraw();
    }

    _createIBLMaps(hdr) {
        const config = this.sceneConfig.lights.ambient.resource;
        if (this.iblMaps) {
            this._disposeIblMaps();
        }
        const regl = this.regl;
        const maps = reshader.pbr.PBRHelper.createIBLMaps(regl, {
            envTexture: hdr.getREGLTexture(regl),
            ignoreSH: !!config['sh'],
            // prefilterCubeSize : 256
        });
        if (config['sh']) {
            maps.sh = config['sh'];
        }
        return maps;
    }

    _updateMaterial() {
        if (this.material) {
            this.material.dispose();
        }
        const materialConfig = this.getSymbol().material;
        const material = {};
        for (const p in materialConfig) {
            if (materialConfig.hasOwnProperty(p)) {
                if (p.indexOf('Texture') > 0) {
                    //纹理图片
                    let texConf = materialConfig[p];
                    if (!texConf) {
                        continue;
                    }
                    const url = typeof texConf === 'string' ? texConf : texConf.url;
                    const cachedTex = this.getCachedTexture(url);

                    if (cachedTex) {
                        //已有缓存
                        if (cachedTex.then) {
                            //是一个promise
                            if (url === texConf) {
                                texConf = {
                                    promise: cachedTex,
                                    wrap: 'repeat'
                                };
                            } else {
                                texConf.promise = cachedTex;
                            }
                        } else if (url === texConf) {
                            //已有图片数据
                            texConf = {
                                data: cachedTex,
                                wrap: 'repeat'
                            };
                        } else {
                            //已有图片数据
                            texConf.data = cachedTex;
                        }
                    } else if (url === texConf) {
                        //无缓存
                        texConf = {
                            url,
                            wrap: 'repeat'
                        };
                    }
                    material[p] = new reshader.Texture2D(texConf, this._loader);
                    material[p].once('complete', this._bindedOnTextureLoad);
                    material[p].once('disposed', this._bindDisposeCachedTexture);
                    if (material[p].promise) {
                        //把promise加入缓存，方便图片被多个纹理对象同时引用时，避免重复请求
                        this.addCachedTexture(url, material[p].promise);
                    }
                } else {
                    material[p] = materialConfig[p];
                }
            }
        }
        this.material = this.getMaterial(material);
    }

    _initCubeLight() {
        const config = this.sceneConfig.lights && this.sceneConfig.lights.ambient && this.sceneConfig.lights.ambient.resource;
        if (config === undefined) {
            return;
        }
        if (isNumber(config)) {
            //从图层的全局resources中读取
            const { resource } = this.layer.getStyleResource(config);
            this.iblMaps = this._createIBLMapFromResource(resource);
            return;
        } else if (config.url || config.data) {
            //a url
            const cached = config.url && this.getCachedTexture(config.url);
            const props = {
                url: config.url,
                arrayBuffer: true,
                hdr: true,
                type: 'float',
                format: 'rgba',
                flipY: true
            };
            if (cached) {
                if (cached.then) {
                    props.promise = cached;
                } else {
                    props.data = cached;
                }
            }
            this._isIBLRecreated = !!config.data;
            if (!props.data && config.data) {
                let data = config.data;
                if (config.data instanceof ArrayBuffer) {
                    // HDR raw data
                    data = reshader.HDR.parseHDR(config.data);
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
            this._hdr.once('complete', this._bindedOnTextureLoad);
            this._hdr.once('disposed', this._bindDisposeCachedTexture);
            //生成ibl纹理
            this.iblMaps = this._createIBLMaps(this._hdr);
            return;
        }
    }

    _createIBLMapFromResource(resource) {
        const { prefilterMap, dfgLUT, sh } = resource;
        return {
            prefilterMap,
            dfgLUT,
            sh
        };
    }

    getUniformValues(map, context) {
        const viewMatrix = map.viewMatrix,
            projMatrix = map.projMatrix,
            cameraPosition = map.cameraPosition;
        const lightUniforms = this._getLightUniforms();
        const uniforms = extend({
            viewMatrix,
            projMatrix,
            projViewMatrix: map.projViewMatrix,
            cameraPosition,
            resolution: [map.width, map.height, 1 / map.width, 1 / map.height],
            time: 0
        }, lightUniforms);
        if (context && context.shadow && context.shadow.renderUniforms) {
            extend(uniforms, context.shadow.renderUniforms);
        }
        return uniforms;
    }

    _getLightUniforms() {
        const iblMaps = this.iblMaps;
        const lightConfig = this.sceneConfig.lights;
        const aperture = lightConfig.camera.aperture || 16; //光圈
        const speed = lightConfig.camera.speed || 1 / 125; //快门速度
        const iso = lightConfig.camera.iso || 100; //iso感光度
        const ev100 = computeEV100(aperture, speed, iso);

        let uniforms;
        if (iblMaps) {
            const mipLevel = Math.log(512) / Math.log(2);
            uniforms = {
                'iblMaxMipLevel': [mipLevel, 1 << mipLevel],
                'light_iblDFG': iblMaps.dfgLUT,
                'light_iblSpecular': iblMaps.prefilterMap,
                'iblSH': iblMaps.sh,
                'iblLuminance': lightConfig.ambient.luminance || 12000,
                'exposure': ev100toExposure(ev100),
                'ev100': ev100,
                'sun': [1, 1, 1, -1],
            };
        } else {
            uniforms = {
                'light_ambientColor': lightConfig.ambient.color || [0.05, 0.05, 0.05],
                'exposure': ev100toExposure(ev100),
                'ev100': ev100,
                'sun': [1, 1, 1, -1]
            };
        }

        if (lightConfig.directional) {
            uniforms['lightColorIntensity'] = [...(lightConfig.directional.color || [1, 1, 1]), lightConfig.directional.intensity || 30000];
            uniforms['lightDirection'] = lightConfig.directional.direction || [1, 1, -1];
        }
        return uniforms;
    }

    _getDefines(shadowDefines) {
        const lightConfig = this.sceneConfig.lights;
        const defines = {};
        if (lightConfig.ambient && lightConfig.ambient.resource !== undefined) {
            defines['HAS_IBL_LIGHTING'] = 1;
            defines['IBL_MAX_MIP_LEVEL'] = (Math.log(lightConfig.ambient.prefilterCubeSize || 256) / Math.log(2)) + '.0';
        }
        if (shadowDefines) {
            extend(defines, shadowDefines);
        }
        if (lightConfig.directional) {
            defines['HAS_DIRECTIONAL_LIGHTING'] = 1;
        }

        return defines;
    }

    _disposeIblMaps() {
        if (!this.iblMaps) {
            return;
        }
        const resource = this.sceneConfig.lights.ambient.resource;
        if (!isNumber(resource)) {
            //如果是数字，说明是图层定义的全局resource中的资源，不能dispose
            for (const p in this.iblMaps) {
                if (this.iblMaps[p].destroy) {
                    this.iblMaps[p].destroy();
                }
            }
        }

        delete this.iblMaps;
    }

    shouldDeleteMeshOnUpdateSymbol() {
        return false;
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

export default StandardPainter;
