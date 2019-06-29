import Color from 'color';
import BasicPainter from './BasicPainter';
import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import vert from './glsl/line.vert';
import frag from './glsl/line.frag';
import pickingVert from './glsl/line.picking.vert';
import { setUniformFromSymbol, createColorSetter, fillArray } from '../Util';
import { isFunctionDefinition, interpolated } from '@maptalks/function-type';

const defaultUniforms = {
    'lineColor': [0, 0, 0, 1],
    'lineOpacity': 1,
    'lineWidth': 1,
    'lineGapWidth': 0,
    'lineDx': 0,
    'lineDy': 0,
    'lineBlur': 1,
    'lineDasharray': [0, 0, 0, 0],
    'lineDashColor': [0, 0, 0, 0]
};


class LinePainter extends BasicPainter {
    needToRedraw() {
        return this._redraw;
    }

    createMesh(geometry, transform) {
        this._colorCache = this._colorCache || {};
        const symbol = this.getSymbol();
        const uniforms = {
            tileResolution: geometry.properties.tileResolution,
            tileRatio: geometry.properties.tileRatio,
            tileExtent: geometry.properties.tileExtent
        };
        const defines = {};
        prepareDynamicSymbols(geometry, this.symbolDef, symbol, uniforms, defines, this._colorCache);

        setUniformFromSymbol(uniforms, 'lineOpacity', symbol, 'lineOpacity');
        setUniformFromSymbol(uniforms, 'lineGapWidth', symbol, 'lineGapWidth');
        setUniformFromSymbol(uniforms, 'lineBlur', symbol, 'lineBlur');
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
        mesh.setDefines(defines);
        return mesh;
    }

    preparePaint(context) {
        super.preparePaint(context);
        this._updateLineAttribs(context.timestamp);
    }

