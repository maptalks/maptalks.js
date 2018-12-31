import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';

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

const level0Filter = mesh => {
    return mesh.uniforms['level'] === 0;
};

const levelNFilter = mesh => {
    return mesh.uniforms['level'] > 0;
};

const SCALE = [1, 1, 1];

class WireframePainter {
    constructor(regl, layer, sceneConfig) {
        this._layer = layer;
        this._canvas = layer.getRenderer().canvas;
        this._regl = regl;
        this._redraw = false;
        this.colorSymbol = 'lineColor';
        this._sceneConfig = sceneConfig || {};
        this._init();
    }

    needToRedraw() {
        return this._redraw;
    }

    createGeometry(glData) {
        const data = {
            aPosition : glData.vertices,
            aColor : glData.colors
        };
        const geometry = new reshader.Geometry(data, glData.indices, 0, { 'primitive' : 'lines' });
        geometry.generateBuffers(this._regl);

        return geometry;
    }

    createMesh(geometry, transform) {
        const mesh = new reshader.Mesh(geometry);
        if (this._sceneConfig.animation) {
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
        this._scene.addMesh(mesh);
        return this;
    }

    render() {
        this._redraw = false;
        const layer = this._layer;
        const map = layer.getMap();
        if (!map) {
            return {
                redraw : false
            };
        }

        const uniforms = this.getUniformValues(map);

        this._regl.clear({
            stencil: 0xFF
        });
        this._shader.filter = level0Filter;
        this._renderer.render(this._shader, uniforms, this._scene);

        this._shader.filter = levelNFilter;
        this._renderer.render(this._shader, uniforms, this._scene);

        return {
            redraw : false
        };
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

    _init() {
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

        const config = {
            vert,
            frag,
            uniforms : this._getUniforms(),
            defines : null,
            extraCommandProps : {
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
                viewport, scissor
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
            },
            'opacity'
        ];

        return uniforms;
    }

    getUniformValues(map) {
        const projViewMatrix = map.projViewMatrix;
        const opacity = this._sceneConfig.opacity || 0.3;
        return {
            projViewMatrix,
            opacity
        };
    }
}

export default WireframePainter;
