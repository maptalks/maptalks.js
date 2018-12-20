import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import { extend } from './Util';
import Color from 'color';
import vert from './glsl/line.vert';
import frag from './glsl/line.frag';

const level0Filter = mesh => {
    return mesh.uniforms['level'] === 0;
};

const levelNFilter = mesh => {
    return mesh.uniforms['level'] > 0;
};

const defaultUniforms = {
    lineColor : [0, 0, 0],
    lineOpacity : 1
};

class NativeLinePainter {
    constructor(regl, layer, sceneConfig) {
        this.layer = layer;
        this._canvas = layer.getRenderer().canvas;
        this._regl = regl;
        this._redraw = false;
        this.colorSymbol = 'lineColor';
        this.sceneConfig = sceneConfig || {};
        this.init();
    }

    needToRedraw() {
        return this._redraw;
    }

    createGeometry(glData) {
        const packs = glData.packs;
        if (!packs || !packs.length) {
            return [];
        }
        const geometries = [];
        for (let i = 0; i < packs.length; i++) {
            const data = extend({}, packs[i].data);
            // data.aPickingId = data.featureIndexes;
            // delete data.featureIndexes;
            const geometry = new reshader.Geometry(data, packs[i].indices, 0, { primitive : 'lines' });
            geometries.push(geometry);
        }
        return geometries;
    }

    createMesh(geometries, transform, tileData) {
        if (!geometries || !geometries.length) {
            return null;
        }

        const packMeshes = tileData.meshes;
        const meshes = [];
        for (let i = 0; i < packMeshes.length; i++) {
            const geometry = geometries[packMeshes[i].pack];
            const symbol = packMeshes[i].symbol;
            const uniforms = this.getMeshUniforms(geometry, symbol);
            geometry.generateBuffers(this._regl);
            const material = new reshader.Material(uniforms, defaultUniforms);
            const mesh = new reshader.Mesh(geometry, material, {
                castShadow : false,
                picking : true
            });
            mesh.setLocalTransform(transform);
            meshes.push(mesh);
        }
        return meshes;
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

    addMesh(mesh) {
        this._scene.addMesh(mesh);
        return this;
    }

    render() {
        const layer = this.layer;
        const map = layer.getMap();
        if (!map) {
            return;
        }

        const uniforms = this.getUniformValues(map);

        this._regl.clear({
            stencil: 0xFF
        });
        this._shader.filter = level0Filter;
        this._renderer.render(this._shader, uniforms, this._scene);

        this._shader.filter = levelNFilter;
        this._renderer.render(this._shader, uniforms, this._scene);
    }

    deleteMesh(mesh) {
        if (!mesh) {
            return;
        }
        const geometry = mesh.geometry;
        geometry.dispose();
        mesh.dispose();
        this._scene.removeMesh(mesh);
    }

    clear() {
        this._scene.clear();
    }

    resize() {}

    delete() {
        this._shader.dispose();
    }

    init() {
        const regl = this._regl;

        this._scene = new reshader.Scene();

        this._renderer = new reshader.Renderer(regl);

        const viewport = {
            x : 0,
            y : 0,
            width : () => {
                return this._canvas ? this._canvas.width : 1;
            },
            height : () => {
                return this._canvas ? this._canvas.height : 1;
            }
        };
        const scissor = {
            enable: true,
            box: {
                x : 0,
                y : 0,
                width : () => {
                    return this._canvas ? this._canvas.width : 1;
                },
                height : () => {
                    return this._canvas ? this._canvas.height : 1;
                }
            }
        };

        const config = {
            vert,
            frag,
            uniforms : this._getUniforms(),
            defines : null,
            extraCommandProps : {
                viewport, scissor,
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
                depth : {
                    enable : true,
                    func : this.sceneConfig.depthFunc || 'less'
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

        this._shader = new reshader.MeshShader(config);
    }

    _getUniforms() {
        const uniforms = [
            {
                name : 'projViewModelMatrix',
                type : 'function',
                fn : function (context, props) {
                    const projViewModelMatrix = [];
                    mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                    return projViewModelMatrix;
                }
            }
        ];

        return uniforms;
    }

    getUniformValues(map) {
        const projViewMatrix = map.projViewMatrix;
        return {
            projViewMatrix
        };
    }
}

export default NativeLinePainter;
