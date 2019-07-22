import BasicPainter from './BasicPainter';
import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import vert from './glsl/fill.vert';
import frag from './glsl/fill.frag';
import pickingVert from './glsl/fill.picking.vert';
import { setUniformFromSymbol, createColorSetter } from '../Util';
import { prepareFnTypeData, updateGeometryFnTypeAttrib } from './util/fn_type_util';
import { piecewiseConstant, interpolated } from '@maptalks/function-type';
import Color from 'color';

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

    createMesh(geometry, transform, { tileCenter }) {
        this._colorCache = this._colorCache || {};
        const symbol = this.getSymbol();
        const uniforms = {
            tileResolution: geometry.properties.tileResolution,
            tileRatio: geometry.properties.tileRatio,
            tileExtent: geometry.properties.tileExtent
        };

        prepareFnTypeData(geometry, geometry.properties.features, this.symbolDef, this._fnTypeConfig);
        setUniformFromSymbol(uniforms, 'polygonFill', symbol, 'polygonFill', createColorSetter(this._colorCache));
        setUniformFromSymbol(uniforms, 'polygonOpacity', symbol, 'polygonOpacity');

        if (symbol.polygonPatternFile) {
            uniforms.tileCenter = tileCenter.toArray();
            const iconAtlas = geometry.properties.iconAtlas;
            uniforms.polygonPatternFile = iconAtlas;
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
        if (symbol.polygonPatternFile) {
            defines['HAS_PATTERN'] = 1;
        }
        if (geometry.desc.positionSize === 2) {
            defines['IS_2D_POSITION'] = 1;
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
        updateGeometryFnTypeAttrib(this._fnTypeConfig, meshes);
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
                evaluate: properties => {
                    const polygonOpacity = this._polygonOpacityFn(map.getZoom(), properties);
                    u8[0] = polygonOpacity * 255;
                    return u8[0];
                }
            }
        ];
    }

    updateSymbol() {
        super.updateSymbol();
        this._polygonFillFn = piecewiseConstant(this.symbolDef['polygonFill']);
        this._polygonOpacityFn = interpolated(this.symbolDef['polygonOpacity']);
    }

    init() {
        const regl = this.regl;
        const canvas = this.canvas;

        this.renderer = new reshader.Renderer(regl);

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
        const stencil = this.layer.getRenderer().isEnableTileStencil();
        const depthRange = this.sceneConfig.depthRange;
        this.shader = new reshader.MeshShader({
            vert, frag,
            uniforms: [
                'polygonFill', 'polygonOpacity',
                'polygonPatternFile', 'uvScale',
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        const projViewModelMatrix = [];
                        mat4.multiply(projViewModelMatrix, props['viewMatrix'], props['modelMatrix']);
                        mat4.multiply(projViewModelMatrix, props['projMatrix'], projViewModelMatrix);
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
            ],
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
                    func: this.sceneConfig.depthFunc || (depthRange ? '<=' : 'always')
                },
                blend: {
                    enable: true,
                    func: {
                        src: 'src alpha',
                        dst: 'one minus src alpha'
                    },
                    equation: 'add'
                },
            }
        });
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
                                mat4.multiply(projViewModelMatrix, props['viewMatrix'], props['modelMatrix']);
                                mat4.multiply(projViewModelMatrix, props['projMatrix'], projViewModelMatrix);
                                return projViewModelMatrix;
                            }
                        }
                    ]
                },
                this.pickingFBO
            );
        }
    }

    getUniformValues(map) {
        const viewMatrix = map.viewMatrix,
            projMatrix = map.projMatrix;
        const resolution = map.getResolution();
        return {
            viewMatrix, projMatrix,
            resolution
        };
    }

    canStencil() {
        return true;
    }
}

export default FillPainter;
