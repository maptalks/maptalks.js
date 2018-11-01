import Painter from './Painter';
import { reshader, vec3, mat4 } from '@maptalks/gl';
import Color from 'color';
import vert from './glsl/text.vert';
import frag from './glsl/text.frag';
import pickingVert from './glsl/text.picking.vert';

const defaultUniforms = {
    'textFill' : [0, 0, 0, 1],
    'textOpacity' : 1,
    'pitchWithMap' : 0,
    'rotateWithMap' : 0,
    'textHaloRadius' : 0,
    'textHaloFill' : [1, 1, 1, 1],
    'textHaloBlur' : 0,
    'textHaloOpacity' : 1,
    'isHalo' : 0,
    'fadeOpacity' : 1,
    'textPerspectiveRatio' : 0
};

class TextPainter extends Painter {
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
            const isAlongLine = symbol['textPlacement'] === 'line';
            const uniforms = {
                tileResolution : geometry.properties.res
            };
            let transparent = false;
            if (symbol['textOpacity'] || symbol['textOpacity'] === 0) {
                uniforms.textOpacity = symbol['textOpacity'];
                if (symbol['textOpacity'] < 1) {
                    transparent = true;
                }
            }

            if (symbol['textFill']) {
                const color = Color(symbol['textFill']);
                uniforms.textFill = color.unitArray();
                if (uniforms.textFill.length === 3) {
                    uniforms.textFill.push(1);
                }
            }

            if (symbol['textHaloFill']) {
                const color = Color(symbol['textHaloFill']);
                uniforms.textHaloFill = color.unitArray();
                if (uniforms.textHaloFill.length === 3) {
                    uniforms.textHaloFill.push(1);
                }
            }

            if (symbol['textHaloRadius']) {
                uniforms.textHaloRadius = symbol['textHaloRadius'];
                uniforms.isHalo = 1;
            }

            if (symbol['textHaloOpacity']) {
                uniforms.textHaloOpacity = symbol['textHaloOpacity'];
            }

            if (symbol['textPerspectiveRatio']) {
                uniforms.textPerspectiveRatio = symbol['textPerspectiveRatio'];
            }

            if (symbol['textRotationAlignment'] === 'map' || isAlongLine) {
                uniforms.rotateWithMap = 1;
            }

            if (isAlongLine) {
                const aOffset = geometry.data.aOffset0;
                uniforms.firstOffset = [aOffset[0], aOffset[1], 0];
                uniforms.lastOffset = [aOffset[aOffset.length - 2], aOffset[aOffset.length - 1], 0];
                //TODO 判断是否是vertical 字符
                uniforms.isVerticalChar = true;
            }

            const glyphAtlas = geometry.properties.glyphAtlas;
            uniforms['texture'] = glyphAtlas;
            uniforms['texSize'] = [glyphAtlas.width, glyphAtlas.height];

            if (symbol['textPitchAlignment'] === 'map') {
                uniforms.pitchWithMap = 1;
            }
            geometry.generateBuffers(this.regl);
            const material = new reshader.Material(uniforms, defaultUniforms);
            const mesh = new reshader.Mesh(geometry, material, {
                transparent,
                castShadow : false,
                picking : true
            });
            if (symbol['textPlacement'] === 'line') {
                mesh.setDefines({
                    'ALONG_LINE' : 1
                });
            }
            mesh.setLocalTransform(transform);
            meshes.push(mesh);

