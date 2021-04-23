import BasicPainter from './BasicPainter';
import { reshader, mat4 } from '@maptalks/gl';
import vert from './glsl/fill.vert';
import frag from './glsl/fill.frag';
import pickingVert from './glsl/fill.picking.vert';
import { isNumber, isNil, setUniformFromSymbol, createColorSetter } from '../Util';
import { prepareFnTypeData, updateGeometryFnTypeAttrib } from './util/fn_type_util';
import { createAtlasTexture } from './util/atlas_util';
import { piecewiseConstant, interpolated } from '@maptalks/function-type';
import Color from 'color';

const DEFAULT_UNIFORMS = {
    'polygonFill': [1, 1, 1, 1],
    'polygonOpacity': 1
};

class FillPainter extends BasicPainter {
    constructor(...args) {
        super(...args);
        this._fnTypeConfig = this._getFnTypeConfig();
    }

    prepareSymbol(symbol) {
        const polygonFill = symbol.polygonFill;
        if (Array.isArray(polygonFill)) {
            if (polygonFill.length === 3) {
                polygonFill.push(1);
            }
            symbol.polygonFill = polygonFill.map(c => c * 255);
        }
    }

    supportRenderMode(mode) {
        if (this.sceneConfig.antialias || this.sceneConfig.antialias === undefined) {
            //turn on antialias if set
            return mode === 'fxaa' || mode === 'fxaaBeforeTaa';
        } else {
            return super.supportRenderMode(mode);
        }
    }

    needPolygonOffset() {
        return true;
    }

    createMesh(geometry, transform, { tilePoint }) {
        const isVectorTile = geometry.data.aPosition instanceof Int16Array;
        this._colorCache = this._colorCache || {};
        const symbol = this.getSymbol();
        const uniforms = {
            tileExtent: geometry.properties.tileExtent,
            tileRatio: geometry.properties.tileRatio
        };

        prepareFnTypeData(geometry, this.symbolDef, this._fnTypeConfig);
        setUniformFromSymbol(uniforms, 'polygonFill', symbol, 'polygonFill', DEFAULT_UNIFORMS['polygonFill'], createColorSetter(this._colorCache));
        setUniformFromSymbol(uniforms, 'polygonOpacity', symbol, 'polygonOpacity', DEFAULT_UNIFORMS['polygonOpacity']);
        const iconAtlas = geometry.properties.iconAtlas;
        if (iconAtlas && geometry.data.aTexInfo) {
            // const resolution = this.getMap().getResolution();
            const map = this.getMap();
            uniforms.tilePoint = tilePoint;
            // Object.defineProperty(uniforms, 'tilePoint', {
            //     enumerable: true,
            //     get: function () {
            //         const tileScale = geometry.properties.tileResolution / map.getResolution();
            //         return [tilePoint[0] * tileScale, tilePoint[1] * tileScale];
            //     }
            // });
            Object.defineProperty(uniforms, 'tileScale', {
                enumerable: true,
                get: function () {
                    return geometry.properties.tileResolution / map.getResolution();
                }
            });
            // uniforms.tileRatio = geometry.properties.tileResolution / resolution / geometry.properties.tileRatio;
            //如果SCALE[0] !== 1，说明是Vector3DLayer，则texture不用设置flipY
            uniforms.polygonPatternFile = createAtlasTexture(this.regl, iconAtlas, false);
            uniforms.atlasSize = [iconAtlas.width, iconAtlas.height];
            this.drawDebugAtlas(iconAtlas);
        }
        geometry.generateBuffers(this.regl);
        const material = new reshader.Material(uniforms, DEFAULT_UNIFORMS);
        const mesh = new reshader.Mesh(geometry, material, {
            castShadow: false,
            picking: true
        });
        const defines = {};
        if (iconAtlas && geometry.data.aTexInfo) {
            defines['HAS_PATTERN'] = 1;
        }
        if (geometry.data.aColor) {
            defines['HAS_COLOR'] = 1;
        }
        if (geometry.data.aOpacity) {
            defines['HAS_OPACITY'] = 1;
        }

        if (isVectorTile) {
            defines['IS_VT'] = 1;
        }

        mesh.setDefines(defines);
        mesh.setLocalTransform(transform);
        return mesh;
    }

    preparePaint(...args) {
        super.preparePaint(...args);
        const meshes = this.scene.getMeshes();
        if (!meshes || !meshes.length) {
            return;
        }
        updateGeometryFnTypeAttrib(this.regl, this.symbolDef, this._fnTypeConfig, meshes, this.getMap().getZoom());
    }

    _getFnTypeConfig() {
        this._polygonFillFn = piecewiseConstant(this.symbolDef['polygonFill']);
        this._polygonOpacityFn = interpolated(this.symbolDef['polygonOpacity']);
        const map = this.getMap();
        const u8 = new Uint8Array(1);
        return [
            {
                //geometry.data 中的属性数据
                attrName: 'aColor',
                //symbol中的function-type属性
                symbolName: 'polygonFill',
                type: Uint8Array,
                width: 4,
                define: 'HAS_COLOR',
                //
                evaluate: properties => {
                    let color = this._polygonFillFn(map.getZoom(), properties);
                    if (!Array.isArray(color)) {
                        color = this._colorCache[color] = this._colorCache[color] || Color(color).array();
                    }
                    if (color.length === 3) {
                        color.push(255);
                    }
                    return color;
                }
            },
            {
                attrName: 'aOpacity',
                symbolName: 'polygonOpacity',
                type: Uint8Array,
                width: 1,
                define: 'HAS_OPACITY',
                evaluate: properties => {
                    const polygonOpacity = this._polygonOpacityFn(map.getZoom(), properties);
                    u8[0] = polygonOpacity * 255;
                    return u8[0];
                }
            }
        ];
    }

    updateSymbol(...args) {
        super.updateSymbol(...args);
        this._polygonFillFn = piecewiseConstant(this.symbolDef['polygonFill']);
        this._polygonOpacityFn = interpolated(this.symbolDef['polygonOpacity']);
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
            },
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
        const symbol = this.getSymbol();
        const renderer = this.layer.getRenderer();
        const stencil = renderer.isEnableTileStencil && renderer.isEnableTileStencil();
        const depthRange = this.sceneConfig.depthRange;
        this.shader = new reshader.MeshShader({
            vert, frag,
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
                    mask: (context, props) => {
                        if (!isNil(this.sceneConfig.depthMask)) {
                            return !!this.sceneConfig.depthMask;
                        }
                        if (props.meshConfig.transparent) {
                            return false;
                        }
                        const opacity = symbol['polygonOpacity'];
                        return !(isNumber(opacity) && opacity < 1);
                    },
                    func: this.sceneConfig.depthFunc || '<='
                },
                blend: {
                    enable: true,
                    func: this.getBlendFunc(),
                    equation: 'add'
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
        const uniforms = {
            projViewMatrix,
            glScale: 1 / map.getGLScale(),
            blendSrcIsOne: +(!!(this.sceneConfig.blendSrc === 'one'))
        };
        this.setIncludeUniformValues(uniforms, context);
        return uniforms;
    }
}

export default FillPainter;
