import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import { isNil, extend, isNumber } from '../../Util';
import Painter from '../Painter';
import { setUniformFromSymbol } from '../../Util';
import { piecewiseConstant, isFunctionDefinition } from '@maptalks/function-type';

const PREFILTER_CUBE_SIZE = 256;
const SCALE = [1, 1, 1];

class StandardPainter extends Painter {
    constructor(regl, layer, symbol, sceneConfig, pluginIndex) {
        super(regl, layer, symbol, sceneConfig, pluginIndex);
        // this.colorSymbol = 'polygonFill';
        if (isFunctionDefinition(this.symbolDef['polygonFill'])) {
            const map = layer.getMap();
            const fn = piecewiseConstant(this.symbolDef['polygonFill']);
            this.colorSymbol = properties => fn(map.getZoom(), properties);
        } else {
            this.colorSymbol = this.getSymbol()['polygonFill'];
        }
    }

    createGeometry(glData) {
        const geometry = new reshader.Geometry(glData.data, glData.indices, 0, {
            uv0Attribute: 'aTexCoord0'
        });
        return geometry;
    }

    createMesh(geometry, transform) {
        if (!this.material) {
            //还没有初始化
            this.setToRedraw();
            return null;
        }
        const mesh = new reshader.Mesh(geometry, this.material);
        if (this.material['uNormalTexture']) {
            geometry.createTangent();
        }
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
        if (geometry.data.aColor) {
            defines['HAS_COLOR'] = 1;
        }
        geometry.generateBuffers(this.regl);
        mesh.setDefines(defines);
        mesh.setLocalTransform(transform);
        if (this.getSymbol().ssr) {
            mesh.setUniform('ssr', 1);
        }
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
        super.addMesh(mesh, progress);
    }

    paint(context) {
        const hasShadow = !!context.shadow;
        if (this._hasShadow === undefined) {
            this._hasShadow = hasShadow;
        }
        if (this._hasShadow !== hasShadow) {
            this.shader.dispose();
            this._createShader(context);
        }
        this._hasShadow = hasShadow;
        const isSsr = !!context.ssr;
        const shader = this.shader;
        const fbo = this.getRenderFBO(context);
        if (isSsr) {
            this._renderSsrDepth(context);
            context.renderTarget.fbo = context.ssr.fbo;
            this.shader = this._ssrShader;
        }
        super.paint(context);
        if (isSsr) {
            context.renderTarget.fbo = fbo;
            this.shader = shader;
        }
        if (this._shadowCount !== undefined && hasShadow) {
            const count = this.scene.getMeshes().length;
            if (this._shadowCount !== count) {
                this.setToRedraw();
            }
        }
        delete this._shadowCount;
    }

    _renderSsrDepth(context) {
        this._depthShader.filter = context.sceneFilter;
        this.renderer.render(this._depthShader, this.getUniformValues(this.layer.getMap(), context), this.scene, this.getRenderFBO(context));
    }

    getShadowMeshes() {
        this._shadowCount = this.scene.getMeshes().length;
        return this.scene.getMeshes();
    }

    updateSceneConfig(config) {
        extend(this.sceneConfig, config);
        this._updateCubeLight();
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
        if (this._depthShader) {
            this._depthShader.dispose();
            this._ssrShader.dispose();
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
        this._dfgLUT = reshader.pbr.PBRHelper.generateDFGLUT(this.regl);
        const regl = this.regl;

        this.renderer = new reshader.Renderer(regl);

        this._createShader(context);

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

    _createShader(context) {
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
        const uniformDeclares = [];
        if (context.shadow && context.shadow.uniformDeclares) {
            uniformDeclares.push(...context.shadow.uniformDeclares);
        }
        if (context.ssr && context.ssr.uniformDeclares) {
            uniformDeclares.push(...context.ssr.uniformDeclares);
        }
        const defines = {};
        if (context.shadow && context.shadow.defines) {
            extend(defines, context.shadow.defines);
        }
        const extraCommandProps = {
            cull: {
                enable: () => {
                    return this.sceneConfig.cullFace === undefined || !!this.sceneConfig.cullFace;
                },
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
                    zpass: 'replace'
                }
            },
            viewport,
            depth: {
                enable: true,
                range: this.sceneConfig.depthRange || [0, 1],
                func: this.sceneConfig.depthFunc || '<='
            },
            polygonOffset: {
                enable: true,
                offset: {
                    factor: () => { return -(this.layer.getPolygonOffset() + this.pluginIndex + 1); },
                    units: () => { return -(this.layer.getPolygonOffset() + this.pluginIndex + 1); }
                }
            }
        };
        const config = {
            uniforms: uniformDeclares,
            defines: this._getDefines(defines),
            extraCommandProps
        };

        this.shader = new reshader.pbr.StandardShader(config);
        if (reshader.SsrPass && !this._ssrShader) {
            uniformDeclares.push(...reshader.SsrPass.getUniformDeclares());
            this._ssrShader = new reshader.pbr.StandardShader({
                uniforms: uniformDeclares,
                defines: this._getDefines(reshader.SsrPass.getDefines()),
                extraCommandProps
            });

            // extraCommandProps.depth = {
            //     enable: true,
            //     func: 'always',
            //     range: [0, 1]
            // };
            this._depthShader = new reshader.pbr.StandardDepthShader({
                extraCommandProps
            });
        }
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
            this._disposeIblMaps(true);
        }
        const regl = this.regl;
        const maps = reshader.pbr.PBRHelper.createIBLMaps(regl, {
            envTexture: hdr.getREGLTexture(regl),
            ignoreSH: !!config['sh'],
            envCubeSize: PREFILTER_CUBE_SIZE,
            prefilterCubeSize: PREFILTER_CUBE_SIZE
        });
        if (config['sh']) {
            maps.sh = config['sh'];
        }/* else {
            console.log(JSON.stringify(maps.sh));
        }*/
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
        this.material = new reshader.pbr.StandardMaterial(material);
    }