            if (uniforms.isHalo) {
                uniforms.isHalo = 0;
                const material = new reshader.Material(uniforms, defaultUniforms);
                const mesh = new reshader.Mesh(geometry, material, {
                    transparent,
                    castShadow : false,
                    picking : true
                });
                if (symbol['textPlacement'] === 'line') {
                    mesh.setDefines({
                        'ALONG_LINE' : 1
                    });
                }
                mesh.setLocalTransform(transform);
                meshes.push(mesh);
            }
        }
        return meshes;
    }


    remove() {
        this._shader.dispose();
    }

    init() {
        const map = this.layer.getMap();
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

        const firstPoint = [], lastPoint = [];
        const uniforms = [
            'cameraToCenterDistance',
            {
                name : 'projViewModelMatrix',
                type : 'function',
                fn : function (context, props) {
                    return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                }
            },
            'textPerspectiveRatio',
            'texSize',
            'canvasSize',
            'glyphSize',
            'pitchWithMap',
            'mapPitch',
            'texture',
            'gammaScale',
            'textFill',
            'textOpacity',
            'textHaloRadius',
            'textHaloFill',
            'textHaloBlur',
            'textHaloOpacity',
            'isHalo',
            'fadeOpacity',
            'resolution',
            'tileResolution',
            'planeMatrix',
            'rotateWithMap',
            'mapRotation',
            {
                name : 'isFlip',
                type : 'function',
                fn : function (context, props) {
                    const planeMatrix = props['planeMatrix'];
                    const first = props['firstOffset'],
                        last = props['lastOffset'];
                    vec3.transformMat3(firstPoint, first, planeMatrix);
                    vec3.transformMat3(lastPoint, last, planeMatrix);
                    if (props['isVerticalChar']) {
                        const aspectRatio = map.width / map.height;
                        const rise = Math.abs(lastPoint[1] - firstPoint[1]);
                        const run = Math.abs(lastPoint[0] - firstPoint[0]) * aspectRatio;
                        if (rise > run) {
                            return firstPoint[1] <= lastPoint[1] ? 1 : 0;
                        } else {
                            return firstPoint[0] > lastPoint[0] ? 1 : 0;
                        }
                    } else {
                        return firstPoint[0] > lastPoint[0] ? 1 : 0;
                    }
                }
            },
            {
                name : 'isVertical',
                type : 'function',
                fn : function (context, props) {
                    if (!props['isVerticalChar']) {
                        return 0;
                    }
                    const planeMatrix = props['planeMatrix'];
                    const first = props['firstOffset'],
                        last = props['lastOffset'];
                    vec3.transformMat3(firstPoint, first, planeMatrix);
                    vec3.transformMat3(lastPoint, last, planeMatrix);
                    const aspectRatio = map.width / map.height;
                    const rise = Math.abs(lastPoint[1] - firstPoint[1]);
                    const run = Math.abs(lastPoint[0] - firstPoint[0]) * aspectRatio;
                    return rise > run ? 1 : 0;
                }
            }
        ];

        this._shader = new reshader.MeshShader({
            vert, frag,
            uniforms,
            extraCommandProps : {
                viewport, scissor,
                blend: {
                    enable: true,
                    func: {
                        src: 'src alpha',
                        dst: 'one minus src alpha'
                    },
                    equation: 'add'
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
                        'textPerspectiveRatio',
                        'canvasSize',
                        'glyphSize',
                        'pitchWithMap',
                        'mapPitch',
                        'resolution',
                        'tileResolution',
                        'planeMatrix',
                        'rotateWithMap',
                        'mapRotation'
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
        //手动构造map的x与z轴的三维旋转矩阵
        //http://planning.cs.uiuc.edu/node102.html
        const pitch = map.getPitch() * Math.PI / 180,
            bearing = -map.getBearing() * Math.PI / 180;
        const angleCos = Math.cos(bearing),
            angleSin = Math.sin(bearing),
            pitchCos = Math.cos(pitch),
            pitchSin = Math.sin(pitch);
        const planeMatrix = [
            angleCos, -1.0 * angleSin * pitchCos, angleSin * pitchSin,
            angleSin, angleCos * pitchCos, -1.0 * angleCos * pitchSin,
            0.0, pitchSin, pitchCos
        ];

        return {
            mapPitch : map.getPitch() * Math.PI / 180,
            mapRotation : map.getBearing() * Math.PI / 180,
            projViewMatrix,
            cameraToCenterDistance, canvasSize,
            glyphSize : 24,
            gammaScale : 2,
            resolution : map.getResolution(),
            planeMatrix
        };
    }
}

export default TextPainter;
