import BasicPainter from './BasicPainter';
import { reshader, mat4 } from '@maptalks/gl';
import waterVert from './glsl/water.vert';
import waterFrag from './glsl/water.frag';
import pickingVert from './glsl/fill.picking.vert';

const DEFAULT_DIR_LIGHT = {
    color: [2.0303, 2.0280, 2.0280],
    // direction: [-0.9617, -0.2717, 0.0347]
    direction: [-1, -0.2717, -1]
};

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

    createMesh(geometry, transform, { tilePoint }) {
        const isVectorTile = geometry.data.aPosition instanceof Int16Array;
        const map = this.getMap();

        geometry.generateBuffers(this.regl);
        // const material = new reshader.Material(uniforms, DEFAULT_UNIFORMS);
        const mesh = new reshader.Mesh(geometry, null, {
            castShadow: false,
            picking: true
        });
        mesh.setUniform('tileExtent', geometry.properties.tileExtent);
        mesh.setUniform('tileRatio', geometry.properties.tileRatio);
        mesh.setUniform('tilePoint', tilePoint);
        // mesh.setUniform('tileScale', 1);
        mesh.setUniform('waveParams', [0.09, 4, 0.03, -0.5]);
        mesh.setUniform('waveDirection', [-0.1182, -0.0208]);
        mesh.setUniform('waterColor', [0.1451, 0.2588, 0.4863, 1]);
        Object.defineProperty(mesh.uniforms, 'tileScale', {
            enumerable: true,
            get: function () {
                return Math.pow(2, 6) * geometry.properties.tileResolution / map.getResolution(map.getGLZoom());
            }
        });
        const defines = {};
        if (isVectorTile) {
            defines['IS_VT'] = 1;
        }

        mesh.setDefines(defines);
        mesh.setLocalTransform(transform);
        return mesh;
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
                self.setToRedraw();
            };
            img.onerror = () => {
                console.error('invalid water wave perturbation texture:' + normalUrl);
            };
            this.addCachedTexture(normalUrl, img);
            img.src = normalUrl;
        }
    }

    _createTex(regl, data) {
        if (!this._emptyTex) {
            return null;
        }
        return regl.texture({
            mag: 'linear',
            min: 'linear mipmap linear',
            wrapS: 'repeat',
            wrapT: 'repeat',
            data: data
        });
    }

    _createShader(context) {
        const canvas = this.canvas;

        const uniforms = [
            // {
            //     name: 'projViewModelMatrix',
            //     type: 'function',
            //     fn: function (context, props) {
            //         const projViewModelMatrix = [];
            //         mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
            //         return projViewModelMatrix;
            //     }
            // },
            {
                name: 'uvSize',
                type: 'function',
                fn: function (context, props) {
                    return [props['texWavePerturbation'].width, props['texWavePerturbation'].height];
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
        const renderer = this.layer.getRenderer();
        const stencil = renderer.isEnableTileStencil && renderer.isEnableTileStencil();
        const depthRange = this.sceneConfig.depthRange;
        this.shader = new reshader.MeshShader({
            vert: waterVert,
            frag: waterFrag,
            uniforms,
            defines,
            extraCommandProps: {
                viewport,
                stencil: {
                    enable: true,
                    mask: 0xFF,
                    func: {
                        cmp: () => {
                            return stencil ? '=' : '<=';
                        },
                        ref: (context, props) => {
                            return stencil ? props.stencilRef : props.level;
                        },
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
                    // 如果mask设为true，fill会出现与轮廓线的深度冲突，出现奇怪的绘制
                    // 如果mask设为false，会出现 antialias 打开时，会被Ground的ssr覆盖的问题 （绘制时ssr需要对比深度值）
                    // 以上问题已经解决 #284
                    // mask: false,
                    func: this.sceneConfig.depthFunc || '<='
                },
                blend: {
                    enable: false,
                },
                polygonOffset: {
                    enable: true,
                    offset: this.getPolygonOffset()
                }
            }
        });
    }

    getUniformValues(map, context) {
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
            timeElapsed: this.layer.getRenderer().getFrameTimestamp() || 0,
            texWaveNormal: this._normalTex || this._emptyTex,
            texWavePerturbation: this._pertTex || this._emptyTex,
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
    }
}

export default WaterPainter;