    _getHDRResource() {
        return this.sceneConfig.lights && this.sceneConfig.lights.ambient && this.sceneConfig.lights.ambient.resource;
    }

    _updateCubeLight() {
        if (!this.iblMaps) {
            return;
        }
        if (this.iblMaps) {
            const config = this._getHDRResource();
            if (isNumber(config)) {
                if (config === this._iblConfig) {
                    return;
                }
            } else if (config && config.url === this._iblConfig.url) {
                return;
            }
            this._disposeIblMaps(true);
        }
        this._initCubeLight();
    }

    _initCubeLight() {
        const config = this._getHDRResource();
        if (!config && config !== 0) {
            return;
        }
        this._iblConfig = config;
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
        const viewMatrix = map.viewMatrix;
        const projMatrix = map.projMatrix;
        const cameraPosition = map.cameraPosition;
        const canvas = this.layer.getRenderer().canvas;
        const lightUniforms = this._getLightUniforms();
        const uniforms = extend({
            viewMatrix,
            projMatrix,
            projectionMatrix: projMatrix,
            projViewMatrix: map.projViewMatrix,
            uCameraPosition: cameraPosition,
            uGlobalTexSize: [canvas.width, canvas.height],
            uNearFar: [map.cameraNear, map.cameraFar]
        }, lightUniforms);
        if (context && context.shadow && context.shadow.renderUniforms) {
            extend(uniforms, context.shadow.renderUniforms);
        }
        if (context && context.ssr && context.ssr.renderUniforms) {
            extend(uniforms, context.ssr.renderUniforms);
        }
        if (context && context.jitter) {
            uniforms['uHalton'] = context.jitter;
        } else {
            uniforms['uHalton'] = [0, 0];
        }
        return uniforms;
    }

    _getLightUniforms() {
        const iblMaps = this.iblMaps;
        const lightConfig = this.sceneConfig.lights;
        let uniforms;
        if (iblMaps) {
            const mipLevel = Math.log(PREFILTER_CUBE_SIZE) / Math.log(2);
            uniforms = {
                'sSpecularPBR': iblMaps.prefilterMap,
                'uDiffuseSPH': iblMaps.sh,
                'uTextureEnvironmentSpecularPBRLodRange': [mipLevel, mipLevel],
                'uTextureEnvironmentSpecularPBRTextureSize': [PREFILTER_CUBE_SIZE, PREFILTER_CUBE_SIZE],
                // 'iblMaxMipLevel': [mipLevel, 1 << mipLevel],
                // 'light_iblDFG': iblMaps.dfgLUT,
                // 'light_iblSpecular': iblMaps.prefilterMap,
                // 'iblSH': iblMaps.sh,
                // 'iblLuminance': lightConfig.ambient.luminance || 12000,
                // 'exposure': ev100toExposure(ev100),
                // 'ev100': ev100,
                // 'sun': [1, 1, 1, -1],
            };
        } else {
            uniforms = {
                'uAmbientColor': lightConfig.ambient.color || [0.08, 0.08, 0.08]
            };
            // uniforms = {
            //     'light_ambientColor': lightConfig.ambient.color || [0.05, 0.05, 0.05],
            //     'iblLuminance': lightConfig.ambient.luminance || 12000,
            //     'exposure': ev100toExposure(ev100),
            //     'ev100': ev100,
            //     'sun': [1, 1, 1, -1]
            // };
        }
        uniforms['uEnvironmentExposure'] = isNumber(lightConfig.ambient.exposure) ? lightConfig.ambient.exposure : 1; //2]
        uniforms['sIntegrateBRDF'] = this._dfgLUT;

        if (lightConfig.directional) {
            uniforms['uSketchfabLight0_diffuse'] = [...(lightConfig.directional.color || [1, 1, 1]), 1];
            uniforms['uSketchfabLight0_viewDirection'] = lightConfig.directional.direction || [1, 1, -1];
        }
        return uniforms;
    }

    _getDefines(shadowDefines) {
        const defines = {};
        if (!isNil(this._getHDRResource())) {
            defines['HAS_IBL_LIGHTING'] = 1;
        }
        if (shadowDefines) {
            extend(defines, shadowDefines);
        }
        return defines;
    }

    _disposeIblMaps(reserveDFG) {
        if (!reserveDFG && this._dfgLUT) {
            this._dfgLUT.destroy();
        }
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

export default StandardPainter;
