import BasicPainter from './BasicPainter';
import { reshader, mat4 } from '@maptalks/gl';
import vert from './glsl/fill.vert';
import frag from './glsl/fill.frag';
import pickingVert from './glsl/fill.picking.vert';
import { setUniformFromSymbol, createColorSetter, extend } from '../Util';
import { prepareFnTypeData, updateGeometryFnTypeAttrib } from './util/fn_type_util';
import { piecewiseConstant, interpolated } from '@maptalks/function-type';
import Color from 'color';
import { OFFSET_FACTOR_SCALE } from './Constant';

const DEFAULT_UNIFORMS = {
    'polygonFill': [1, 1, 1, 1],
    'polygonOpacity': 1
};

const EMPTY_UV_OFFSET = [0, 0];

class FillPainter extends BasicPainter {
    constructor(...args) {
        super(...args);
        this._fnTypeConfig = this._getFnTypeConfig();
    }

    needAA() {
        if (this.sceneConfig.antialias === undefined || this.sceneConfig.antialias) {
            //turn on antialias by default
            return true;
        } else {
            return false;
        }
    }

    createMesh(geometry, transform, { tileCenter }) {
        this._colorCache = this._colorCache || {};
        const symbol = this.getSymbol();
        const uniforms = {
            tileResolution: geometry.properties.tileResolution,
            tileRatio: geometry.properties.tileRatio,
            tileExtent: geometry.properties.tileExtent
        };

        prepareFnTypeData(geometry, this.symbolDef, this._fnTypeConfig);
        setUniformFromSymbol(uniforms, 'polygonFill', symbol, 'polygonFill', DEFAULT_UNIFORMS['polygonFill'], createColorSetter(this._colorCache));
        setUniformFromSymbol(uniforms, 'polygonOpacity', symbol, 'polygonOpacity', DEFAULT_UNIFORMS['polygonOpacity']);

        const iconAtlas = geometry.properties.iconAtlas;
        if (iconAtlas && geometry.data.aTexCoord) {
            uniforms.tileCenter = tileCenter.toArray();
            uniforms.polygonPatternFile = this.createAtlasTexture(iconAtlas);
            uniforms.patternSize = [iconAtlas.width, iconAtlas.height];
            uniforms.uvScale = iconAtlas ? [256 / iconAtlas.width, 256 / iconAtlas.height] : [1, 1];
        }
        geometry.generateBuffers(this.regl);
        const material = new reshader.Material(uniforms, DEFAULT_UNIFORMS);
        const mesh = new reshader.Mesh(geometry, material, {
            castShadow: false,
            picking: true
        });
        const defines = {};
        if (iconAtlas && geometry.data.aTexCoord) {
            defines['HAS_PATTERN'] = 1;
        }
        if (geometry.data.aColor) {
            defines['HAS_COLOR'] = 1;
        }
        if (geometry.data.aOpacity) {
            defines['HAS_OPACITY'] = 1;
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

    getRenderFBO(context) {
        const renderTarget = context && context.renderTarget;
        if (!renderTarget) {
            return null;
        }
        if (this.sceneConfig.antialias === undefined || this.sceneConfig.antialias) {
            //turn on antialias by default
            return renderTarget.fbo;
        } else {
            return renderTarget.noAaFbo;
        }
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

    updateSymbol(symbol) {
        super.updateSymbol(symbol);
        this._polygonFillFn = piecewiseConstant(this.symbolDef['polygonFill']);
        this._polygonOpacityFn = interpolated(this.symbolDef['polygonOpacity']);
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
                    ]
                },
                this.pickingFBO
            );
        }
    }

    _createShader(context) {
        const canvas = this.canvas;

        const uniforms = context.shadow && context.shadow.uniformDeclares.slice(0) || [];
        const defines = context.shadow && context.shadow.defines || {};

        uniforms.push(
            'polygonFill', 'polygonOpacity',
            'polygonPatternFile', 'uvScale',
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
                name: 'uvOffset',
                type: 'function',
                fn: (context, props) => {
                    if (!props['tileCenter']) {
                        return EMPTY_UV_OFFSET;
                    }
                    const scale =  props['tileResolution'] / props['resolution'];
                    const [width, height] = props['patternSize'];
                    const tileSize = this.layer.options['tileSize'];
                    //瓦片左边沿的坐标 = 瓦片中心点.x - 瓦片宽度 / 2
                    //瓦片左边沿的屏幕坐标 = 瓦片左边沿的坐标 * tileResolution / resolution
                    //瓦片左边沿的uv偏移量 = （瓦片左边沿的屏幕坐标 / 模式图片的宽） % 1
                    const offset = [(props['tileCenter'][0] - tileSize[0] / 2) * scale / width % 1, (props['tileCenter'][1] - tileSize[1] / 2) * scale / height % 1];
                    return offset;
                }
            },
            'tileResolution', 'resolution', 'tileRatio'
        );
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
        const layer = this.layer;
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
                polygonOffset: {
                    enable: true,
                    offset: {
                        factor: () => { return -OFFSET_FACTOR_SCALE * (layer.getPolygonOffset() + this.pluginIndex + 1) / layer.getTotalPolygonOffset(); },
                        units: () => { return -(layer.getPolygonOffset() + this.pluginIndex + 1); }
                    }
                }
            }
        });
    }

    getUniformValues(map, context) {
        const projViewMatrix = map.projViewMatrix;
        const resolution = map.getResolution();
        const uniforms = {
            projViewMatrix,
            resolution
        };
        if (context && context.shadow && context.shadow.renderUniforms) {
            extend(uniforms, context.shadow.renderUniforms);
        }
        return uniforms;
    }
}

export default FillPainter;
