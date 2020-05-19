import { mat4 } from 'gl-matrix';
import * as reshader from '@maptalks/reshader.gl';
import { getGroundTransform } from './util/util';
import fillVert from './glsl/fill.vert';
import fillFrag from './glsl/fill.frag';
import ShadowProcess from './shadow/ShadowProcess';
import { extend } from './util/util.js';

const { createIBLTextures, disposeIBLTextures, getPBRUniforms } = reshader.pbr.PBRUtils;
const TEX_SIZE = 128 / 256; //maptalks/vector-packer，考虑把默认值弄成一个单独的项目

class GroundPainter {
    constructor(regl, layer) {
        this._regl = regl;
        this.renderer = new reshader.Renderer(regl);
        this._layer = layer;
        this._loader = new reshader.ResourceLoader();
        this._bindOnMaterialComplete = this._onMaterialComplete.bind(this);
        this._init();
    }

    getMap() {
        return this._layer && this._layer.getMap();
    }

    getSymbol() {
        const sceneConfig = this._layer._getSceneConfig();
        return sceneConfig && sceneConfig.ground && sceneConfig.ground.symbol;
    }

    isEnable() {
        const sceneConfig = this._layer._getSceneConfig();
        return sceneConfig && sceneConfig.ground && sceneConfig.ground.enable;
    }

    paint(context) {
        if (!this.isEnable()) {
            return;
        }
        const defines = this._getGroundDefines(context);
        this._ground.setDefines(defines);
        if (this._ground.material !== this.material) {
            this._ground.setMaterial(this.material);
        }
        const shader = this._getShader();
        this._transformGround();
        const uniforms = this._getUniformValues(context);
        const fbo = context && context.renderTarget && context.renderTarget.fbo;
        const isSSR = this._layer.getRenderer().isEnableSSR();
        if (shader === this._fillShader && (!isSSR || !context || !context.ssr)) {
            //如果是drawSSR阶段不绘制fill ground，fuzhenn/maptalks-studio#461
            this.renderer.render(shader, uniforms, this._groundScene, fbo);
            this._layer.getRenderer().setCanvasUpdated();
            return;
        }

        if (isSSR && defines && defines['HAS_SSR']) {
            if (context && context.ssr) {
                const ssrFbo = context && context.ssr.fbo;
                this.renderer.render(shader, uniforms, this._groundScene, ssrFbo);
            } else {
                //如果图层开启ssr且context没有ssr时，说明不是后处理阶段，只需绘制深度纹理即可
                this.renderer.render(this._depthShader, uniforms, this._groundScene, fbo);
            }
        } else if (!context || !context.ssr) {
            //context中有ssr时，说明是drawSSR阶段，此时什么都不用绘制
            this.renderer.render(shader, uniforms, this._groundScene, fbo);
        }
        this._layer.getRenderer().setCanvasUpdated();
    }

    update() {
        const sceneConfig = this._layer._getSceneConfig();
        if (!sceneConfig) {
            return;
        }
        const symbol = sceneConfig.ground && sceneConfig.ground.symbol;
        if (!symbol) {
            this._polygonFill = [1, 1, 1, 1];
            this._polygonOpacity = 1;
            if (this._polygonPatternFile) {
                this._polygonPatternFile.destroy();
                delete this._polygonPatternFile;
            }
        } else {
            this._polygonFill = this._parseColor(symbol['polygonFill'] || [1, 1, 1, 1]);
            this._polygonOpacity = symbol['polygonOpacity'] === undefined ? 1 : symbol['polygonOpacity'];
            const polygonPatternFile = symbol.polygonPatternFile;
            if (polygonPatternFile) {
                if (!this._polygonPatternFile || this._polygonPatternFile['_pattern_src'] !== polygonPatternFile) {
                    const image = new Image();
                    image.onload = () => {
                        if (this._polygonPatternFile) {
                            this._polygonPatternFile.destroy();
                        }
                        this._polygonPatternFile = this._createPatternTexture(image);
                        this._polygonPatternFile['_pattern_src'] = polygonPatternFile;
                    };
                    image.src = polygonPatternFile;
                }
            } else if (this._polygonPatternFile) {
                this._polygonPatternFile.destroy();
                delete this._polygonPatternFile;
            }
        }
        this._updateMaterial();
    }

    setToRedraw() {
        const renderer = this._layer.getRenderer();
        renderer.setToRedraw();
    }

