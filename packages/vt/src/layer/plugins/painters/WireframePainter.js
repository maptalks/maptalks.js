import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import Painter from './Painter';
// import { toUint8ColorInGlobalVar } from '../Util';

const vert = `
    attribute vec3 aPosition;
    attribute vec4 aColor;

    uniform mat4 projViewModelMatrix;
    uniform vec2 outSize;

    varying vec4 vColor;

    void main()
    {
        gl_Position = projViewModelMatrix * vec4(aPosition, 1.0);
        vColor = aColor / 255.0;
    }
`;

const frag = `
    #ifdef GL_ES
        precision lowp float;
    #endif

    uniform float opacity;

    varying vec4 vColor;

    void main()
    {
        gl_FragColor = vColor * opacity;
    }
`;

const SCALE = [1, 1, 1];

class WireframePainter extends Painter {

    createGeometry(glData) {
        const { data, indices } = glData;
        const geometry = new reshader.Geometry(data, indices, 0, { 'primitive': 'lines' });
        geometry.generateBuffers(this.regl);
        return {
            geometry,
            symbolIndex: { index: 0 }
        };
    }

    createMesh(geo, transform) {
        const { geometry } = geo;
        const mesh = new reshader.Mesh(geometry);
        mesh.castShadow = false;
        if (this.sceneConfig.animation) {
            SCALE[2] = 0.01;
            const mat = [];
            mat4.fromScaling(mat, SCALE);
            mat4.multiply(mat, transform, mat);
            transform = mat;
        }
        mesh.setLocalTransform(transform);
        mesh.properties.symbolIndex = { index: 0 };
        // mat4.fromScaling(mesh.positionMatrix, [1.1, 1.1, 1.1]);
        return mesh;
    }

    addMesh(mesh, progress) {
        if (!mesh.length) {
            return this;
        }
        let mat;
        if (progress !== null) {
            if (progress === 0) {
                progress = 0.01;
            }
            mat = mesh[0].localTransform;
            SCALE[2] = progress;
            mat4.fromScaling(mat, SCALE);
            mat4.multiply(mat, mesh[0].properties.tileTransform, mat);
        } else {
            mat = mesh[0].properties.tileTransform;
        }
        for (let i = 0; i < mesh.length; i++) {
            mesh[i].setLocalTransform(mat);
        }
        this.scene.addMesh(mesh);
        return this;
    }

    init() {
        const regl = this.regl;

        this.scene = new reshader.Scene();

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
            extraCommandProps: {
                stencil: {
                    enable: true,
                    func: {
                        cmp: '<=',
                        ref: (context, props) => {
                            return props.level;
                        },
                        // mask: 0xff
                    },
                    op: {
                        fail: 'keep',
                        zfail: 'keep',
                        zpass: 'replace'
                    }
                },
                blend: {
                    enable: true,
                    func: this.getBlendFunc(),
                    equation: 'add'
                },
                viewport
            }
        };

        this.shader = new reshader.MeshShader(config);
    }

    getUniformValues(map) {
        const opacity = this.sceneConfig.opacity || 0.3;
        const canvas = this.layer.getRenderer().canvas;
        return {
            projViewMatrix: map.projViewMatrix,
            outSize: [canvas.width, canvas.height],
            opacity
        };
    }
}

export default WireframePainter;
