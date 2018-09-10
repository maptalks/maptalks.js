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

class WireframePainter {
    constructor(regl, layer, sceneConfig) {
        this.layer = layer;
        this.regl = regl;
        this._redraw = false;
        this.meshCache = {};
        this.colorSymbol = 'lineColor';
        this.sceneConfig = sceneConfig || {};
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
        geometry.generateBuffers(this.regl);

        return geometry;
    }

    addMesh(key, geometry, transform) {
        const mesh = new reshader.Mesh(geometry, this.material);
        mesh.setLocalTransform(transform);
        this.meshCache[key] = mesh;
        this.scene.addMesh(mesh);
        return mesh;
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

        this.regl.clear({
            stencil: 0xFF
        });
        this.shader.filter = level0Filter;
        this.renderer.render(this.shader, uniforms, this.scene);

        this.shader.filter = levelNFilter;
        this.renderer.render(this.shader, uniforms, this.scene);

        return {
            redraw : false
        };
    }

    getMesh(key) {
        return this.meshCache[key];
    }

    delete(key) {
        const mesh = this.meshCache[key];
        if (mesh) {
            const geometry = mesh.geometry;
            geometry.dispose();
            mesh.dispose();
            delete this.meshCache[key];
        }
    }

    clear() {
        this.meshCache = {};
        this.scene.clear();
    }

    remove() {
        delete this.meshCache;
        this.material.dispose();
        this.shader.dispose();
    }

    resize() {}

    _init() {
        const regl = this.regl;

        const map = this.layer.getMap();

        this.scene = new reshader.Scene();

        this.renderer = new reshader.Renderer(regl);

        const viewport = {
            x : 0,
            y : 0,
            width : () => {
                return this.layer ? map.width : 1;
            },
            height : () => {
                return this.layer ? map.height : 1;
            }
        };
        const scissor = {
            enable: true,
            box: {
                x : 0,
                y : 0,
                width : () => {
                    return this.layer ? map.width : 1;
                },
                height : () => {
                    return this.layer ? map.height : 1;
                }
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

        this.shader = new reshader.MeshShader(config);

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

    _getUniformValues(map) {
        const projViewMatrix = map.projViewMatrix;
        const opacity = this.sceneConfig.opacity || 0.3;
        return {
            projViewMatrix,
            opacity
        };
    }
}

export default WireframePainter;
