import { mat4 } from 'gl-matrix';
import * as reshader from '@maptalks/reshader.gl';
import fillVert from './glsl/fill.vert';
import fillFrag from './glsl/fill.frag';
import ShadowProcess from './shadow/ShadowProcess';
import { extend, getGroundTransform, hasOwn } from './util/util.js';

const { createIBLTextures, disposeIBLTextures, getPBRUniforms } = reshader.pbr.PBRUtils;
const TEX_SIZE_W = 128 / 256; //maptalks/vector-packer，考虑把默认值弄成一个单独的项目
const TEX_SIZE_H = 128 / 256;
const DEFAULT_TEX_OFFSET = [0, 0];
const DEFAULT_TEX_SCALE = [1, 1];

class GroundPainter {
    static getGroundTransform(out, map) {
        return getGroundTransform(out, map);
    }

    constructor(regl, layer) {
        this._regl = regl;
        this.renderer = new reshader.Renderer(regl);
        this._layer = layer;
        this._loader = new reshader.ResourceLoader();
        this._bindOnMaterialComplete = this._onMaterialComplete.bind(this);
        this._init();
    }

    needToRedraw() {
        const uvOffsetAnim = this._getUVOffsetAnim();
        return uvOffsetAnim && (uvOffsetAnim[0] || uvOffsetAnim[1]);
    }

    getMap() {
        return this._layer && this._layer.getMap();
    }

    getSymbol() {
        const ground = this._layer.getGroundConfig();
        return ground && ground.symbol;
    }

    isEnable() {
        const ground = this._layer.getGroundConfig();
        return ground && ground.enable;
    }

    paint(context) {
        if (!this.isEnable()) {
            return false;
        }
        const shader = this._getShader();
        if (this._isInSSRPhase(context) && shader === this._fillShader) {
            return false;
        }
        const defines = this._getGroundDefines(context);
        if (defines) {
            this._ground.setDefines(defines);
        }
        if (this._ground.material !== this.material) {
            this._ground.setMaterial(this.material);
        }
        const groundConfig = this._layer.getGroundConfig();
        const symbol = groundConfig && groundConfig.symbol;
        if (symbol.ssr) {
            this._ground.ssr = 1;
        } else {
            this._ground.ssr = 0;
        }
        this._transformGround();
        const uniforms = this._getUniformValues(context);
        uniforms['offsetFactor'] = context.offsetFactor;
        uniforms['offsetUnits'] = context.offsetUnits;
        const fbo = context && context.renderTarget && context.renderTarget.fbo;
        if (shader === this._fillShader) {
            //如果是drawSSR阶段不绘制fill ground，fuzhenn/maptalks-studio#461
            this.renderer.render(shader, uniforms, this._groundScene, fbo);
            this._layer.getRenderer().setCanvasUpdated();
            return true;
        }
        shader.filter = context.sceneFilter;
        this.renderer.render(shader, uniforms, this._groundScene, fbo);
        this._layer.getRenderer().setCanvasUpdated();
        return true;
    }

    _isInSSRPhase(context) {
        const enableSSR = this._layer.getRenderer().isEnableSSR && this._layer.getRenderer().isEnableSSR();
        if (!enableSSR) {
            return false;
        }
        return !!(context && context.ssr);
    }

    update() {
        const groundConfig = this._layer.getGroundConfig();
        if (!groundConfig) {
            return;
        }
        const symbol = groundConfig && groundConfig.symbol;
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
        if (!renderer) {
            return;
        }
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
        const map = this.getMap();
        if (map) {
            map.off('updatelights', this._updateLights, this);
        }
    }