    _updateLineAttribs() {
        const meshes = this.scene.getMeshes();
        if (!meshes || !meshes.length) {
            return;
        }
        const zoom = this.getMap().getZoom();
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            const geometry = mesh.geometry;
            const { features, aPickingId, aColor, aLineWidth, lineWidthFn, colorFn, aIndex } = geometry.properties;
            if (!aPickingId || !aIndex.length) {
                continue;
            }
            const u = new aLineWidth.constructor(1);
            const l = aIndex.length;
            for (let ii = 0; ii < l; ii += 2) {
                const start = aIndex[ii];
                const end = aIndex[ii + 1];
                //new feature
                const feature = features[aPickingId[start]];
                const properties = feature ? feature.feature ? feature.feature.properties : null : null;
                // if (properties.class === 'secondary') debugger
                if (lineWidthFn) {
                    const lineWidth = lineWidthFn(zoom, properties);
                    u[0] = lineWidth;
                    if (aLineWidth[start] !== u[0]) {
                        fillArray(aLineWidth, u[0], start, end);
                        aLineWidth._dirty = true;
                    }
                }
                if (colorFn) {
                    let color = colorFn(zoom, properties);
                    if (!Array.isArray(color)) {
                        color = this._colorCache[color] = this._colorCache[color] || Color(color).array();
                    }
                    if (color.length === 3) {
                        color.push(255);
                    }
                    if (aColor[start * 4] !== color[0] ||
                        aColor[start * 4 + 1] !== color[1] ||
                        aColor[start * 4 + 2] !== color[2] ||
                        aColor[start * 4 + 3] !== color[3]) {
                        for (let iii = start * 4; iii < end * 4; iii += 4) {
                            aColor.set(color, iii);
                        }
                        aColor._dirty = true;
                    }

                }

            }
            if (lineWidthFn && aLineWidth._dirty) {
                geometry.updateData('aLineWidth', aLineWidth);
                aLineWidth._dirty = false;
            }
            if (colorFn && aColor._dirty) {
                geometry.updateData('aColor', aColor);
                aColor._dirty = false;
            }
        }
    }

    init() {
        //tell parent Painter to run stencil when painting
        // this.needStencil = true;

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
                        'canvasSize'
                    ]
                },
                this.pickingFBO
            );
        }
    }

    createShader() {
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
                'canvasSize'
            ],
            extraCommandProps: {
                viewport,
                stencil: {
                    enable: true,
                    mask: 0xFF,
                    func: {
                        cmp: '<=',
                        ref: (context, props) => {
                            return props.level;
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
                    func: this.sceneConfig.depthFunc || 'always'
                },
                blend: {
                    enable: true,
                    func: {
                        src: 'one',
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

function prepareDynamicSymbols(geometry, symbolDef, symbol, uniforms, defines, colorCache) {
    const { aColor, aPickingId, aLineWidth } = geometry.data;
    const { features } = geometry.properties;
    if (!isFunctionDefinition(symbolDef['lineColor'])) {
        setUniformFromSymbol(uniforms, 'lineColor', symbol, 'lineColor', createColorSetter(colorCache));
    } else {
        defines['HAS_COLOR'] = 1;
        const targetProperties = [];
        for (let i = 0; i < symbolDef['lineColor'].stops.length; i++) {
            if (isFunctionDefinition(symbolDef['lineColor'].stops[i][1])) {
                //动态属性名
                targetProperties.push(symbolDef['lineColor'].stops[i][0]);
                break;
            }
        }
        if (targetProperties.length > 0) {
            geometry.data.aColor = {
                usage: 'dynamic',
                data: aColor
            };
            const aIndex = geometry.properties.aIndex = [];
            let current = aPickingId[0];
            for (let i = 1, l = aPickingId.length; i < l; i++) {
                if (aPickingId[i] !== current) {
                    aIndex.push(i);
                    current = aPickingId[i];
                }
            }
            aIndex.push(aPickingId.length);
            geometry.properties.aColor = new aColor.constructor(aColor);
            geometry.properties.aPickingId = new aPickingId.constructor(aPickingId);
            geometry.properties.colorFn = interpolated(symbolDef['lineColor']);
        }
    }
    if (!isFunctionDefinition(symbolDef['lineWidth'])) {
        setUniformFromSymbol(uniforms, 'lineWidth', symbol, 'lineWidth');
    } else {
        defines['HAS_LINE_WIDTH'] = 1;
        const stopValues = [];
        for (let i = 0; i < symbolDef['lineWidth'].stops.length; i++) {
            if (isFunctionDefinition(symbolDef['lineWidth'].stops[i][1])) {
                stopValues.push(symbolDef['lineWidth'].stops[i][0]);
            }
        }
        if (stopValues.length > 0) {
            geometry.data.aLineWidth = {
                usage: 'dynamic',
                data: aLineWidth
            };
            geometry.properties.aLineWidth = new aLineWidth.constructor(aLineWidth);
            if (!geometry.properties.aPickingId) {
                const aIndex = geometry.properties.aIndex = [];
                let start = 0;
                let current = aPickingId[0];
                for (let ii = 1, l = aPickingId.length; ii < l; ii++) {
                    if (aPickingId[ii] !== current) {
                        if (hasDynamicProperty(features[current].feature, symbolDef['lineWidth'].property, stopValues)) {
                            aIndex.push(start, ii);
                        }
                        current = aPickingId[ii];
                        start = ii;
                    }
                }
                geometry.properties.aPickingId = new aPickingId.constructor(aPickingId);
            }
            geometry.properties.lineWidthFn = interpolated(symbolDef['lineWidth']);
        }
    }
}

function hasDynamicProperty(feature, property, stopValues) {
    for (let i = 0; i < stopValues.length; i++) {
        // if (feature.properties[property] === 'secondary') debugger
        if (property[0] === '$' && feature[property.substring(0)] === stopValues[i] ||
            feature.properties[property] === stopValues[i]) {
            return true;
        }
    }
    return false;
}
