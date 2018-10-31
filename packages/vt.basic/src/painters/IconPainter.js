import Painter from './Painter';
import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import vert from './glsl/marker.vert';
import frag from './glsl/marker.frag';
import pickingVert from './glsl/marker.picking.vert';

const defaultUniforms = {
    'markerOpacity' : 1,
    'pitchWithMap' : 0,
    'markerPerspectiveRatio' : 0
};

class PointPainter extends Painter {
    needToRedraw() {
        return this._redraw;
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
            const uniforms = {};

            let transparent = false;
            if (symbol['markerOpacity'] || symbol['markerOpacity'] === 0) {
                uniforms.markerOpacity = symbol['markerOpacity'];
                if (symbol['markerOpacity'] < 1) {
                    transparent = true;
                }
            }

            const iconAtlas = geometry.properties.iconAtlas;
            uniforms['texture'] = iconAtlas;
            uniforms['texSize'] = [iconAtlas.width, iconAtlas.height];

            if (symbol['markerPitchAlignment'] === 'map') {
                uniforms['pitchWithMap'] = 1;
            }

            if (symbol['markerPerspectiveRatio']) {
                uniforms['markerPerspectiveRatio'] = symbol['markerPerspectiveRatio'];
            }

            const material = new reshader.Material(uniforms, defaultUniforms);
            const mesh = new reshader.Mesh(geometry, material, {
                transparent,
                castShadow : false,
                picking : true
            });
            mesh.setLocalTransform(transform);
            meshes.push(mesh);
        }
        return meshes;
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
                        return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                    }
                },
                'texSize',
                'canvasSize',
                'pitchWithMap',
                'mapPitch',
                'markerPerspectiveRatio',
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
                    enable: true,
                    func : 'always'
                },
            }
        });
        if (this.pickingFBO) {
            this.picking = new reshader.FBORayPicking(
                this._renderer,
                {
                    vert : pickingVert,
                    uniforms : [
                        'cameraToCenterDistance',
                        {
                            name : 'projViewModelMatrix',
                            type : 'function',
                            fn : function (context, props) {
                                return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                            }
                        },
                        'canvasSize',
                        'pitchWithMap',
                        'mapPitch',
                        'markerPerspectiveRatio'
                    ]
                },
                this.pickingFBO
            );
        }
    }

    getUniformValues(map) {
        const projViewMatrix = map.projViewMatrix,
            cameraToCenterDistance = map.cameraToCenterDistance,
            canvasSize = [this.canvas.width, this.canvas.height];
        return {
            mapPitch : map.getPitch() * Math.PI / 180,
            projViewMatrix,
            cameraToCenterDistance, canvasSize
        };
    }
}

export default PointPainter;