    _getShader() {
        const groundConfig = this._layer.getGroundConfig();
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
        const groundConfig = this._layer.getGroundConfig();
        const type = groundConfig.renderPlugin.type;
        let uniforms;
        if (type === 'lit') {
            if (!this._iblTexes) {
                this._iblTexes = createIBLTextures(this._regl, this.getMap());
            }
            uniforms = getPBRUniforms(this.getMap(), this._iblTexes, this._dfgLUT, context && context.ssr, context && context.jitter);
        } else {
            const map = this.getMap();
            uniforms = {
                projViewMatrix: map.projViewMatrix
            };
        }
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
        const projViewModelMatrix = [];
        fillUniforms.push(
            {
                name: 'projViewModelMatrix',
                type: 'function',
                fn: function (context, props) {
                    return mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
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
        this._standardShader = new reshader.pbr.StandardShader({
            uniforms,
            extraCommandProps
        });

        this._createGround();
        this._dfgLUT = reshader.pbr.PBRHelper.generateDFGLUT(this._regl);
        this.update();
    }

    _getExtraCommandProps() {
        const defaultRange = [0, 1];
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
                    const ground = this._layer.getGroundConfig();
                    return ground.depth || ground.depth === undefined;
                },
                range: () => {
                    const groundConfig = this._layer.getGroundConfig();
                    const groundSceneConfig = groundConfig && groundConfig.renderPlugin.sceneConfig;
                    return groundSceneConfig && groundSceneConfig['depthRange'] || defaultRange;
                },
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
                    factor: (context, props) => {
                        return props['offsetFactor'];
                    },
                    units: (context, props) => {
                        return props['offsetUnits'];
                    }
                }
            }
        };
    }

    _hasIBL() {
        const lightManager = this.getMap().getLightManager();
        const resource = lightManager && lightManager.getAmbientResource();
        return !!resource;
    }

    _createGround() {
        const planeGeo = new reshader.Plane();
        planeGeo.data.aTexCoord = new Uint8Array(
            [0, 1, 1, 1, 0, 0, 1, 0]
        );
        planeGeo.createTangent();
        planeGeo.generateBuffers(this.renderer.regl);

        //TODO 还需要构造 tangent
        this._ground = new reshader.Mesh(planeGeo, null, { castShadow: false });
        const defines = this._standardShader.getGeometryDefines(planeGeo);
        this._ground.setDefines(defines);
        this._groundScene = new reshader.Scene([this._ground]);
    }

    _transformGround() {
        const map = this.getMap();
        const localTransform = GroundPainter.getGroundTransform(this._ground.localTransform, map);
        this._ground.setLocalTransform(localTransform);

        const extent = map['_get2DExtentAtRes'](map.getGLRes());
        const width = extent.getWidth();
        const height = extent.getHeight();
        const center = map.cameraLookAt;
        const xmin = center[0] - width;
        const ymax = center[1] + height;

        let offset = this.material && this.material.get('uvOffset') || DEFAULT_TEX_OFFSET;
        offset[0] = offset[0] || 0;
        offset[1] = offset[1] || 0;
        const uvOffsetAnim = this._getUVOffsetAnim();
        const hasNoise = this.material && this.material.get('noiseTexture');
        const hasUVAnim = uvOffsetAnim && (uvOffsetAnim[0] || uvOffsetAnim[1]);
        if (hasUVAnim) {
            offset = [offset[0], offset[1]];
            const timeStamp = performance.now();
            // 256 是noiseTexture的高宽，乘以256可以保证动画首尾平滑过渡，不会出现跳跃
            const speed = hasNoise ? 50000 : 1000;
            const scale = (hasNoise ? 256 : 1);
            if (uvOffsetAnim[0]) {
                offset[0] = ((timeStamp * uvOffsetAnim[0]) % speed) / speed * scale;
            }
            if (uvOffsetAnim[1]) {
                offset[1] = ((timeStamp * uvOffsetAnim[1]) % speed) / speed * scale;
            }

        }
        const scale = this.material && this.material.get('uvScale') || DEFAULT_TEX_SCALE;
        const texWidth = TEX_SIZE_W / scale[0];
        const texHeight = TEX_SIZE_H / scale[1];
        const w = extent.getWidth() / texWidth * 2;
        const h = extent.getHeight() / texHeight * 2;
        this._ground.setUniform('uvScale', [w, -h]);
        if (hasUVAnim && hasNoise) {
            // 打开纹理随机分布时，地面的uv动画通过把offset值计入uvOrigin来实现的
            const origin = [xmin - (uvOffsetAnim[0] ? offset[0] : 0), ymax + (uvOffsetAnim[1] ? offset[1] : 0)];
            const uvStartX = (origin[0] / texWidth) % 1;
            const uvStartY = (origin[1] / texHeight) % 1;
            const uvOrigin = [origin[0] / texWidth - uvStartX, origin[1] / texHeight - uvStartY];
            // 如果坐标轴上有uvOffsetAnim，则把offset设为0，因为origin中已经计入了offset
            // 如果没有uvOffsetAnim，则直接采用uvOffset的值
            this._ground.setUniform('uvOffset', [
                uvStartX + (uvOffsetAnim[0] ? 0 : offset[0]),
                uvStartY + (uvOffsetAnim[1] ? 0 : offset[1])
            ]);
            this._ground.setUniform('uvOrigin', uvOrigin);
        } else {
            const uvStartX = (xmin / texWidth) % 1;
            const uvStartY = (ymax / texHeight) % 1;
            const uvOrigin = [xmin / texWidth - uvStartX, ymax / texHeight - uvStartY];
            this._ground.setUniform('uvOffset', [uvStartX + offset[0], uvStartY + offset[1]]);
            this._ground.setUniform('uvOrigin', uvOrigin);
        }

    }

    _getGroundDefines(context) {
        let updated = false;
        const defines = this._ground.defines;
        const sceneConfig = this._layer._getSceneConfig && this._layer._getSceneConfig();
        const groundConfig = this._layer.getGroundConfig();

        function update(has, name) {
            if (has) {
                if (!defines[name]) {
                    defines[name] = 1;
                    updated = true;
                }
            } else if (defines[name]) {
                delete defines[name];
                updated = true;
            }
        }
        update(this._hasIBL(), 'HAS_IBL_LIGHTING');
        const hasSSR = context && context.ssr && groundConfig && groundConfig.symbol && groundConfig.symbol.ssr;
        update(hasSSR, 'HAS_SSR');
        const hasShadow = context && sceneConfig && sceneConfig.shadow && sceneConfig.shadow.enable;
        update(hasShadow, 'HAS_SHADOWING');
        update(hasShadow, 'USE_ESM');
        const hasPattern = !!this._polygonPatternFile;
        update(hasPattern, 'HAS_PATTERN');
        const hasSSAO = context && context.ssao;
        update(hasSSAO, 'HAS_SSAO');
        if (!updated) {
            return null;
        }
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
            if (hasOwn(materialConfig, p)) {
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
                    texConf.flipY = true;
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
            const map = this.getMap();
            if (map) {
                this._iblTexes = createIBLTextures(this._regl, map);
            }
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

    _getUVOffsetAnim() {
        return this.material && this.material.get('uvOffsetAnim');
    }

    getRenderMeshes() {
        return this._groundScene.getMeshes();
    }
}

export default GroundPainter;
