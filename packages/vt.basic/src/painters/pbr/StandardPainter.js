import { reshader, mat4 } from '@maptalks/gl';
import { extend } from '../../Util';
import MeshPainter from '../MeshPainter';

const { getPBRUniforms } = reshader.pbr.PBRUtils;

const EMPTY_ARRAY = [];

class StandardPainter extends MeshPainter {
    constructor(...args) {
        super(...args);
        this._loader = new reshader.ResourceLoader();
        this.scene.sortFunction = this.sortByCommandKey;
    }

    supportRenderMode(mode) {
        // maptalks-studio#1120, 因为ssr有两种绘制模式，开启taa时会出现闪烁，
        if (this.getSymbols()[0].ssr) {
            return mode === 'fxaa' || mode === 'fxaaAfterTaa';
        } else {
            return super.supportRenderMode(mode);
        }
    }

    createGeometry(glData) {
        if (Array.isArray(glData)) {
            return glData.map(data => this.createGeometry(data));
        }
        const geometry = new reshader.Geometry(glData.data, glData.indices, 0, {
            uv0Attribute: 'aTexCoord0'
        });
        extend(geometry.properties, glData.properties);
        return {
            geometry,
            symbolIndex: { index: 0 }
        };
    }

    paint(context) {
        const hasShadow = !!context.shadow;
        if (context.states && context.states.includesChanged) {
            this.shader.dispose();
            delete this.shader;
            this._createShader(context);
        }
        let isSsr = !!context.ssr && this.getSymbols()[0].ssr;
        const shader = this.shader;
        const shaderDefines = shader.shaderDefines;
        if (isSsr) {
            const defines = extend({}, shaderDefines, context.ssr.defines);
            shader.shaderDefines = defines;
        }
        if (context.onlyUpdateDepthInTaa) {
            this.shader = this._updateDepthShader;
        }
        this.updateIBLDefines(shader);
        super.paint(context);
        if (this.shadowCount !== undefined && hasShadow) {
            const count = this.scene.getMeshes().length;
            if (this.shadowCount !== count) {
                this.setToRedraw();
            }
        }
        this.shader = shader;
        if (isSsr) {
            shader.shaderDefines = shaderDefines;
        }
        delete this.shadowCount;
    }

    getShadowMeshes() {
        if (!this.isVisible()) {
            return EMPTY_ARRAY;
        }
        this.shadowCount = this.scene.getMeshes().length;
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
        this.getMap().off('updatelights', this.onUpdatelights, this);
        super.delete();
        this.disposeIBLTextures();
        this.material.dispose();
        if (this._depthShader) {
            this._depthShader.dispose();
        }
        if (this.shader) {
            this.shader.dispose();
            delete this.shader;
        }
        if (this._updateDepthShader) {
            this._updateDepthShader.dispose();
            delete this._updateDepthShader;
        }
    }



    init(context) {
        this.getMap().on('updatelights', this.onUpdatelights, this);
        //保存context，updateSceneConfig时读取
        this._context = this._context || context;
        const regl = this.regl;
        this.renderer = new reshader.Renderer(regl);

        this._bindedOnTextureLoad = this._onTextureLoad.bind(this);
        this._bindDisposeCachedTexture = this.disposeCachedTexture.bind(this);
        this._bindOnMaterialComplete = this._onMaterialComplete.bind(this);

        this._updateMaterial();

        this._createShader(context);

        const pickingConfig = {
            vert: `
                attribute vec3 aPosition;
                uniform mat4 projViewModelMatrix;
                uniform mat4 positionMatrix;
                //引入fbo picking的vert相关函数
                #include <line_extrusion_vert>
                #include <get_output>
                #include <fbo_picking_vert>
                void main() {
                    mat4 localPositionMatrix = getPositionMatrix();
                    #ifdef IS_LINE_EXTRUSION
                        vec3 linePosition = getLineExtrudePosition(aPosition);
                        vec4 localVertex = getPosition(linePosition);
                    #else
                        vec4 localVertex = getPosition(aPosition);
                    #endif

                    gl_Position = projViewModelMatrix * localPositionMatrix * localVertex;
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
        this.picking = [new reshader.FBORayPicking(this.renderer, pickingConfig, this.layer.getRenderer().pickingFBO)];

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
        uniformDeclares.push(...reshader.SsrPass.getUniformDeclares());
        this.fillIncludes(defines, uniformDeclares, context);
        const extraCommandProps = {
            cull: {
                enable: () => {
                    return this.sceneConfig.cullFace === undefined || !!this.sceneConfig.cullFace;
                },
                face: this.sceneConfig.cullFace || 'back'
            },
            stencil: {
                enable: (_, props) => {
                    return props['hasAlpha'] === undefined || !!props['hasAlpha'];
                },
                func: {
                    cmp: '<=',
                    ref: (_, props) => {
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
                enable: (_, props) => {
                    return props['hasAlpha'] === undefined || !!props['hasAlpha'];
                },
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

        this.shader = new reshader.pbr.StandardShader(config);
        config.frag = `
            precision mediump float;
            #include <gl2_frag>
            void main() {
                glFragColor = vec4(0.0);
                #if __VERSION__ == 100
                    gl_FragColor = glFragColor;
                #endif
            }
        `;
        this._updateDepthShader = new reshader.pbr.StandardShader(config);
    }

    _onTextureLoad({ resources }) {
        for (let i = 0; i < resources.length; i++) {
            this.addCachedTexture(resources[i].url, resources[i].data);
        }
        this.setToRedraw(true);
    }

    _onMaterialComplete() {
        this.setToRedraw(true);
    }

    _updateMaterial(config) {
        const materialConfig = config || this.getSymbols()[0].material;
        const material = {};
        let hasTexture = false;
        for (const p in materialConfig) {
            if (materialConfig.hasOwnProperty(p)) {
                if (p.indexOf('Texture') > 0) {
                    //纹理图片
                    let texConf = materialConfig[p];
                    if (!texConf) {
                        material[p] = undefined;
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
            for (let p in material) {
                this.material.set(p, material[p]);
            }
            this.setToRedraw(true);
        }

        if (!hasTexture) {
            this._onMaterialComplete();
        }
    }

    getShader() {
        return this.shader;
    }

    getUniformValues(map, context) {
        if (!this.iblTexes) {
            this.createIBLTextures();
        }
        const uniforms = getPBRUniforms(map, this.iblTexes, this.dfgLUT, context);
        this.setIncludeUniformValues(uniforms, context);
        return uniforms;
    }

    _getDefines(defines) {
        defines['HAS_IBL_LIGHTING'] = 1;
        return defines;
    }
}

export default StandardPainter;

// function firstUpperCase(str) {
//     return str.charAt(0).toUpperCase() + str.substring(1);
// }
