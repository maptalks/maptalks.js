import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import Painter from './Painter';

const vert = `
    attribute vec3 aPosition;
    attribute vec3 aColor;

    uniform mat4 projViewModelMatrix;

    varying vec3 vColor;

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

    varying vec3 vColor;

    void main()
    {
        gl_FragColor = vec4(vColor, opacity);
    }
`;

const SCALE = [1, 1, 1];

class WireframePainter extends Painter {
    constructor(regl, layer, sceneConfig, pluginIndex) {
        super(regl, layer, sceneConfig, pluginIndex);
        this.colorSymbol = 'lineColor';
    }

    createGeometry(glData) {
        const data = {
            aPosition: glData.vertices,
            aColor: glData.colors
        };
        const geometry = new reshader.Geometry(data, glData.indices, 0, { 'primitive': 'lines' });
        geometry.generateBuffers(this.regl);

        return geometry;
    }

    createMesh(geometry, transform) {
        const mesh = new reshader.Mesh(geometry);
        if (this.sceneConfig.animation) {
            SCALE[2] = 0.01;
            const mat = [];
            mat4.fromScaling(mat, SCALE);
            mat4.multiply(mat, transform, mat);
            transform = mat;
        }
        mesh.setLocalTransform(transform);
        return mesh;
    }

    addMesh(mesh, progress) {
        if (progress !== null) {
            const mat = mesh.localTransform;
            if (progress === 0) {
                progress = 0.01;
            }
            SCALE[2] = progress;
            mat4.fromScaling(mat, SCALE);
            mat4.multiply(mat, mesh.properties.tileTransform, mat);
            mesh.setLocalTransform(mat);
        } else {
            mesh.setLocalTransform(mesh.properties.tileTransform);
        }
        this.scene.addMesh(mesh);
        return this;
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
                },
                'opacity'
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
                    func: {
                        src: 'src alpha',
                        dst: 'one minus src alpha'
                    },
                    equation: 'add'
                },
                viewport
            }
        };

        this.shader = new reshader.MeshShader(config);
    }

    getUniformValues(map) {
        const projViewMatrix = map.projViewMatrix;
        const opacity = this.sceneConfig.opacity || 0.3;
        return {
            projViewMatrix,
            opacity
        };
    }
}

export default WireframePainter;
