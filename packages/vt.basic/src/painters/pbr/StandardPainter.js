import { reshader, mat4 } from '@maptalks/gl';
import { extend } from '../../Util';
import MeshPainter from '../MeshPainter';

const { createIBLTextures, disposeIBLTextures, getPBRUniforms } = reshader.pbr.PBRUtils;

class StandardPainter extends MeshPainter {
    constructor(...args) {
        super(...args);
        this._loader = new reshader.ResourceLoader();
        this.scene.sortFunction = this.sortByCommandKey;
    }

    createGeometry(glData) {
        const geometry = new reshader.Geometry(glData.data, glData.indices, 0, {
            uv0Attribute: 'aTexCoord0'
        });
        if (glData.properties) {
            extend(geometry.properties, glData.properties);
        }
        return geometry;
    }


    paint(context) {
        const hasShadow = !!context.shadow;
        if (context.states && context.states.includesChanged) {
            this._iblShader.dispose();
            this._noIblShader.dispose();
            delete this.shader;
            this._createShader(context);
        }
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
        this.regl.clear({
            color: [0, 0, 0, 0],
            framebuffer: context.ssr.depthTestFbo
        });
        this._depthShader.filter = context.sceneFilter;
        this.renderer.render(this._depthShader, this.getUniformValues(this.layer.getMap(), context), this.scene, context.ssr.depthTestFbo);
    }

    getShadowMeshes() {
        this._shadowCount = this.scene.getMeshes().length;
        const meshes = this.scene.getMeshes().filter(m => m.getUniform('level') === 0);
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            if (mesh.material !== this.material) {
                mesh.setMaterial(this.material);
            }
        }
        return meshes;
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
            ],
            extraCommandProps: {
                viewport: this.pickingViewport
            }
        };
        this.picking = new reshader.FBORayPicking(this.renderer, pickingConfig, this.layer.getRenderer().pickingFBO);

    }

    _updateLights(param) {
        if (param.ambientUpdate) {
            this._disposeIblTextures();
            this._iblTexes = createIBLTextures(this.regl, this.getMap());
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
        const defines = {};
        const uniformDeclares = [];
        this.fillIncludes(defines, uniformDeclares, context);
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
                },
                op: {
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
            blend: {
                enable: true,
                func: {
                    src: 'src alpha',
                    dst: 'one minus src alpha'
                },
                equation: 'add'
            },
            polygonOffset: this.getPolygonOffset()
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
            const defines1 = extend({}, defines);
            uniformDeclares.push(...reshader.SsrPass.getUniformDeclares());
            extend(defines1, reshader.SsrPass.getDefines());
            this._getDefines(defines1);
            this._ssrShader = new reshader.pbr.StandardShader({
                uniforms: uniformDeclares,
                defines: defines1,
                extraCommandProps
            });
            delete defines['HAS_IBL_LIGHTING'];
            this._noIblSsrShader = new reshader.pbr.StandardShader({
                uniforms: uniformDeclares,
                defines: defines1,
                extraCommandProps
            });

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
            if (this._loadingMaterial.isReady()) {
                this._onMaterialComplete();
            } else {
                this._loadingMaterial.once('complete', this._bindOnMaterialComplete);
            }

        }

        if (!hasTexture) {
            this._onMaterialComplete();
        }
    }

    getUniformValues(map, context) {
        if (!this._iblTexes) {
            this._iblTexes = createIBLTextures(this.regl, map);
        }
        const uniforms = getPBRUniforms(map, this._iblTexes, this._dfgLUT, context);
        this.setIncludeUniformValues(uniforms, context);
        return uniforms;
    }

    _getDefines(defines) {
        defines['HAS_IBL_LIGHTING'] = 1;
        return defines;
    }

    _disposeIblTextures() {
        if (!this._iblTexes) {
            return;
        }
        disposeIBLTextures(this._iblTexes);
        delete this._iblTexes;
    }
}

export default StandardPainter;
