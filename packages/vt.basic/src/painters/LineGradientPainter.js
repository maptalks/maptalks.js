import BasicPainter from './BasicPainter';
import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import vert from './glsl/line.vert';
import frag from './glsl/line.gradient.frag';
import pickingVert from './glsl/line.picking.vert';
import { setUniformFromSymbol } from '../Util';
import { prepareFnTypeData, updateGeometryFnTypeAttrib } from './util/fn_type_util';
import { interpolated } from '@maptalks/function-type';

const defaultUniforms = {
    'lineOpacity': 1,
    'lineWidth': 2,
    'lineDx': 0,
    'lineDy': 0,
    'lineBlur': 0.5,
    'lineGapWidth': 0
};

const MAX_LINE_COUNT = 128;

class LineGradientPainter extends BasicPainter {
    constructor(...args) {
        super(...args);
        this._fnTypeConfig = this._getFnTypeConfig();
    }

    needToRedraw() {
        return this._redraw;
    }

    createGeometry(glData, features) {
        const geometry = super.createGeometry(glData, features);
        if (!geometry) {
            return null;
        }
        const symbol = this.getSymbol();
        const gradProp = symbol['lineGradientProperty'];
        const featureIndexes = glData.data.aPickingId;
        const aGradIndex = new Uint8Array(featureIndexes.length);
        const grads = [];
        let current = featureIndexes[0];
        grads.push(features[current].feature.properties[gradProp]);
        for (let i = 1; i < featureIndexes.length; i++) {
            if (featureIndexes[i] !== current) {
                current = featureIndexes[i];
                grads.push(features[current].feature.properties[gradProp]);
            }
            aGradIndex[i] = grads.length - 1;
        }
        geometry.data.aGradIndex = aGradIndex;
        geometry.properties.gradients = grads;
        return geometry;
    }

    createMesh(geometry, transform) {
        const symbol = this.getSymbol();
        const uniforms = {
            tileResolution: geometry.properties.tileResolution,
            tileRatio: geometry.properties.tileRatio,
            tileExtent: geometry.properties.tileExtent
        };
        prepareFnTypeData(geometry, geometry.properties.features, this.symbolDef, this._fnTypeConfig);
        setUniformFromSymbol(uniforms, 'lineOpacity', symbol, 'lineOpacity');
        setUniformFromSymbol(uniforms, 'lineWidth', symbol, 'lineWidth');
        setUniformFromSymbol(uniforms, 'lineGapWidth', symbol, 'lineGapWidth');
        setUniformFromSymbol(uniforms, 'lineBlur', symbol, 'lineBlur');
        setUniformFromSymbol(uniforms, 'lineOffset', symbol, 'lineOffset');
        setUniformFromSymbol(uniforms, 'lineDx', symbol, 'lineDx');
        setUniformFromSymbol(uniforms, 'lineDy', symbol, 'lineDy');

        const gradients = geometry.properties.gradients;
        let height = gradients.length * 2;
        if (!isPowerOfTwo(height)) {
            height = ceilPowerOfTwo(height);
        }
        const texture = this.regl.texture({
            width: 256,
            height,
            data: createGradient(gradients),
            format: 'rgba',
            mag: 'linear', //very important
            min: 'linear', //very important
            flipY: false,
        });

        uniforms['lineGradientTexture'] = texture;
        uniforms['lineGradientTextureHeight'] = texture.height;

        geometry.generateBuffers(this.regl);

        const material = new reshader.Material(uniforms, defaultUniforms);
        const mesh = new reshader.Mesh(geometry, material, {
            castShadow: false,
            picking: true
        });
        const defines = {
            'HAS_GRADIENT': 1
        };
        if (geometry.desc.positionSize === 2) {
            defines['IS_2D_POSITION'] = 1;
        }
        if (geometry.data.aLineWidth) {
            defines['HAS_LINE_WIDTH'] = 1;
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
        this._aLineWidthFn = interpolated(this.symbolDef['lineWidth']);
        const map = this.getMap();
        const u16 = new Uint16Array(1);
        return [
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
                        'tileExtent',
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
                'lineBlur',
                'lineOpacity',
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
                        src: 'src alpha',
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

export default LineGradientPainter;

function createGradient(grads) {
    if (grads.length > MAX_LINE_COUNT) {
        console.warn(`Line count in a tile exceeds maximum limit (${MAX_LINE_COUNT}) for line-gradient render plugin.`);
        grads = grads.slice(0, MAX_LINE_COUNT);
    }
    // create a 256x1 gradient that we'll use to turn a grayscale heatmap into a colored one
    const canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d');

    canvas.width = 256;
    canvas.height = 2 * grads.length;
    if (!isPowerOfTwo(canvas.height)) {
        canvas.height = ceilPowerOfTwo(2 * grads.length);
    }

    for (let g = 0; g < grads.length; g++) {
        const grad = grads[g];
        const gradient = ctx.createLinearGradient(0, 0, 256, 0);
        for (let i = 0; i < grad.length; i += 2) {
            gradient.addColorStop(+grad[i], grad[i + 1]);
        }
        ctx.fillStyle = gradient;
        const dy = g % 256;
        ctx.fillRect(0, dy * 2, 256, dy * 2 + 2);
    }

    return ctx.canvas;
}

function isPowerOfTwo(value) {
    return (value & (value - 1)) === 0 && value !== 0;
}

function ceilPowerOfTwo(value) {
    return Math.pow(2, Math.ceil(Math.log(value) / Math.LN2));
}