    dispose() {
        if (this.material) {
            this.material.dispose();
            delete this.material;
        }
        if (this._ground) {
            this._ground.geometry.dispose();
            if (this._ground.material) {
                this._ground.material.dispose();
            }
            this._ground.dispose();
            delete this._ground;
        }
        if (this._polygonPatternFile) {
            this._polygonPatternFile.destroy();
            delete this._polygonPatternFile;
        }
        if (this._fillShader) {
            this._fillShader.dispose();
            delete this._fillShader;
        }
        if (this._standardShader) {
            this._standardShader.dispose();
            delete this._standardShader;
        }
        this._disposeIblTextures();
        if (this._dfgLUT) {
            this._dfgLUT.destroy();
            delete this._dfgLUT;
        }
    }

    _getShader() {
        const sceneConfig = this._layer._getSceneConfig();
        const groundConfig = sceneConfig.ground;
        if (!groundConfig || !groundConfig.renderPlugin) {
            return this._fillShader;
        }
        const type = groundConfig.renderPlugin.type;
        if (type === 'lit') {
            return this._standardShader;
        } else if (type === 'fill') {
            return this._fillShader;
        } else {
            throw new Error('unsupported render plugin of ' + type + ' for layer ground');
        }
    }

    _getUniformValues(context) {
        const uniforms = this._getCommonUniforms(context);
        uniforms.polygonFill = this._polygonFill;
        uniforms.polygonOpacity = this._polygonOpacity;
        const shader = this._getShader();
        if (shader === this._fillShader && this._polygonPatternFile) {
            uniforms.polygonPatternFile = this._polygonPatternFile;
        }
        return uniforms;
    }

    _getCommonUniforms(context) {
        if (!this._iblTexes) {
            this._iblTexes = createIBLTextures(this._regl, this.getMap());
        }
        const uniforms = getPBRUniforms(this.getMap(), this._iblTexes, this._dfgLUT, context);
        this._setIncludeUniformValues(uniforms, context);
        return uniforms;
    }

    _setIncludeUniformValues(uniforms, context) {
        const includes = context && context.includes;
        if (includes) {
            for (const p in includes) {
                if (includes[p]) {
                    if (context[p].renderUniforms) {
                        extend(uniforms, context[p].renderUniforms);
                    }
                }
            }
        }
    }

    _disposeIblTextures() {
        if (!this._iblTexes) {
            return;
        }
        disposeIBLTextures(this._iblTexes);
        delete this._iblTexes;
    }

    _init() {
        this.getMap().on('updatelights', this._updateLights, this);
        //fill shader
        const extraCommandProps = this._getExtraCommandProps();
        const fillUniforms = ShadowProcess.getUniformDeclares();
        fillUniforms.push(
            'polygonFill',
            'polygonOpacity',
            'polygonPatternFile',
            {
                name: 'projViewModelMatrix',
                type: 'function',
                fn: function (context, props) {
                    return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                }
            }
        );
        this._fillShader = new reshader.MeshShader({
            vert: fillVert,
            frag: fillFrag,
            uniforms: fillUniforms,
            extraCommandProps
        });
        //standard shader
        const uniforms = ShadowProcess.getUniformDeclares();
        uniforms.push(...reshader.SsrPass.getUniformDeclares());
        uniforms.push('polygonFill', 'polygonOpacity');
        this._standardShader = new reshader.pbr.StandardShader({
            uniforms,
            extraCommandProps
        });

        extraCommandProps.colorMask = [false, false, false, false];
        this._depthShader = new reshader.pbr.StandardDepthShader({
            extraCommandProps
        });

        this._createGround();
        this._dfgLUT = reshader.pbr.PBRHelper.generateDFGLUT(this._regl);
        this.update();
    }

    _getExtraCommandProps() {
        const canvas = this._layer.getRenderer().canvas;
        return {
            viewport: {
                x: 0,
                y: 0,
                width: () => {
                    return canvas.width;
                },
                height: () => {
                    return canvas.height;
                }
            },
            depth: {
                enable: true,
                mask: () => {
                    const sceneConfig = this._layer._getSceneConfig();
                    const ground = sceneConfig.ground;
                    return ground.depth || ground.depth === undefined;
                },
                // range: () => {
                //     const ground = sceneConfig.ground;
                //     return !!ground && !!ground.depth ? [0, 1] : [1, 1];
                // },
                //如果设成'<'，会有低级别下地面消失的问题，fuzhenn/maptalks-studio#460
                func: '<='
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
                enable: true,
                offset: {
                    factor: () => { return 1; },
                    units: () => { return 4; }
                }
            }
        };
    }

