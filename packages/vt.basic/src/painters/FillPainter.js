import Painter from './Painter';
import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import Color from 'color';
import vert from './glsl/fill.vert';
import frag from './glsl/fill.frag';

const defaultUniforms = {
    'polygonFill' : [255, 255, 255],
    'polygonOpacity' : 1
};

class FillPainter extends Painter {
    needToRedraw() {
        return this._redraw;
    }

    createMesh(geometries, transform) {
        if (!geometries || !geometries.length) {
            return null;
        }
        const meshes = [];
        for (let i = 0; i < geometries.length; i++) {
            const symbol = geometries[i]._symbol;
            const uniforms = {};
            if (symbol['polygonFill']) {
                const color = Color(symbol['polygonFill']);
                uniforms.polygonFill = color.unitArray();
                if (uniforms.polygonFill.length === 3) {
                    uniforms.polygonFill.push(1);
                }
            }
            let transparent = false;
            if (symbol['polygonOpacity'] || symbol['polygonOpacity'] === 0) {
                uniforms.polygonOpacity = symbol['polygonOpacity'];
                if (symbol['polygonOpacity'] < 1) {
                    transparent = true;
                }
            }

            const material = new reshader.Material(uniforms, defaultUniforms);
            const mesh = new reshader.Mesh(geometries[i], material, {
                transparent,
                castShadow : false,
                picking : true
            });
            mesh.setLocalTransform(transform);
            meshes.push(mesh);
        }
        return meshes;
    }

    paint() {
        this._redraw = false;
        const layer = this.layer;
        const map = layer.getMap();
        if (!map) {
            return {
                redraw : false
            };
        }

        const uniforms = this._getUniformValues(map);

        this._renderer.render(this._shader, uniforms, this.scene);

        this._pickingRendered = false;

        return {
            redraw : false
        };
    }

    pick(x, y) {
        return {
            feature : null,
            point : null
        };
        // const map = this.layer.getMap();
        // const uniforms = this._getUniformValues(map);
        // if (!this._pickingRendered) {
        //     this._raypicking.render(this.scene.getMeshes(), uniforms);
        //     this._pickingRendered = true;
        // }
        // const { meshId, pickingId, point } = this._raypicking.pick(x, y, uniforms, {
        //     viewMatrix : map.viewMatrix,
        //     projMatrix : map.projMatrix,
        //     returnPoint : true
        // });
        // const mesh = (meshId === 0 || meshId) && this._raypicking.getMeshAt(meshId);
        // if (!mesh) {
        //     return {
        //         feature : null,
        //         point
        //     };
        // }
        // return {
        //     feature : mesh.geometry._features[pickingId],
        //     point
        // };
    }

    remove() {
        this._shader.dispose();
    }

    init() {
        const regl = this.regl;
        const canvas = this.canvas;

        this._renderer = new reshader.Renderer(regl);

        const viewport = {
            x : 0,
            y : 0,
            width : () => {
                return canvas ? canvas.width : 1;
            },
            height : () => {
                return canvas ? canvas.height : 1;
            }
        };
        const scissor = {
            enable: true,
            box: {
                x : 0,
                y : 0,
                width : () => {
                    return canvas ? canvas.width : 1;
                },
                height : () => {
                    return canvas ? canvas.height : 1;
                }
            }
        };

        this._shader = new reshader.MeshShader({
            vert, frag,
            uniforms : [
                'polygonFill', 'polygonOpacity',
                {
                    name : 'projViewModelMatrix',
                    type : 'function',
                    fn : function (context, props) {
                        const projViewModelMatrix = [];
                        mat4.multiply(projViewModelMatrix, props['viewMatrix'], props['modelMatrix']);
                        mat4.multiply(projViewModelMatrix, props['projMatrix'], projViewModelMatrix);
                        return projViewModelMatrix;
                    }
                },
            ],
            extraCommandProps : {
                viewport, scissor
            }
        });

        //TODO picking的初始化
    }

    _getUniformValues(map) {
        const viewMatrix = map.viewMatrix,
            projMatrix = map.projMatrix;
        return {
            viewMatrix, projMatrix
        };
    }
}

export default FillPainter;
