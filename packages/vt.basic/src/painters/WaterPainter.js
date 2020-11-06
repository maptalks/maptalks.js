import BasicPainter from './BasicPainter';
import { reshader, mat4, GroundPainter } from '@maptalks/gl';
import waterVert from './glsl/water.vert';
import waterFrag from './glsl/water.frag';
import pickingVert from './glsl/fill.picking.vert';

const DEFAULT_DIR_LIGHT = {
    color: [2.0303, 2.0280, 2.0280],
    // direction: [-0.9617, -0.2717, 0.0347]
    direction: [0.0, -0.2717, -1]
};

const TIME_NOISE_TEXTURE_REPEAT = 0.3737;

const frag = `
    #define SHADER_NAME WATER_STENCIL
    precision mediump float;
    void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
`;

class WaterPainter extends BasicPainter {
    needAA() {
        return false;
    }

    needPolygonOffset() {
        return true;
    }

    needToRedraw() {
        const symbol = this.getSymbol();
        return symbol.animation;
    }

    createMesh(geometry, transform) {
        geometry.generateBuffers(this.regl);
        // const material = new reshader.Material(uniforms, DEFAULT_UNIFORMS);
        const mesh = new reshader.Mesh(geometry, null, {
            castShadow: false,
            picking: true
        });
        mesh.setLocalTransform(transform);
        return mesh;
    }

    callShader(uniforms, context) {
        this._stencilValue = 0;
        super.callShader(uniforms, context);
        this.transformGround();
        const waterUniforms = this._getWaterUniform(this.getMap(), context);
        this.renderer.render(this._waterShader, waterUniforms, this._waterScene, this.getRenderFBO(context));
    }


    getRenderFBO(context) {
        if (context && context.renderTarget) {
            if (this.needAA()) {
                if (context.renderTarget.fbo) {
                    return context.renderTarget.fbo;
                }
            }
            return context.renderTarget.noAaFbo || context.renderTarget.fbo;
        }
        return null;
    }

    updateSymbol(symbol) {
        super.updateSymbol(symbol);
    }

    paint(context) {
        if (context.states && context.states.includesChanged['shadow']) {
            this.shader.dispose();
            this._createShader(context);
        }
        super.paint(context);
    }

    init(context) {
        const regl = this.regl;


        this.renderer = new reshader.Renderer(regl);

        this.createGround();
        this._createShader(context);

        if (this.pickingFBO) {
            this.picking = new reshader.FBORayPicking(
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
                this.pickingFBO
            );
        }
        this._loadTextures();
    }

    _loadTextures() {
        const regl = this.regl;
        this._emptyTex = regl.texture(2);
        this._uvSize = [2, 2];

        const symbol = this.getSymbol();
        const normalUrl = symbol['texWaveNormal'];
        const cachedNormalData = this.getCachedTexture(normalUrl);
        const self = this;

        if (cachedNormalData) {
            if (!cachedNormalData.loading) {
                this._normalTex = this._createTex(regl, cachedNormalData);
            }
        } else {
            const img = new Image();
            img.loading = true;
            img.onload = function () {
                delete this.loading;
                self._normalTex = self._createTex(regl, this);
                this._uvSize = [this.width, this.height];
                self.setToRedraw();
            };
            img.onerror = () => {
                console.error('invalid water wave normal texture:' + normalUrl);
            };
            this.addCachedTexture(normalUrl, img);
            img.src = normalUrl;
        }


        const pertUrl = symbol['texWavePerturbation'];
        const cachedPertData = this.getCachedTexture(pertUrl);

        if (cachedPertData) {
            if (!cachedPertData.loading) {
                this._pertTex = this._createTex(regl, cachedPertData);
            }
        } else {
            const img = new Image();
            img.loading = true;
            img.onload = function () {
                delete this.loading;
                self._pertTex = self._createTex(regl, this);
                this._uvSize = [this.width, this.height];
                self.setToRedraw();
            };
            img.onerror = () => {
                console.error('invalid water wave perturbation texture:' + pertUrl);
            };
            this.addCachedTexture(pertUrl, img);
            img.src = pertUrl;
        }
    }

