import Painter from './Painter';
import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import vert from './glsl/marker.vert';
import frag from './glsl/marker.frag';

const defaultUniforms = {
    'markerOpacity' : 1,
    'pitchWithMap' : 0
};

class PointPainter extends Painter {
    needToRedraw() {
        return this._redraw;
    }

    createMesh(geometries, transform) {
        if (!geometries || !geometries.length) {
            return null;
        }

        const meshes = [];
        for (let i = 0; i < geometries.length; i++) {
            const symbol = geometries[i]['_symbol'];
            const uniforms = {};

            let transparent = false;
            if (symbol['markerOpacity'] || symbol['markerOpacity'] === 0) {
                uniforms.markerOpacity = symbol['markerOpacity'];
                if (symbol['markerOpacity'] < 1) {
                    transparent = true;
                }
            }

            const iconAtlas = geometries[i]['_iconAtlas'];
            uniforms['texture'] = iconAtlas;
            uniforms['texSize'] = [iconAtlas.width, iconAtlas.height];

            if (symbol['markerPitchAlignment'] === 'map') {
                uniforms['pitchWithMap'] = 1;
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
                'cameraToCenterDistance',
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
                'uMatrix',
                'textSize',
                'canvasSize',
                'pitchWithMap',
                'texture'
            ],
            extraCommandProps : {
                viewport, scissor,
                blend: {
                    enable: true,
                    func: {
                        src: 'src alpha',
                        // srcAlpha: 1,
                        dst: 'one minus src alpha',
                        // dstAlpha: 1
                    },
                    equation: 'add',
                    // color: [0, 0, 0, 0]
                },
                depth: {
                    enable: false
                },
            }
        });

        //TODO picking的初始化
    }

    _getUniformValues(map) {
        const viewMatrix = map.viewMatrix,
            projMatrix = map.projMatrix,
            uMatrix = mat4.translate([], viewMatrix, map.cameraPosition),
            cameraToCenterDistance = map.cameraToCenterDistance,
            canvasSize = [this.canvas.width, this.canvas.height];
        uMatrix[12] = uMatrix[13] = uMatrix[14] = 0;
        return {
            viewMatrix, projMatrix, uMatrix,
            cameraToCenterDistance, canvasSize
        };
    }
}

export default PointPainter;
