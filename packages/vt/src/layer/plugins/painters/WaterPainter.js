import BasicPainter from './BasicPainter';
import { reshader, mat3, mat4, vec4, GroundPainter } from '@maptalks/gl';
import waterVert from './glsl/water.vert';
import waterFrag from './glsl/water.frag';
import pickingVert from './glsl/fill.picking.vert';
import { extend } from '../Util';

const { getPBRUniforms } = reshader.pbr.PBRUtils;

const DEFAULT_DIR_LIGHT = {
    color: [2.0303, 2.0280, 2.0280],
    // direction: [-0.9617, -0.2717, 0.0347]
    direction: [0.0, -0.2717, -1]
};

const TIME_NOISE_TEXTURE_REPEAT = 0.3737;
const SYMBOL_INDEX = { index: 0 };
const EMPTY_HSV = [0, 0, 0];
const WATER_UV_SIZE = [2, 2];

const frag = `
    #define SHADER_NAME WATER_STENCIL
    precision mediump float;
    void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
`;

class WaterPainter extends BasicPainter {
    supportRenderMode(mode) {
        return mode === 'fxaa' || mode === 'fxaaBeforeTaa';
    }

    needPolygonOffset() {
        return true;
    }

    isTerrainSkin() {
        return false;
    }

    isTerrainVector() {
        return true;
    }

    needToRedraw() {
        if (super.needToRedraw()) {
            return true;
        }
        const symbol = this.getSymbol(SYMBOL_INDEX);
        return symbol.animation;
    }

    createMesh(geo, transform) {
        const { geometry } = geo;
        geometry.generateBuffers(this.regl);
        // const material = new reshader.Material(uniforms, DEFAULT_UNIFORMS);
        const mesh = new reshader.Mesh(geometry, null, {
            castShadow: false,
            picking: true
        });
        mesh.properties.symbolIndex = SYMBOL_INDEX;
        mesh.setLocalTransform(transform);
        return mesh;
    }

    callShader(uniforms, context) {
        super.callShader(uniforms, context);
        this.transformWater();
        const waterUniforms = this._getWaterUniform(this.getMap(), context);
        this._drawCount += this.renderer.render(this._waterShader, waterUniforms, this._waterScene, this.getRenderFBO(context));
    }

    addMesh(mesh, progress) {
        this._prepareMesh(mesh, progress);
        super.addMesh(...arguments);
    }

    _prepareMesh(mesh) {
        //在这里更新ssr，以免symbol中ssr发生变化时，uniform值却没有发生变化, fuzhenn/maptalks-studio#462
        const hasSSR = this.getSymbol(SYMBOL_INDEX).ssr;
        for (let i = 0; i < mesh.length; i++) {
            if (hasSSR) {
                mesh[i].ssr = 1;
            } else {
                mesh[i].ssr = 0;
            }
        }
    }

    paint(context) {
        if (context.states && context.states.includesChanged) {
            this.shader.dispose();
            this._waterShader.dispose();
            this._createShader(context);
        }
        const isSsr = !!context.ssr && this.getSymbol(SYMBOL_INDEX).ssr;
        const shader = this._waterShader;
        const shaderDefines = shader.shaderDefines;
        if (isSsr) {
            const defines = extend({}, shaderDefines, context.ssr.defines);
            shader.shaderDefines = defines;
        }
        this.updateIBLDefines(shader);
        if (isSsr) {
            this._water.ssr = 1;
        } else {
            this._water.ssr = 0;
        }
        super.paint(context);
        if (isSsr) {
            shader.shaderDefines = shaderDefines;
        }
    }

    isEnableTileStencil() {
        // water的绘制比较特殊，是通过先绘制water部分的stencil，再统一绘制water效果实现的，所以不能开启tile stencil
        return false;
    }

    init(context) {
        this.createIBLTextures();
        const regl = this.regl;


        this.renderer = new reshader.Renderer(regl);

        this.createGround();
        this._createShader(context);

        if (this.pickingFBO) {
            this.picking = [new reshader.FBORayPicking(
                this.renderer,
                {
                    vert: pickingVert,
                    uniforms: [
                        {
                            name: 'projViewModelMatrix',
                            type: 'function',
                            fn: function (context, props) {
                                const projViewModelMatrix = [];
                                mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                                return projViewModelMatrix;
                            }
                        }
                    ],
                    extraCommandProps: {
                        viewport: this.pickingViewport
                    }
                },
                this.pickingFBO,
                this.getMap()
            )];
        }
        this._loadTextures();
    }

