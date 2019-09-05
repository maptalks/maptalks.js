import Color from 'color';
import BasicPainter from './BasicPainter';
import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import vert from './glsl/line.vert';
import frag from './glsl/line.frag';
import pickingVert from './glsl/line.picking.vert';
import { setUniformFromSymbol, createColorSetter } from '../Util';
import { prepareFnTypeData, updateGeometryFnTypeAttrib } from './util/fn_type_util';
import { piecewiseConstant, interpolated } from '@maptalks/function-type';

const defaultUniforms = {
    'lineColor': [0, 0, 0, 1],
    'lineOpacity': 1,
    'lineWidth': 1,
    'lineGapWidth': 0,
    'lineDx': 0,
    'lineDy': 0,
    'lineBlur': 0.4,
    'lineDasharray': [0, 0, 0, 0],
    'lineDashColor': [0, 0, 0, 0],
    'lineOffset': 0
};


class LinePainter extends BasicPainter {
    constructor(...args) {
        super(...args);
        this._fnTypeConfig = this._getFnTypeConfig();
    }

    needToRedraw() {
        return this._redraw;
    }

    createMesh(geometry, transform) {
        prepareFnTypeData(geometry, geometry.properties.features, this.symbolDef, this._fnTypeConfig);

        this._colorCache = this._colorCache || {};
        const symbol = this.getSymbol();
        const uniforms = {
            tileResolution: geometry.properties.tileResolution,
            tileRatio: geometry.properties.tileRatio,
            tileExtent: geometry.properties.tileExtent
        };

        setUniformFromSymbol(uniforms, 'lineWidth', symbol, 'lineWidth');
        setUniformFromSymbol(uniforms, 'lineColor', symbol, 'lineColor', createColorSetter(this._colorCache));
        setUniformFromSymbol(uniforms, 'lineOpacity', symbol, 'lineOpacity');
        setUniformFromSymbol(uniforms, 'lineGapWidth', symbol, 'lineGapWidth');
        setUniformFromSymbol(uniforms, 'lineBlur', symbol, 'lineBlur');
        setUniformFromSymbol(uniforms, 'lineOffset', symbol, 'lineOffset');
        setUniformFromSymbol(uniforms, 'lineDx', symbol, 'lineDx');
        setUniformFromSymbol(uniforms, 'lineDy', symbol, 'lineDy');

        if (symbol.lineDasharray && symbol.lineDasharray.length) {
            let lineDasharray;
            const old = symbol.lineDasharray;
            if (symbol.lineDasharray.length === 1) {
                lineDasharray = [old[0], old[0], old[0], old[0]];
            } else if (symbol.lineDasharray.length === 2) {
                lineDasharray = [old[0], old[1], old[0], old[1]];
            } else if (symbol.lineDasharray.length === 3) {
                lineDasharray = [old[0], old[1], old[2], old[2]];
            } else if (symbol.lineDasharray.length === 4) {
                lineDasharray = symbol.lineDasharray;
            }
            if (lineDasharray) {
                uniforms['lineDasharray'] = lineDasharray;
            }
        }

        setUniformFromSymbol(uniforms, 'lineDashColor', symbol, 'lineDashColor', createColorSetter(this._colorCache));

        if (symbol.linePatternFile) {
            const iconAtlas = geometry.properties.iconAtlas;
            uniforms.linePatternFile = iconAtlas;
            uniforms.linePatternSize = iconAtlas ? [iconAtlas.width, iconAtlas.height] : [0, 0];
        }
        //TODO lineDx, lineDy
        // const indices = geometries[i].elements;
        // const projViewMatrix = mat4.multiply([], mapUniforms.projMatrix, mapUniforms.viewMatrix);
        // const projViewModelMatrix = mat4.multiply(new Float32Array(16), projViewMatrix, transform);
        // console.log('projViewModelMatrix', projViewModelMatrix);
        // const pos = geometries[i].data.aPosition;
        // for (let ii = 0; ii < indices.length; ii++) {
        //     const idx = indices[ii] * 3;
        //     // if (ii === 2) {
        //     //     pos[idx + 2] = 8192;
        //     // }
        //     const vector = [pos[idx], pos[idx + 1], pos[idx + 2], 1];
        //     const glPos = vec4.transformMat4([], vector, projViewModelMatrix);
        //     const tilePos = vec4.transformMat4([], vector, transform);
        //     const ndc = [glPos[0] / glPos[3], glPos[1] / glPos[3], glPos[2] / glPos[3]];
        //     console.log(vector, tilePos, glPos, ndc);
        // }

        geometry.generateBuffers(this.regl);

        const material = new reshader.Material(uniforms, defaultUniforms);
        const mesh = new reshader.Mesh(geometry, material, {
            castShadow: false,
            picking: true
        });
        mesh.setLocalTransform(transform);

        const defines = {};
        if (symbol.linePatternFile) {
            defines['HAS_PATTERN'] = 1;
        }
        if (Array.isArray(symbol.lineDasharray) &&
            symbol.lineDasharray.reduce((accumulator, currentValue)=> {
                return accumulator + currentValue;
            }, 0) > 0) {
            defines['HAS_DASHARRAY'] = 1;
        }
        if (geometry.desc.positionSize === 2) {
            defines['IS_2D_POSITION'] = 1;
        }
        if (geometry.data.aColor) {
            defines['HAS_COLOR'] = 1;
        }
        if (geometry.data.aLineWidth) {
            defines['HAS_LINE_WIDTH'] = 1;
        }
        if (symbol['lineOffset']) {
            defines['USE_LINE_OFFSET'] = 1;
        }
        mesh.setDefines(defines);
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
        this._aColorFn = piecewiseConstant(this.symbolDef['lineColor']);
        this._aLineWidthFn = interpolated(this.symbolDef['lineWidth']);
        const map = this.getMap();
        const u16 = new Uint16Array(1);
        return [
            {
                //geometry.data 中的属性数据
                attrName: 'aColor',
                //symbol中的function-type属性
                symbolName: 'lineColor',
                //
                evaluate: properties => {
                    let color = this._aColorFn(map.getZoom(), properties);
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
                attrName: 'aLineWidth',
                symbolName: 'lineWidth',
                evaluate: properties => {
                    const lineWidth = this._aLineWidthFn(map.getZoom(), properties);
                    u16[0] = lineWidth;
                    return u16[0];
                }
            }
        ];
    }

    updateSymbol() {
        super.updateSymbol();
        this._aColorFn = piecewiseConstant(this.symbolDef['lineColor']);
        this._aLineWidthFn = interpolated(this.symbolDef['lineWidth']);
    }

    canStencil() {
        return true;
    }

    init() {
        const regl = this.regl;

        this.renderer = new reshader.Renderer(regl);

        this.createShader();

        if (this.pickingFBO) {
            this.picking = new reshader.FBORayPicking(
                this.renderer,
                {
                    vert: pickingVert,
                    uniforms: [
                        'cameraToCenterDistance',
                        'lineWidth',
                        'lineGapWidth',
                        {
                            name: 'projViewModelMatrix',
                            type: 'function',
                            fn: function (context, props) {
                                const projViewModelMatrix = [];
                                mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                                return projViewModelMatrix;
                            }
                        },
                        'tileRatio',
                        'resolution',
                        'tileResolution',
                        'lineDx',
                        'lineDy',
                        'lineOffset',
                        'canvasSize'
                    ]
                },
                this.pickingFBO
            );
        }
    }

    createShader() {
        const stencil = this.layer.getRenderer().isEnableTileStencil();
        const canvas = this.canvas;
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
            vert, frag,
            uniforms: [
                'cameraToCenterDistance',
                'lineWidth',
                'lineGapWidth',
                'lineBlur',
                'lineOpacity',
                'lineDasharray',
                'lineDashColor',
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        const projViewModelMatrix = [];
                        mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                        return projViewModelMatrix;
                    }
                },
                'tileRatio',
                'resolution',
                'tileResolution',
                'tileExtent',
                'lineDx',
                'lineDy',
                'lineOffset',
                'canvasSize'
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
                    func: this.sceneConfig.depthFunc || (depthRange ? '<' : 'always')
                },
                blend: {
                    enable: true,
                    func: {
                        src: (context, props) => {
                            return props['linePatternFile'] ? 'src alpha' : 'one';
                        },
                        dst: 'one minus src alpha'
                    },
                    // func : {
                    //     srcRGB: 'src alpha',
                    //     srcAlpha: 'src alpha',
                    //     dstRGB: 'one minus src alpha',
                    //     dstAlpha: 1
                    // },
                    equation: 'add'
                },
                polygonOffset: {
                    enable: true,
                    offset: {
                        factor: -(this.pluginIndex + 1),
                        units: -(this.pluginIndex + 1)
                    }
                }
            }
        });
    }

    getUniformValues(map) {
        const viewMatrix = map.viewMatrix,
            projViewMatrix = map.projViewMatrix,
            uMatrix = mat4.translate([], viewMatrix, map.cameraPosition),
            cameraToCenterDistance = map.cameraToCenterDistance,
            resolution = map.getResolution(),
            canvasSize = [map.width, map.height];
        return {
            uMatrix, projViewMatrix, cameraToCenterDistance, resolution, canvasSize
        };
    }
}

export default LinePainter;
