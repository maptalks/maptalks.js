import { reshader, mat4 } from '@maptalks/gl';
import { extend } from '../Util';
import Painter from './Painter';
import Color from 'color';
import vert from './glsl/native-line.vert';
import frag from './glsl/native-line.frag';

const defaultUniforms = {
    lineColor: [0, 0, 0],
    lineOpacity: 1
};

class NativeLinePainter extends Painter {
    constructor(regl, layer, sceneConfig, pluginIndex) {
        super(regl, layer, sceneConfig, pluginIndex);
        this.colorSymbol = 'lineColor';
    }

    createGeometry(glData) {
        const data = extend({}, glData.data);
        // data.aPickingId = data.featureIndexes;
        // delete data.featureIndexes;
        const geometry = new reshader.Geometry(data, glData.indices, 0, { primitive: 'lines' });
        return geometry;

    }

    createMesh(geometry, transform) {
        const symbol = this.getSymbol();
        const uniforms = this.getMeshUniforms(geometry, symbol);
        geometry.generateBuffers(this.regl);
        const material = new reshader.Material(uniforms, defaultUniforms);
        const mesh = new reshader.Mesh(geometry, material, {
            castShadow: false,
            picking: true
        });
        mesh.setLocalTransform(transform);
        return mesh;
    }

    getMeshUniforms(geometry, symbol) {
        const uniforms = {};
        if (symbol['lineColor']) {
            const color = Color(symbol['lineColor']);
            uniforms.lineColor = color.unitArray();
            if (uniforms.lineColor.length === 3) {
                uniforms.lineColor.push(1);
            }
        }
        if (symbol['lineOpacity'] || symbol['lineOpacity'] === 0) {
            uniforms.lineOpacity = symbol['lineOpacity'];
        }
        return uniforms;
    }

    deleteMesh(mesh) {
        if (!mesh) {
            return;
        }
        const geometry = mesh.geometry;
        geometry.dispose();
        mesh.dispose();
        this.scene.removeMesh(mesh);
    }

    init() {
        const regl = this.regl;

        this.renderer = new reshader.Renderer(regl);

        const viewport = {
            x: 0,
            y: 0,
            width: () => {
                return this.canvas ? this.canvas.width : 1;
            },
            height: () => {
                return this.canvas ? this.canvas.height : 1;
            }
        };

        const config = {
            vert,
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
            defines: null,
            extraCommandProps: {
                viewport,
                stencil: {
                    enable: true,
                    func: {
                        cmp: '<=',
                        ref: (context, props) => {
                            return props.level;
                        }
                    },
                    op: {
                        fail: 'keep',
                        zfail: 'keep',
                        zpass: 'replace'
                    }
                },
                depth: {
                    enable: true,
                    func: this.sceneConfig.depthFunc || '<='
                },
                blend: {
                    enable: true,
                    func: {
                        src: 'src alpha',
                        dst: 'one minus src alpha'
                    },
                    equation: 'add'
                }
            }
        };

        this.shader = new reshader.MeshShader(config);
    }

    getUniformValues(map) {
        const projViewMatrix = map.projViewMatrix;
        return {
            projViewMatrix
        };
    }
}

export default NativeLinePainter;