    _hasIBL() {
        const lightManager = this.getMap().getLightManager();
        const resource = lightManager.getAmbientResource();
        return !!resource;
    }

    _createGround() {
        const planeGeo = new reshader.Plane();
        planeGeo.generateBuffers(this.renderer.regl);
        planeGeo.data.aTexCoord = new Float32Array(8);
        //TODO 还需要构造 tangent
        this._ground = new reshader.Mesh(planeGeo);
        this._groundScene = new reshader.Scene([this._ground]);
    }

    _transformGround() {
        const map = this.getMap();
        const localTransform = getGroundTransform(this._ground.localTransform, map);
        this._ground.setLocalTransform(localTransform);

        const extent = map['_get2DExtent'](map.getGLZoom());
        const width = extent.getWidth();
        const height = extent.getHeight();
        const center = map.cameraLookAt;
        const xmin = center[0] - width;
        const ymax = center[1] + height;

        const uvStartX = (xmin / TEX_SIZE) % 1;
        const uvStartY = (ymax / TEX_SIZE) % 1;
        const w = extent.getWidth() / TEX_SIZE * 2;
        const h = extent.getHeight() / TEX_SIZE * 2;

        const uv = this._ground.geometry.data.aTexCoord;
        uv[0] = uvStartX;
        uv[1] = uvStartY - h;
        uv[2] = uvStartX + w;
        uv[3] = uvStartY - h;
        uv[4] = uvStartX;
        uv[5] = uvStartY;
        uv[6] = uvStartX + w;
        uv[7] = uvStartY;
    }

    _getGroundDefines(context) {
        if (!this._defines) {
            this._defines = {};
        }
        const defines = this._defines;
        const sceneConfig = this._layer._getSceneConfig();

        function update(has, name) {
            if (has) {
                if (!defines[name]) {
                    defines[name] = 1;
                }
            } else if (defines[name]) {
                delete defines[name];
            }
        }
        update(this._hasIBL(), 'HAS_IBL_LIGHTING');
        const hasSSR = context && context.ssr && sceneConfig.ground && sceneConfig.ground.symbol && sceneConfig.ground.symbol.ssr;
        update(hasSSR, 'HAS_SSR');
        const hasShadow = context && sceneConfig.shadow && sceneConfig.shadow.enable;
        update(hasShadow, 'HAS_SHADOWING');
        update(hasShadow, 'USE_ESM');
        const hasPattern = !!this._polygonPatternFile;
        update(hasPattern, 'HAS_PATTERN');
        const hasSSAO = context && context.ssao;
        update(hasSSAO, 'HAS_SSAO');
        return defines;
    }

    _updateMaterial() {
        const materialConfig = this.getSymbol() && this.getSymbol().material;
        if (!materialConfig) {
            return;
        }
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
                    texConf = typeof texConf === 'string' ? {
                        url: texConf,
                        wrap: 'repeat',
                    } : texConf;
                    texConf.flipY = true;
                    texConf.min = 'linear';
                    texConf.mag = 'linear';
                    // texConf.aniso = 4;
                    material[p] = new reshader.Texture2D(texConf, this._loader);
                    hasTexture = true;
                } else {
                    material[p] = materialConfig[p];
                }
            }
        }
        if (!this.material) {
            this.material = new reshader.pbr.StandardMaterial(material);
            this.material.once('complete', this._bindOnMaterialComplete, this);
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

    _onMaterialComplete() {
        if (this._loadingMaterial) {
            this.material.dispose();
            this.material = this._loadingMaterial;
            delete this._loadingMaterial;
        }
        this.setToRedraw(true);
    }

    _createPatternTexture(image) {
        const regl = this._regl;
        const config = {
            width: image.width,
            height: image.height,
            data: image,
            mag: 'linear',
            min: 'linear',
            flipY: false,
            wrap: 'repeat'
        };
        return regl.texture(config);
    }

    _updateLights(param) {
        if (param.ambientUpdate) {
            this._disposeIblTextures();
            this._iblTexes = createIBLTextures(this._regl, this.getMap());
        }
        this.setToRedraw();
    }

    _parseColor(c) {
        if (Array.isArray(c)) {
            if (c.length === 3) {
                c.push(1);
            }
            return c;
        }
        return c;
    }
}

export default GroundPainter;