    _createTex(regl, data) {
        if (!this._emptyTex) {
            return null;
        }
        return regl.texture({
            width: this._uvSize[0],
            height: this._uvSize[1],
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

        const uniforms = [
            {
                name: 'projViewModelMatrix',
                type: 'function',
                fn: function (context, props) {
                    const projViewModelMatrix = [];
                    mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                    return projViewModelMatrix;
                }
            }
        ];
        const defines = {};
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
                        cmp: 'always',
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
        this._waterShader = new reshader.MeshShader({
            vert: waterVert,
            frag: waterFrag,
            defines: {
                'TIME_NOISE_TEXTURE_REPEAT': TIME_NOISE_TEXTURE_REPEAT
            },
            uniforms,
            extraCommandProps: {
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
            }
        });
    }

    needClearStencil() {
        return true;
    }

    getUniformValues(map) {
        return {
            projViewMatrix: map.projViewMatrix
        };
    }

    _getWaterUniform(map, context) {
        const projViewMatrix = map.projViewMatrix;
        const lightManager = map.getLightManager();
        let directionalLight = lightManager && lightManager.getDirectionalLight();
        if (!directionalLight) {
            directionalLight = DEFAULT_DIR_LIGHT;
        }
        const uniforms = {
            projViewMatrix,
            lightDirection: directionalLight.direction,
            lightColor: directionalLight.color,
            camPos: map.cameraPosition,
            timeElapsed: this.layer.getRenderer().getFrameTimestamp() / 2 || 0,
            texWaveNormal: this._normalTex || this._emptyTex,
            texWavePerturbation: this._pertTex || this._emptyTex,
            //[波动强度, 法线贴图的repeat次数, 水流的强度, 水流动的偏移量]
            // 'waveParams': [0.0900, 12, 0.0300, -0.5],
            waveParams: [0.0900, 12, 0.0300, -0.5],
            'waveDirection': [-0.1182, -0.0208],
            'waterColor': [0.1451, 0.2588, 0.4863, 1],
        };
        this.setIncludeUniformValues(uniforms, context);
        return uniforms;
    }

    delete() {
        super.delete();
        if (this._emptyTex) {
            this._emptyTex.dispose();
            delete this._emptyTex;
        }
        if (this._normalTex) {
            this._normalTex.dispose();
        }
        if (this._pertTex) {
            this._pertTex.dispose();
        }
        if (this.shader) {
            this.shader.dispose();
        }
        if (this._water) {
            this._water.geometry.dispose();
            if (this._water.material) {
                this._water.material.dispose();
            }
            this._water.dispose();
            delete this._water;
        }
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

    transformGround() {
        const map = this.getMap();
        const localTransform = GroundPainter.getGroundTransform(this._water.localTransform, map);
        this._water.setLocalTransform(localTransform);

        const extent = map['_get2DExtent'](map.getGLZoom());
        const width = extent.getWidth();
        const height = extent.getHeight();
        const center = map.cameraLookAt;
        const xmin = center[0] - width;
        const ymax = center[1] + height;

        const uvSize = this._uvSize;
        const left = xmin / uvSize[0];
        const top = ymax / uvSize[1];

        const uvStartX = left % 1;
        const uvStartY = top % 1;
        const noiseStartX = (left * TIME_NOISE_TEXTURE_REPEAT) % 1;
        const noiseStartY = (top * TIME_NOISE_TEXTURE_REPEAT) % 1;

        const w = extent.getWidth() / uvSize[0] * 2;
        const h = extent.getHeight() / uvSize[1] * 2;

        this._water.setUniform('uvOffset', [uvStartX, uvStartY]);
        this._water.setUniform('noiseUvOffset', [noiseStartX, noiseStartY]);
        this._water.setUniform('uvScale', [w, -h]);
    }
}

export default WaterPainter;
