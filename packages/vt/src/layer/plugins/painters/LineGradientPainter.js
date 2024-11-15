import LinePainter from './LinePainter';
import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import vert from './glsl/line.vert';
import frag from './glsl/line.gradient.frag';
import { prepareFnTypeData } from './util/fn_type_util';
import { ID_PROP } from '../../vector/util/convert_to_feature';
import { LINE_GRADIENT_PROP_KEY } from '../../vector/util/symbols';

const GRADIENTS_COUNT_TO_WARN = 2048;

class LineGradientPainter extends LinePainter {

    postCreateGeometry(lineGeometry) {
        this.generateGradProperties(lineGeometry);
    }

    startFrame(...args) {
        super.startFrame(...args);
        this._updateMeshGradient();
    }

    _updateMeshGradient() {
        if (this._changedMeshes) {
            for (let i = 0; i < this._changedMeshes.length; i++) {
                if (!this._changedMeshes[i] || !this._changedMeshes[i].isValid()) {
                    continue;
                }
                const { geometry, material } = this._changedMeshes[i];
                const { symbolIndex } = geometry.properties;
                this.generateGradProperties({ geometry, symbolIndex });
                const texture = this._genGradientTexture(geometry.properties.gradients);
                const oldTexture = material.get('lineGradientTexture');
                if (oldTexture) {
                    oldTexture.destroy();
                }
                geometry.generateBuffers(this.regl);
                material.set('lineGradientTexture', texture);
                material.set('lineGradientTextureHeight', texture.height);
            }
            delete this._changedMeshes;
        }
    }

    onFeatureChange(feature, meshes) {
        if (!this._changedMeshes) {
            this._changedMeshes = [];
        }
        for (let i = 0; i < meshes.length; i++) {
            if (!meshes[i] || !meshes[i].isValid()) {
                continue;
            }
            const geometry = meshes[i].geometry;
            const { features } = geometry.properties;
            if (!features) {
                continue;
            }
            const id = feature && feature[ID_PROP];
            if (features[id]) {
                features[id].feature.properties[LINE_GRADIENT_PROP_KEY] = feature.properties[LINE_GRADIENT_PROP_KEY];
                this._changedMeshes.push(meshes[i]);
                this.setToRedraw();
            }
        }
    }

    needRebuildOnGometryPropertiesChanged() {
         return false;
    }

    generateGradProperties(lineGeometry) {
        const { symbolIndex, geometry } = lineGeometry;
        const { features } = geometry.properties;
        const symbol = this.getSymbol(symbolIndex);
        const gradProp = symbol['lineGradientProperty'];
        const featureIndexes = geometry.properties.aPickingId || geometry.data.aPickingId;
        const aGradIndex = new Uint8Array(featureIndexes.length);
        const gradients = [];
        const gradientIndex = new Map();

        function fillGradients(properties) {
            let grad = properties && properties[gradProp];
            if (!Array.isArray(grad)) {
                grad = [0, 'black', 1, 'black'];
            }
            let key = grad.join();
            let index;
            if (gradientIndex.has(key)) {
                index = gradientIndex.get(key);
            } else {
                index = gradients.length;
                gradientIndex.set(key, index);
                gradients.push(grad);
            }
            return index;
        }

        let current = featureIndexes[0];
        let properties = features[current].feature.properties;
        let gradIndex = fillGradients(properties);
        for (let i = 1; i < featureIndexes.length; i++) {
            if (featureIndexes[i] !== current) {
                current = featureIndexes[i];
                properties = features[current].feature.properties;
                gradIndex = fillGradients(properties);
            }
            aGradIndex[i] = gradIndex;
        }
        if (geometry.data.aGradIndex) {
            const aGradIndex = geometry.data.aGradIndex;
            //TODO webgpu
            if (aGradIndex && aGradIndex.buffer && aGradIndex.buffer.destroy) {
                aGradIndex.buffer.destroy();
            }
        }
        geometry.data.aGradIndex = aGradIndex;
        geometry.properties.gradients = gradients;
    }

    createMesh(geo, transform) {
        const { geometry, symbolIndex, ref } = geo;
        const symbolDef = this.getSymbolDef(symbolIndex);
        if (ref === undefined) {
            const fnTypeConfig = this.getFnTypeConfig(symbolIndex);
            prepareFnTypeData(geometry, symbolDef, fnTypeConfig, this.layer);
        }

        const uniforms = {
            tileResolution: geometry.properties.tileResolution,
            tileRatio: geometry.properties.tileRatio,
            tileExtent: geometry.properties.tileExtent
        };

        const symbol = this.getSymbol(symbolIndex);
        this.setLineUniforms(symbol, uniforms);

        const texture = this._genGradientTexture(geometry.properties.gradients);
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
        if (geometry.data.aAltitude) {
            defines['HAS_ALTITUDE'] = 1;
        }
        this.setMeshDefines(defines, geometry, symbolDef);
        mesh.setDefines(defines);
        mesh.properties.symbolIndex = symbolIndex;
        return mesh;
    }

    _genGradientTexture(gradients) {
        const height = gradients.length * 2;
        //TODO webgpu
        const texture = this.regl.texture({
            width: 256,
            height,
            data: createGradient(gradients),
            format: 'rgba',
            mag: 'linear', //very important
            min: 'linear', //very important
            flipY: false,
        });
        return texture;
    }

    createFnTypeConfig(map, symbolDef) {
        return this.createShapeFnTypeConfigs(map, symbolDef);
    }

    createShader(context) {
        this._context = context;
        const uniforms = [];
        const defines = {};
        this.fillIncludes(defines, uniforms, context);
        if (this.sceneConfig.trailAnimation && this.sceneConfig.trailAnimation.enable) {
            defines['HAS_TRAIL'] = 1;
        }
        const projViewModelMatrix = [];
        uniforms.push(
            {
                name: 'projViewModelMatrix',
                type: 'function',
                fn: function (context, props) {
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
    if (grads.length > GRADIENTS_COUNT_TO_WARN) {
        console.warn(`Gradients count is (${grads.length}), it may be slow to render.`);
    }
    // create a 256x1 gradient that we'll use to turn a grayscale heatmap into a colored one
    const canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d');

    canvas.width = 256;
    canvas.height = 2 * grads.length;

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
