import Painter from './Painter';
import { reshader, vec3, mat4 } from '@maptalks/gl';
import Color from 'color';
import vert from './glsl/text.vert';
import vertAlongLine from './glsl/text.line.vert';
import frag from './glsl/text.frag';
import pickingVert from './glsl/text.picking.vert';

const shaderFilter0 = mesh => {
    return mesh.uniforms['level'] === 0 && !mesh.geometry.data.aOffset1;
};

const shaderFilterN = mesh => {
    return mesh.uniforms['level'] > 0 && !mesh.geometry.data.aOffset1;
};

const shaderLineFilter0 = mesh => {
    return mesh.uniforms['level'] === 0 && mesh.geometry.data.aOffset1;
};

const shaderLineFilterN = mesh => {
    return mesh.uniforms['level'] > 0 && mesh.geometry.data.aOffset1;
};

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
            let geometry = geometries[packMeshes[i].pack];
            if (geometry.data.aPosition.length === 0) {
                continue;
            }
            const symbol = packMeshes[i].symbol;
            geometry.properties.symbol = symbol;
            const uniforms = {
                tileResolution : geometry.properties.res,
                tileRatio : geometry.properties.tileRatio
            };

            const isAlongLine = (symbol['textPlacement'] === 'line');
            if (isAlongLine) {
                const aOffset1 = geometry.data.aOffset1;
                //aNormal = [isFlip, isVertical, ...];
                const aNormal = {
                    usage : 'dynamic',
                    data : new Uint8Array(aOffset1.length / 2)
                };
                geometry.data.aNormal = geometry.properties.aNormal = aNormal;
                geometry.properties.aOffset1 = aOffset1;
                geometry.properties.aPickingId = geometry.data.aPickingId;
                //TODO 增加是否是vertical字符的判断
                uniforms.isVerticalChar = true;
            }

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

            if (symbol['textPitchAlignment'] === 'map' || isAlongLine) {
                uniforms.pitchWithMap = 1;
            }

            const glyphAtlas = geometry.properties.glyphAtlas;
            uniforms['texture'] = glyphAtlas;
            uniforms['texSize'] = [glyphAtlas.width, glyphAtlas.height];

            geometry.generateBuffers(this.regl);
            const material = new reshader.Material(uniforms, defaultUniforms);
            const mesh = new reshader.Mesh(geometry, material, {
                transparent,
                castShadow : false,
                picking : true
            });
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
                mesh.setLocalTransform(transform);
                meshes.push(mesh);
            }
        }
        return meshes;
    }


    callShader(uniforms) {
        this._updateFlipData(uniforms);

        this._shader.filter = shaderFilter0;
        this._renderer.render(this._shader, uniforms, this.scene);

        this._shader.filter = shaderFilterN;
        this._renderer.render(this._shader, uniforms, this.scene);

        this._shaderAlongLine.filter = shaderLineFilter0;
        this._renderer.render(this._shaderAlongLine, uniforms, this.scene);

        this._shaderAlongLine.filter = shaderLineFilterN;
        this._renderer.render(this._shaderAlongLine, uniforms, this.scene);
    }

    /**
     * update flip and vertical data for each text
     */
    _updateFlipData() {
        const map = this.layer.getMap(),
            bearing = -map.getBearing() * Math.PI / 180;
        const angleCos = Math.cos(bearing),
            angleSin = Math.sin(bearing),
            pitchCos = Math.cos(0),
            pitchSin = Math.sin(0);
        const planeMatrix = [
            angleCos, -1.0 * angleSin * pitchCos, angleSin * pitchSin,
            angleSin, angleCos * pitchCos, -1.0 * angleCos * pitchSin,
            0.0, pitchSin, pitchCos
        ];

        const firstPoint = [0, 0, 0], lastPoint = [0, 0, 0];

        const aspectRatio = map.width / map.height;
        const meshes = this.scene.getMeshes();
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            const geometry = mesh.geometry;
            const aNormal = geometry.properties.aNormal;
            if (!aNormal) {
                continue;
            }
            const uniforms = mesh.material.uniforms;
            const offset = geometry.properties.aOffset1,
                //pickingId中是feature序号，相同的pickingId对应着相同的feature
                pickingId = geometry.properties.aPickingId;
            let start = 0, current = pickingId[0];
            for (let i = 1; i < pickingId.length; i++) {
                //pickingId发生变化时，找到第一个和最后一个文字的offset
                if (pickingId[i] !== current || i === pickingId.length - 1) {
                    const firstChrIdx = start * 2,
                        lastChrIdx = i === pickingId.length - 1 ? pickingId.length * 2 : i * 2;
                    //first char's offset
                    vec3.set(firstPoint, offset[firstChrIdx], offset[firstChrIdx + 1], 0);
                    //last char's offset
                    vec3.set(lastPoint, offset[lastChrIdx - 2], offset[lastChrIdx - 1], 0);
                    vec3.transformMat3(firstPoint, firstPoint, planeMatrix);
                    vec3.transformMat3(lastPoint, lastPoint, planeMatrix);
                    let vertical, flip;
                    if (!uniforms['isVerticalChar']) {
                        vertical = 0;
                        flip = firstPoint[0] > lastPoint[0] ? 1 : 0;
                    } else {
                        const rise = Math.abs(lastPoint[1] - firstPoint[1]);
                        const run = Math.abs(lastPoint[0] - firstPoint[0]) * aspectRatio;
                        if (rise > run) {
                            vertical = 1;
                            flip = firstPoint[1] <= lastPoint[1] ? 1 : 0;
                        } else {
                            vertical = 0;
                            flip = firstPoint[0] > lastPoint[0] ? 1 : 0;
                        }
                    }
                    //更新normal
                    for (let ii = firstChrIdx / 2; ii < lastChrIdx / 2; ii++) {
                        aNormal.data[ii] = 2 * flip + vertical;
                    }

                    current = pickingId[i];
                    start = i;
                }

            }
            geometry.updateData('aNormal', aNormal);
        }
    }

    remove() {
        this._shader.dispose();
        this._shaderAlongLine.dispose();
    }

    init() {
        // const map = this.layer.getMap();
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

        // const firstPoint = [], lastPoint = [];
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
            'tileRatio'
        ];

        const extraCommandProps = {
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
        };

        this._shader = new reshader.MeshShader({
            vert, frag,
            uniforms,
            extraCommandProps
        });
        this._shaderAlongLine = new reshader.MeshShader({
            vert : vertAlongLine, frag,
            uniforms,
            extraCommandProps
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
                        'mapRotation',
                        'tileRatio'
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
        // const pitch = map.getPitch(),
        //     bearing = -map.getBearing();
        // const q = quat.fromEuler([], pitch, 0, bearing);
        // const planeMatrix = mat4.fromRotationTranslation([], q, [0, 0, 0]);

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
