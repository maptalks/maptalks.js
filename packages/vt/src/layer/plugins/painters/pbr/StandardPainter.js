import * as maptalks from 'maptalks';
import { reshader, mat4 } from '@maptalks/gl';
import { extend, hasOwn, isNil } from '../../Util';
import MeshPainter from '../MeshPainter';
import pickingVert from './glsl/mesh-picking.vert';
import pickingWGSLVert from './wgsl/mesh-picking.wgsl';

const { getPBRUniforms } = reshader.pbr.PBRUtils;

class StandardPainter extends MeshPainter {
    constructor(...args) {
        super(...args);
        this._loader = new reshader.ResourceLoader(null, this.layer.getURLModifier());
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

    isAnimating() {
        const uvOffsetAnim = this._getUVOffsetAnim();
        if (uvOffsetAnim && (uvOffsetAnim[0] || uvOffsetAnim[1])) {
            return true;
        }
    }

    needToRedraw() {
        const uvOffsetAnim = this._getUVOffsetAnim();
        if (uvOffsetAnim && (uvOffsetAnim[0] || uvOffsetAnim[1])) {
            return true;
        }
        return super.needToRedraw();
    }

    _getUVOffsetAnim() {
        const symbol = this.getSymbols()[0];
        return symbol.material && symbol.material.uvOffsetAnim;
    }

    createGeometry(glData) {
        if (!glData.data || !glData.data.aPosition || !glData.data.aPosition.length) {
            return null;
        }
        const desc = {
            uv0Attribute: 'aTexCoord0'
        };
        if (glData.data.aAltitude) {
            desc.altitudeAttribute = 'aAltitude';
        }
        const geometry = new reshader.Geometry(glData.data, glData.indices, 0, desc);
        extend(geometry.properties, glData.properties);
        if (glData.vertexColors) {
            geometry.properties.vertexColors = glData.vertexColors;
        }
        if (this.material.uniforms.normalTexture && !geometry.data[geometry.desc.tangentAttribute] && geometry.data[geometry.desc.uv0Attribute]) {
            if (!geometry.data[geometry.desc.normalAttribute]) {
                geometry.createNormal();
            }
            geometry.createTangent();
        }

        this._prepareFeatureIds(geometry, glData);
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
            this._updateDepthShader.dispose();
            delete this._updateDepthShader;
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
            // #2793
            // 上一帧如果开启了ssr，当前帧关闭ssr时，因为上一帧的ssr绘制到了ssr fbo里，这里必须要重新绘制
            if (!isSsr && this._previousSSR) {
                this.shader = shader;
                this.setToRedraw(true);
            }
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

        // const uvOffsetAnim = this._getUVOffsetAnim();
        // if (uvOffsetAnim && (uvOffsetAnim[0] || uvOffsetAnim[1])) {
        //     this.material.set('uvOffset', [0, 0]);
        // } else {
        //     const offset = this.getUVOffset(uvOffsetAnim);
        //     this.material.set('uvOffset', offset);
        // }
        this._previousSSR = isSsr;
    }

    updateSceneConfig(config) {
        extend(this.sceneConfig, config);
        this.setToRedraw();
    }


    delete() {
        super.delete();
        this.disposeIBLTextures();
        this.material.dispose();
        if (this._updateDepthShader) {
            this._updateDepthShader.dispose();
            delete this._updateDepthShader;
        }
    }



    init(context) {
        this.getMap().on('updatelights', this._onUpdatelights, this);
        this.createIBLTextures();
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
            vert: pickingVert,
            wgslVert: pickingWGSLVert,
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
                viewport: this.pickingViewport,
                depth: {
                    enable: true,
                    range: this.sceneConfig.depthRange || [0, 1],
                    func: this.sceneConfig.depthFunc || '<=',
                    mask: isNil(this.sceneConfig.depthMask) ? true : this.sceneConfig.depthMask
                }
            }
        };
        this.picking = [new reshader.FBORayPicking(this.renderer, pickingConfig, this.layer.getRenderer().pickingFBO, this.getMap())];

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
                enable: (_, props) => {
                    return !props.geometryProperties.hasNegativeHeight && (this.sceneConfig.cullFace === undefined || !!this.sceneConfig.cullFace);
                },
                face: () => {
                    return this.sceneConfig.cullFace || 'back';
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
                func: this.getBlendFunc(),
                equation: 'add'
            },
            polygonOffset: {
                enable: true,
                offset: this.getPolygonOffset()
            }
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
        if (config) {
            const symbolMaterial = this.getSymbols()[0].material;
            if (symbolMaterial) {
                extend(symbolMaterial, config);
            }
        }
        const isVectorTile = this.layer instanceof maptalks.TileLayer;
        const dataConfig = this.dataConfig;
        const materialConfig = config || this.getSymbols()[0].material;
        const material = {};
        let hasTexture = false;
        for (const p in materialConfig) {
            if (hasOwn(materialConfig, p)) {
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
                    texConf.flipY = !dataConfig.upsideUpTexture;
                    texConf.min = 'linear mipmap linear';
                    texConf.mag = 'linear';
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
                    if (p === 'uvRotation') {
                        material[p] = Math.PI * material[p] / 180;
                        if (!isVectorTile) {
                            material[p] *= -1;
                        }
                    }
                }
            }
        }
        if (material.alphaTest === undefined && this.getMaterialClazz) {
            material.alphaTest = 0.05;
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
        const { iblTexes, dfgLUT } = this.getIBLRes();
        const uniforms = getPBRUniforms(map, iblTexes, dfgLUT, context && context.ssr, context && context.jitter);
        this.setIncludeUniformValues(uniforms, context);
        return uniforms;
    }

    _getDefines(defines) {
        if (this.hasIBL()) {
            defines['HAS_IBL_LIGHTING'] = 1;
        } else {
            delete defines['HAS_IBL_LIGHTING'];
        }
        // defines['OUTPUT_NORMAL'] = 1;
        return defines;
    }

    _onUpdatelights() {
        if (!this.shader) {
            return;
        }
        const defines = this.shader.shaderDefines;
        this._getDefines(defines);
        this.shader.shaderDefines = defines;

    }
}

export default StandardPainter;

// function firstUpperCase(str) {
//     return str.charAt(0).toUpperCase() + str.substring(1);
// }
