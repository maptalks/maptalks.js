import LinePainter from './LinePainter';
import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import vert from './glsl/line.vert';
import frag from './glsl/line.gradient.frag';
import { prepareFnTypeData } from './util/fn_type_util';

const MAX_LINE_COUNT = 128;

class LineGradientPainter extends LinePainter {

    createGeometry(glData, features) {
        const geometries = super.createGeometry(glData, features);
        for (let i = 0; i < geometries.length; i++) {
            const { symbolIndex, geometry } = geometries[i];
            const symbol = this.getSymbol(symbolIndex);
            const gradProp = symbol['lineGradientProperty'];
            const featureIndexes = geometry.data.aPickingId;
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
        }

        return geometries;
    }

    createMesh(geo, transform) {
        if (Array.isArray(geo)) {
            const meshes = [];
            for (let i = 0; i < geo.length; i++) {
                meshes.push(this.createMesh(geo[i], transform));
            }
            return meshes;
        }
        const { geometry, symbolIndex, ref } = geo;
        if (ref === undefined) {
            const symbolDef = this.getSymbolDef(symbolIndex);
            const fnTypeConfig = this.getFnTypeConfig(symbolIndex);
            prepareFnTypeData(geometry, symbolDef, fnTypeConfig);
        }

        const uniforms = {
            tileResolution: geometry.properties.tileResolution,
            tileRatio: geometry.properties.tileRatio,
            tileExtent: geometry.properties.tileExtent
        };

        const symbol = this.getSymbol(symbolIndex);
        this.setLineUniforms(symbol, uniforms);

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
        if (ref === undefined) {
            geometry.generateBuffers(this.regl);
        }

        const material = new reshader.Material(uniforms);
        const mesh = new reshader.Mesh(geometry, material, {
            castShadow: false,
            picking: true
        });
        mesh.setLocalTransform(transform);

        const defines = {
            'HAS_GRADIENT': 1
        };
        this.setMeshDefines(defines, geometry);
        mesh.setDefines(defines);
        mesh.properties.symbolIndex = symbolIndex;
        return mesh;
    }

    createFnTypeConfig(map, symbolDef) {
        return this._createShapeFnTypeConfigs(map, symbolDef);
    }

    createShader(context) {
        this._context = context;
        const uniforms = [];
        const defines = {};
        this.fillIncludes(defines, uniforms, context);
        if (this.sceneConfig.trailAnimation && this.sceneConfig.trailAnimation.enable) {
            defines['HAS_TRAIL'] = 1;
        }
        uniforms.push(
            {
                name: 'projViewModelMatrix',
                type: 'function',
                fn: function (context, props) {
                    const projViewModelMatrix = [];
                    mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                    return projViewModelMatrix;
                }
            }
        );

        this.shader = new reshader.MeshShader({
            vert, frag,
            uniforms,
            defines,
            extraCommandProps: this.getExtraCommandProps()
        });
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
