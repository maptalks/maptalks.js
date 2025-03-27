import { reshader, mat4, vec3 } from '@maptalks/gl';

const vertices = new Uint16Array([
    0, 0,
    0, 1,
    1, 0,
    1, 0,
    0, 1,
    1, 1
]);

const vert = `
#define SHADER_NAME TILE_STENCIL_VERT
attribute vec2 aPosition;
uniform mat4 projViewModelMatrix;

void main()
{
    gl_Position = projViewModelMatrix * vec4(aPosition, 0.0, 1.0);
}
`;

const frag = `
#define SHADER_NAME TILE_STENCIL_FRAG
void main()
{
    gl_FragColor = vec4(1.0, 0.0, 0.0, 0.1);
}
`;

const wgslVert = `
@group(0) @binding(0) var<uniform> projViewModelMatrix : mat4x4f;
@vertex
fn main(
    @location(0) aPosition : vec2u
    ) -> @builtin(position) vec4f {
    return projViewModelMatrix * vec4f(vec2f(aPosition), 0.0, 1.0);
}
`;

const wgslFrag = `
@fragment
fn main() -> @location(0) vec4f {
  return vec4(1.0, 0.0, 0.0, 0.1);
}
`;

const V = [];

//TODO 可以把ref值相同的tile合并在一起，一次性绘制

export default class TileStencilRenderer {
    constructor(regl, canvas, map) {
        this._regl = regl;
        const geometry = this._geometry = new reshader.Geometry({
            aPosition: vertices
        }, null, vertices.length / 2, { positionSize: 2 });
        geometry.generateBuffers(regl);
        this._scene = new reshader.Scene();
        this._meshes = [];
        this._counter = 0;
        this._canvas = canvas;
        this._map = map;
        this._init(regl);
    }

    start() {
        this._counter = 0;
        this._scene.clear();
    }

    /**
     * 添加一个瓦片
     * @param {Number} ref - stencil ref value
     * @param {Number} extent - vector tile extent: 4096 or 8192
     * @param {Number[]} transform - tile transform matrix
     */
    add(ref, EXTENT, transform) {
        const mesh = this._getMesh(transform);
        mesh.setUniform('ref', ref);
        vec3.set(V, EXTENT, EXTENT, 1);
        const matrix = mesh.localTransform;
        mat4.fromScaling(matrix, V);
        mat4.mul(matrix, transform, matrix);
        mesh.setLocalTransform(matrix);
        this._scene.addMesh(mesh);
    }

    render(fbo) {
        this._renderer.render(
            this._shader,
            {
                projViewMatrix: this._map.projViewMatrix
            },
            this._scene,
            fbo
        );
    }

    _getMesh() {
        const index = this._counter++;
        if (!this._meshes[index]) {
            this._meshes[index] = new reshader.Mesh(this._geometry);
        }
        return this._meshes[index];
    }

    _init(regl) {
        const canvas = this._canvas;
        const viewport = {
            x: 0,
            y: 0,
            width: () => {
                return canvas.width;
            },
            height: () => {
                return canvas.height;
            }
        };
        const extraCommandProps = {
            viewport,
            stencil: {
                enable: true,
                func: {
                    cmp: 'always',
                    ref: (context, props) => {
                        return props.ref;
                    }
                },
                op: {
                    fail: 'replace',
                    zfail: 'replace',
                    zpass: 'replace'
                }
            },
            depth: {
                enable: true,
                func: 'always',
                mask: false
            },
            colorMask: [false, false, false, false],
        };
        this._shader = new reshader.MeshShader({
            name: 'tile-stencil',
            vert,
            frag,
            wgslVert,
            wgslFrag,
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
            ],
            extraCommandProps
        });
        this._renderer = new reshader.Renderer(regl);
    }

    remove() {
        this._geometry.dispose();
        for (let i = 0; i < this._meshes.length; i++) {
            this._meshes[i].dispose();
        }
        this._meshes.length = 0;
        this._shader.dispose();
    }
}
