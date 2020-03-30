import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import { extend, isNumber } from '../../Util';
import MeshPainter from '../MeshPainter';
import { OFFSET_FACTOR_SCALE } from '../Constant';


class StandardPainter extends MeshPainter {
    constructor(regl, layer, symbol, sceneConfig, pluginIndex) {
        super(regl, layer, symbol, sceneConfig, pluginIndex);
        this._loader = new reshader.ResourceLoader();
    }

    createGeometry(glData) {
        const geometry = new reshader.Geometry(glData.data, glData.indices, 0, {
            uv0Attribute: 'aTexCoord0'
        });
        return geometry;
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
        this.shader = this.getShader();
        const shader = this.shader;
        const fbo = this.getRenderFBO(context);
        if (isSsr) {
            this._renderSsrDepth(context);
            context.renderTarget.fbo = context.ssr.fbo;
            this.shader = this.hasIBL() ? this._ssrShader : this._noIblSsrShader;
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

    getShader() {
        return this.hasIBL() ? this._iblShader : this._noIblShader;
    }

    hasIBL() {
        const lightManager = this.getMap().getLightManager();
        const resource = lightManager.getAmbientResource();
        return !!resource;
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
        this.setToRedraw();
    }


    delete() {
        this.getMap().off('updatelights', this._updateLights, this);
        super.delete();
        if (this._dfgLUT) {
            this._dfgLUT.destroy();
            delete this._dfgLUT;
        }
        this._disposeIblTextures();
        this.material.dispose();
        if (this._depthShader) {
            this._depthShader.dispose();
            this._ssrShader.dispose();
            this._noIblSsrShader.dispose();
        }
        if (this._iblShader) {
            this._iblShader.dispose();
        }
        if (this._noIblShader) {
            this._noIblShader.dispose();
        }
    }

    updateSymbol(symbol) {
        super.updateSymbol(symbol);
        if (symbol.material) {
            this._updateMaterial();
        }
    }

    init(context) {
        this.getMap().on('updatelights', this._updateLights, this);
        //保存context，updateSceneConfig时读取
        this._context = this._context || context;
        this._dfgLUT = reshader.pbr.PBRHelper.generateDFGLUT(this.regl);
        const regl = this.regl;
        this.renderer = new reshader.Renderer(regl);

        this._createShader(context);

        this._bindedOnTextureLoad = this._onTextureLoad.bind(this);
        this._bindDisposeCachedTexture = this.disposeCachedTexture.bind(this);
        this._bindOnMaterialComplete = this._onMaterialComplete.bind(this);

        this._updateMaterial();

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

    _updateLights(param) {
        if (param.ambientUpdate) {
            this._createIBLTextures();
        }
        this.setToRedraw();
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
        const layer = this.layer;
        const extraCommandProps = {
            cull: {
                enable: () => {
                    return this.sceneConfig.cullFace === undefined || !!this.sceneConfig.cullFace;
                },
                face: this.sceneConfig.cullFace || 'back'
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
                op: {
                    fail: 'keep',
                    zfail: 'keep',
                    zpass: 'replace'
                },
                // opBack: {
                //     fail: 'keep',
                //     zfail: 'keep',
                //     zpass: 'replace'
                // }
            },
            viewport,
            depth: {
                enable: true,
                range: this.sceneConfig.depthRange || [0, 1],
                func: this.sceneConfig.depthFunc || '<'
            },
            blend: {
                enable: true,
                func: {
                    src: 'src alpha',
                    dst: 'one minus src alpha'
                },
                equation: 'add'
            },
            polygonOffset: {
                enable: false,
                offset: {
                    factor: () => { return -OFFSET_FACTOR_SCALE * (layer.getPolygonOffset() + this.pluginIndex + 1) / layer.getTotalPolygonOffset(); },
                    units: () => { return -(layer.getPolygonOffset() + this.pluginIndex + 1); }
                }
            }
        };
        const config = {
            uniforms: uniformDeclares,
            defines: this._getDefines(defines),
            extraCommandProps
        };

        this._iblShader = new reshader.pbr.StandardShader(config);
        delete config.defines['HAS_IBL_LIGHTING'];
        this._noIblShader = new reshader.pbr.StandardShader(config);
        if (reshader.SsrPass && !this._ssrShader) {
            uniformDeclares.push(...reshader.SsrPass.getUniformDeclares());
            const defines = this._getDefines(reshader.SsrPass.getDefines());
            this._ssrShader = new reshader.pbr.StandardShader({
                uniforms: uniformDeclares,
                defines,
                extraCommandProps
            });
            delete defines['HAS_IBL_LIGHTING'];
            this._noIblSsrShader = new reshader.pbr.StandardShader({
                uniforms: uniformDeclares,
                defines,
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

    _onTextureLoad({ resources }) {
        for (let i = 0; i < resources.length; i++) {
            this.addCachedTexture(resources[i].url, resources[i].data);
        }
    }

    _onMaterialComplete() {
        if (this._loadingMaterial) {
            this.material.dispose();
            this.material = this._loadingMaterial;
            delete this._loadingMaterial;
        }
        this.setToRedraw(true);
    }

    _createIBLTextures() {
        const resource = this.getMap().getLightManager().getAmbientResource();
        if (this._iblTexes) {
            this._disposeIblTextures();
        }
        const regl = this.regl;
        this._iblTexes = {
            'prefilterMap': regl.cube({
                width: resource.prefilterMap.width,
                height: resource.prefilterMap.height,
                faces: resource.prefilterMap.faces,
                min: 'linear',
                mag: 'linear',
                format: 'rgba',
            }),
            'sh': resource.sh
        };
    }

    _updateMaterial() {
        const materialConfig = this.getSymbol().material;
        const material = {};
        let hasTexture = false;
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
                    hasTexture = true;
                } else {
                    material[p] = materialConfig[p];
                }
            }
        }
        if (!this.material) {
            this.material = new reshader.pbr.StandardMaterial(material);
            this.material.once('complete', this._bindOnMaterialComplete);
        } else {
            this._loadingMaterial = new reshader.pbr.StandardMaterial(material);
            this._loadingMaterial.once('complete', this._bindOnMaterialComplete);
        }

        if (!hasTexture) {
            this._onMaterialComplete();
        }
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
        const lightManager = this.getMap().getLightManager();
        const iblMaps = lightManager.getAmbientResource();
        const ambientLight = lightManager.getAmbientLight();
        const directionalLight = lightManager.getDirectionalLight();
        let uniforms;
        if (iblMaps) {
            if (!this._iblTexes) {
                this._createIBLTextures();
            }
            const iblTexes = this._iblTexes;
            const cubeSize = iblTexes.prefilterMap.width;
            const mipLevel = Math.log(cubeSize) / Math.log(2);
            uniforms = {
                'sSpecularPBR': iblTexes.prefilterMap,
                'uDiffuseSPH': iblTexes.sh,
                'uTextureEnvironmentSpecularPBRLodRange': [mipLevel, mipLevel],
                'uTextureEnvironmentSpecularPBRTextureSize': [cubeSize, cubeSize],
            };
        } else {
            uniforms = {
                'uAmbientColor': ambientLight.color || [0.2, 0.2, 0.2]
            };
        }
        uniforms['uEnvironmentExposure'] = isNumber(ambientLight.exposure) ? ambientLight.exposure : 1; //2]
        uniforms['sIntegrateBRDF'] = this._dfgLUT;

        if (directionalLight) {
            uniforms['uSketchfabLight0_diffuse'] = [...(directionalLight.color || [1, 1, 1]), 1];
            uniforms['uSketchfabLight0_viewDirection'] = directionalLight.direction || [1, 1, -1];
        }
        return uniforms;
    }

    _getDefines(shadowDefines) {
        const defines = {};
        defines['HAS_IBL_LIGHTING'] = 1;

        if (shadowDefines) {
            extend(defines, shadowDefines);
        }
        return defines;
    }

    _disposeIblTextures() {
        if (!this._iblTexes) {
            return;
        }
        for (const p in this._iblTexes) {
            if (this._iblTexes[p].destroy) {
                this._iblTexes[p].destroy();
            }
        }
        delete this._iblTexes;
    }

    shouldDeleteMeshOnUpdateSymbol() {
        return false;
    }
}

export default StandardPainter;