    _loadTextures() {
        const regl = this.regl;
        if (!this._emptyTex) {
            this._emptyTex = regl.texture(2);
        }
        const urlModifier = this.layer.getURLModifier();

        const symbol = this.getSymbol({ index: 0 });
        const normalUrl = symbol['texWaveNormal'];
        const cachedNormalData = this.getCachedTexture(normalUrl);
        const self = this;

        if (cachedNormalData) {
            if (!this._normalTex) {
                if (!cachedNormalData.isLoading) {
                    this._normalTex = this._createTex(regl, cachedNormalData);
                } else {
                    setTimeout(() => {
                        if (!this.shader) {
                            return;
                        }
                        this._loadTextures();
                    }, 20);
                }
            }
        } else {
            const img = new Image();
            img.isLoading = true;
            img.onload = function () {
                delete this.isLoading;
                self._normalTex = self._createTex(regl, this);
                self.setToRedraw();
            };
            img.onerror = () => {
                console.error('invalid water wave normal texture:' + normalUrl);
            };
            this.addCachedTexture(normalUrl, img);
            img.src = urlModifier && urlModifier(normalUrl) || normalUrl;
        }

        const pertUrl = symbol['texWavePerturbation'];
        const cachedPertData = this.getCachedTexture(pertUrl);

        if (cachedPertData) {
            if (!this._pertTex) {
                if (!cachedPertData.isLoading) {
                    this._pertTex = this._createTex(regl, cachedPertData);
                } else {
                    setTimeout(() => {
                        this._loadTextures();
                        if (!this.shader) {
                            return;
                        }
                    }, 20);
                }
            }

        } else {
            const img = new Image();
            img.isLoading = true;
            img.onload = function () {
                delete this.isLoading;
                self._pertTex = self._createTex(regl, this);
                self.setToRedraw();
            };
            img.onerror = () => {
                console.error('invalid water wave perturbation texture:' + pertUrl);
            };
            this.addCachedTexture(pertUrl, img);
            img.src = urlModifier && urlModifier(pertUrl) || pertUrl;
        }
    }

    _createTex(regl, data) {
        if (!this._emptyTex) {
            return null;
        }
        return regl.texture({
            width: data.width,
            height: data.height,
            mag: 'linear',
            min: 'linear mipmap linear',
            wrapS: 'repeat',
            wrapT: 'repeat',
            flipY: true,
            data: data
        });
    }

    _createShader(context) {
        const canvas = this.canvas;
        const environmentTransform = [];
        const uniforms = [
            {
                name: 'projViewModelMatrix',
                type: 'function',
                fn: function (context, props) {
                    const projViewModelMatrix = [];
                    mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                    return projViewModelMatrix;
                }
            },
            {
                name: 'modelViewNormalMatrix',
                type: 'function',
                fn: (context, props) => {
                    const modelView = mat4.multiply([], props['viewMatrix'], props['modelMatrix']);
                    const inverted = mat4.invert(modelView, modelView);
                    const transposed = mat4.transpose(inverted, inverted);
                    return mat3.fromMat4([], transposed);
                    // const modelView = mat4.multiply([], props['viewMatrix'], props['modelMatrix']);
                    // return mat3.fromMat4([], modelView);
                }
            },
            {
                name: 'modelViewMatrix',
                type: 'function',
                fn: (context, props) => {
                    return mat4.multiply([], props['viewMatrix'], props['modelMatrix']);
                }
            },
            {
                name: 'environmentTransform',
                type: 'function',
                fn: (_, props) => {
                    const orientation = props['environmentOrientation'] || 0;
                    return mat3.fromRotation(environmentTransform, Math.PI * orientation / 180);
                }
            }
        ];
        const defines = {
            'TIME_NOISE_TEXTURE_REPEAT': TIME_NOISE_TEXTURE_REPEAT
        };
        this.fillIncludes(defines, uniforms, context);
        const viewport = {
            x: 0,
            y: 0,
            width: () => {
                return canvas ? canvas.width : 1;
            },
            height: () => {
                return canvas ? canvas.height : 1;
            }
        };
        const depthRange = this.sceneConfig.depthRange;
        this.shader = new reshader.MeshShader({
            vert: `
                attribute vec3 aPosition;

                uniform mat4 projViewModelMatrix;

                void main() {
                    gl_Position = projViewModelMatrix * vec4(aPosition, 1.);
                }
            `,
            frag,
            uniforms: [
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        const projViewModelMatrix = [];
                        mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                        return projViewModelMatrix;
                    }
                }
            ],
            extraCommandProps: {
                viewport,
                colorMask: [false, false, false, false],
                stencil: {
                    enable: true,
                    mask: 0xFF,
                    func: {
                        cmp: '<=',
                        ref: 0xFE,
                        mask: 0xFF
                    },
                    op: {
                        fail: 'keep',
                        zfail: 'keep',
                        zpass: 'replace'
                    }
                },
                depth: {
                    enable: true,
                    range: depthRange || [0, 1],
                    func: this.sceneConfig.depthFunc || '<='
                },
                polygonOffset: {
                    enable: true,
                    offset: this.getPolygonOffset()
                }
            }
        });
        const extraCommandProps = {
            viewport,
            stencil: {
                enable: true,
                mask: 0xFF,
                func: {
                    cmp: '==',
                    ref: 0xFE,
                    mask: 0xFF
                },
                op: {
                    fail: 'keep',
                    zfail: 'keep',
                    zpass: 'replace'
                }
            },
            depth: {
                enable: false
            }
        };
        uniforms.push(...reshader.SsrPass.getUniformDeclares());
        this._waterShader = new reshader.MeshShader({
            vert: waterVert,
            frag: waterFrag,
            defines,
            uniforms,
            extraCommandProps
        });
    }

    getUniformValues(map) {
        const uniforms = {
            projViewMatrix: map.projViewMatrix,
        };
        return uniforms;
    }

    _getWaterUniform(map, context) {
        const { iblTexes, dfgLUT } = this.getIBLRes();
        const uniforms = getPBRUniforms(map, iblTexes, dfgLUT, context && context.ssr, context && context.jitter);
        const lightManager = map.getLightManager();
        let directionalLight = lightManager && lightManager.getDirectionalLight() || {};
        const ambientLight = lightManager && lightManager.getAmbientLight() || {};
        const symbol = this.getSymbol(SYMBOL_INDEX);
        const waterDir = this._waterDir = this._waterDir || [];
        const waveParams = this._waveParams = this._waveParams || [];
        vec4.set(waveParams, 0.0900, symbol.uvScale || 3, 0.0300, -0.5);
        const waterUniforms = {
            ambientColor: ambientLight.color || [0.2, 0.2, 0.2],
            viewMatrix: map.viewMatrix,

            lightDirection: directionalLight.direction || DEFAULT_DIR_LIGHT.direction,
            lightColor: directionalLight.color || DEFAULT_DIR_LIGHT.color,
            camPos: map.cameraPosition,
            timeElapsed: symbol.animation ? (this.layer.getRenderer().getFrameTimestamp() || 0) / (1 / (symbol.waterSpeed || 1) * 10000) : 0,
            normalTexture: this._normalTex || this._emptyTex,
            heightTexture: this._pertTex || this._emptyTex,
            //[波动强度, 法线贴图的repeat次数, 水流的强度, 水流动的偏移量]
            waveParams,
            waterDir: getWaterDirVector(waterDir, symbol.waterDirection || 0),
            waterBaseColor: symbol.waterBaseColor || [0.1451, 0.2588, 0.4863, 1],

            contrast: symbol.contrast || 1,
            hsv: symbol.hsv || EMPTY_HSV
        };
        extend(uniforms, waterUniforms);
        const renderer = this.layer.getRenderer();
        uniforms.layerOpacity = renderer._getLayerOpacity();
        this.setIncludeUniformValues(uniforms, context);
        if (context && context.ssr && context.ssr.renderUniforms) {
            extend(uniforms, context.ssr.renderUniforms);
        }
        return uniforms;
    }

    delete() {
        super.delete();
        if (this._emptyTex) {
            this._emptyTex.destroy();
            delete this._emptyTex;
        }
        if (this._normalTex) {
            this._normalTex.destroy();
        }
        if (this._pertTex) {
            this._pertTex.destroy();
        }
        if (this.shader) {
            this.shader.dispose();
            delete this.shader;
        }
        if (this._waterShader) {
            this._waterShader.dispose();
        }
        if (this._water) {
            this._water.geometry.dispose();
            if (this._water.material) {
                this._water.material.dispose();
            }
            this._water.dispose();
            delete this._water;
        }
        this.disposeIBLTextures();
    }

    createGround() {
        const planeGeo = new reshader.Plane();
        planeGeo.data.aTexCoord = new Uint8Array(
            [0, 1, 1, 1, 0, 0, 1, 0]
        );
        planeGeo.generateBuffers(this.renderer.regl);

        this._water = new reshader.Mesh(planeGeo, null, { castShadow: false });
        this._waterScene = new reshader.Scene([this._water]);
    }

    transformWater() {
        const map = this.getMap();
        const localTransform = GroundPainter.getGroundTransform(this._water.localTransform, map);
        this._water.setLocalTransform(localTransform);

        const extent = map['_get2DExtentAtRes'](map.getGLRes());
        const width = extent.getWidth();
        const height = extent.getHeight();
        const center = map.cameraLookAt;
        const xmin = center[0] - width;
        const ymax = center[1] + height;

        // uvSize 是固定的值
        const uvSize = WATER_UV_SIZE;
        const left = xmin / uvSize[0];
        const top = ymax / uvSize[1];

        const uvStartX = left % 1;
        const uvStartY = top % 1;
        const noiseStartX = (left * TIME_NOISE_TEXTURE_REPEAT) % 1;
        const noiseStartY = (top * TIME_NOISE_TEXTURE_REPEAT) % 1;

        const w = width / uvSize[0] * 2;
        const h = height / uvSize[1] * 2;

        this._water.setUniform('uvOffset', [uvStartX, uvStartY]);
        this._water.setUniform('noiseUvOffset', [noiseStartX, noiseStartY]);
        this._water.setUniform('uvScale', [w, -h]);
    }
}

export default WaterPainter;

function toRadian(v) {
    return Math.PI * v / 180;
}

function getWaterDirVector(out, dir) {
    dir = toRadian(dir);
    out[0] = Math.sin(dir);
    out[1] = Math.cos(dir);
    return out;
}
