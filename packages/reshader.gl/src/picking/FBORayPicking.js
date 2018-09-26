import { interpolate } from '../common/Util';
import { mat4 } from 'gl-matrix';
import MeshShader from '../shader/MeshShader';
import Scene from '../Scene';
import { pack3, packDepth } from './PickingUtil';

const unpackFun = `
    vec3 unpack(highp float f) {
        highp vec3 color;
        color.b = floor(f / 65536.0);
        color.g = floor((f - color.b * 65536.0) / 256.0);
        color.r = f - floor(color.b * 65536.0) - floor(color.g * 256.0);
        // now we have a vec3 with the 3 components in range [0..255]. Let's normalize it!
        return color / 255.0;
    }
`;

const frag0 = `
    precision highp float;

    varying float vPickingId;

    uniform float fbo_picking_meshId;

    ${unpackFun}

    void main() {
        gl_FragColor = vec4(unpack(vPickingId), fbo_picking_meshId / 255.0);
    }
`;

const frag1 = `
    precision highp float;

    uniform int fbo_picking_meshId;

    ${unpackFun}

    void main() {
        gl_FragColor = vec4(unpack(float(fbo_picking_meshId)), 1.0);
        // gl_FragColor = vec4(unpack(float(35)), 1.0);
    }
`;

const frag2 = `
    precision highp float;

    varying float vPickingId;

    ${unpackFun}

    void main() {
        gl_FragColor = vec4(unpack(vPickingId), 1.0);
    }
`;

//from https://github.com/mikolalysenko/glsl-read-float
const depthFrag = `
    #define SHADER_NAME depth
    #define FLOAT_MAX  1.70141184e38
    #define FLOAT_MIN  1.17549435e-38

    precision highp float;
    varying float vFbo_picking_viewZ;

    lowp vec4 unpack(highp float v) {
        highp float av = abs(v);

        //Handle special cases
        if(av < FLOAT_MIN) {
            return vec4(0.0, 0.0, 0.0, 0.0);
        } else if(v > FLOAT_MAX) {
            return vec4(127.0, 128.0, 0.0, 0.0) / 255.0;
        } else if(v < -FLOAT_MAX) {
            return vec4(255.0, 128.0, 0.0, 0.0) / 255.0;
        }

        highp vec4 c = vec4(0,0,0,0);

        //Compute exponent and mantissa
        highp float e = floor(log2(av));
        highp float m = av * pow(2.0, -e) - 1.0;

        //Unpack mantissa
        c[1] = floor(128.0 * m);
        m -= c[1] / 128.0;
        c[2] = floor(32768.0 * m);
        m -= c[2] / 32768.0;
        c[3] = floor(8388608.0 * m);

        //Unpack exponent
        highp float ebias = e + 127.0;
        c[0] = floor(ebias / 2.0);
        ebias -= c[0] * 2.0;
        c[1] += floor(ebias) * 128.0;

        //Unpack sign bit
        c[0] += 128.0 * step(0.0, -v);

        //Scale back to range
        return c / 255.0;
    }

    void main() {
        gl_FragColor = unpack(vFbo_picking_viewZ);
        // gl_FragColor = unpack(34678.3456789);
    }
`;

const pixels = new Uint8Array(4);

export default class FBORayPicking {

    constructor(renderer, { vert, uniforms, defines, extraCommandProps }, fbo) {
        this._renderer = renderer;
        this._fbo = fbo;
        this._vert = vert;
        this._uniforms = uniforms;
        this._defines = defines;
        this._extraCommandProps = extraCommandProps;
        this._init();
    }

    _init() {
        const uniforms = ['fbo_picking_meshId'];
        if (this._uniforms) {
            uniforms.push(...this._uniforms);
        }
        const defines = {
            'ENABLE_PICKING' : 1,
            'USE_PICKING_ID' : 1
        };
        if (this._defines) {
            for (const p in this._defines) {
                defines[p] = this._defines[p];
            }
        }
        const vert = this._vert,
            extraCommandProps = this._extraCommandProps;
        this._shader0 = new MeshShader({
            vert,
            frag : frag0,
            uniforms,
            defines,
            extraCommandProps
        });
        this._shader2 = new MeshShader({
            vert,
            frag : frag2,
            uniforms,
            defines,
            extraCommandProps
        });
        const defines1 = {
            'ENABLE_PICKING' : 1
        };
        if (this._defines) {
            for (const p in this._defines) {
                defines1[p] = this._defines[p];
            }
        }
        this._shader1 = new MeshShader({
            vert,
            frag : frag1,
            uniforms,
            defines : defines1,
            extraCommandProps
        });
        this._depthShader = new MeshShader({
            vert,
            frag : depthFrag,
            uniforms,
            defines : defines1,
            extraCommandProps
        });
        this._scene = new Scene();
        this._scene1 = new Scene();
    }

    render(meshes, uniforms) {
        delete this._currentMeshes;
        delete this._currentShader;
        if (!meshes || !meshes.length) {
            return this;
        }
        const fbo = this._fbo;
        this._clearFbo(fbo);

        this._scene.setMeshes(meshes);
        const shader = this._getShader(meshes);
        this._currentShader = shader;
        this._currentMeshes = meshes;
        meshes.forEach((m, idx) => {
            m.setUniform('fbo_picking_meshId', idx);
        });
        this._renderer.render(shader, uniforms, this._scene, fbo);
        return this;
    }

    pick(x, y, uniforms, options = {}) {
        const shader = this._currentShader;
        const meshes = this._currentMeshes;
        if (!shader || !meshes || !meshes.length) {
            return {
                pickingId : null,
                meshId : null,
                point : null
            };
        }

        x = Math.round(x);
        y = Math.round(y);

        const regl = this._renderer.regl;
        const fbo = this._fbo;
        const data = regl.read({
            data : pixels,
            x, y : fbo.height - y,
            framebuffer : fbo,
            width : 1,
            height : 1
        });

        let { pickingId, meshId } = this._packData(data, shader);
        if (shader === this._shader1 && meshes[0].geometry.data['aPickingId']) {
            //TODO 再次渲染，获得aPickingId
            pickingId = this._getPickingId(x, y, meshes[meshId], uniforms);
        }
        let point = null;
        if (meshes[meshId] && options['returnPoint']) {
            const { viewMatrix, projMatrix } = options;
            const depth = this._pickDepth(x, y, meshes[meshId], uniforms, pickingId);
            point = this._getWorldPos(x, y, depth, viewMatrix, projMatrix);
        }

        return {
            pickingId,
            meshId,
            point
        };
    }

    getMeshAt(idx) {
        if (!this._currentMeshes) {
            return null;
        }
        return this._currentMeshes[idx];
    }

    _getWorldPos(x, y, depth, viewMatrix, projMatrix) {
        const fbo = this._fbo;
        const mat = [];

        const w2 = fbo.width / 2 || 1, h2 = fbo.height / 2 || 1;
        const cp0 = [(x - w2) / w2, (h2 - y) / h2, 0, 1],
            cp1 = [(x - w2) / w2, (h2 - y) / h2, 1, 1];

        const inverseProjMatrix = mat4.invert(mat, projMatrix);
        const vcp0 = [], vcp1 = [];
        applyMatrix(vcp0, cp0, inverseProjMatrix);
        applyMatrix(vcp1, cp1, inverseProjMatrix);
        const n = -vcp0[2], f = -vcp1[2];
        const t = (depth - n) / (f - n);

        const projViewMatrix = mat4.multiply(mat, projMatrix, viewMatrix);
        const inverseProjViewMatrix = mat4.invert(mat, projViewMatrix);
        const near = applyMatrix(cp0, cp0, inverseProjViewMatrix),
            far = applyMatrix(cp1, cp1, inverseProjViewMatrix);

        return [interpolate(near[0], far[0], t), interpolate(near[1], far[1], t), interpolate(near[2], far[2], t)];
    }

    _getPickingId(x, y, mesh, uniforms) {
        const regl = this._renderer.regl;
        const fbo1 = this._getFBO1();
        this._clearFbo(fbo1);
        this._scene1.setMeshes([mesh]);
        this._renderer.render(this._shader2, uniforms, this._scene1, fbo1);
        const data = regl.read({
            x, y : fbo1.height - y,
            framebuffer : fbo1,
            width : 1,
            height : 1
        });
        return pack3(data);
    }

    _pickDepth(x, y, mesh, uniforms) {
        const regl = this._renderer.regl;
        const fbo1 = this._getFBO1();
        //second render to find depth value of point

        // const { count, offset } = this._getPartialMeshForPicking(mesh, pickingId);

        // const geometry = mesh.geometry;
        // geometry.setDrawCount(count);
        // geometry.setOffset(offset);

        this._scene1.setMeshes([mesh]);
        this._clearFbo(fbo1);

        this._renderer.render(this._depthShader, uniforms, this._scene1, fbo1);

        // geometry.setDrawCount(null);
        // geometry.setOffset(0);

        const data = regl.read({
            x, y : fbo1.height - y,
            framebuffer : fbo1,
            width : 1,
            height : 1
        });
        // console.log(data);
        return packDepth(data);
    }

    _packData(data, shader) {
        if (data[0] === 255 && data[1] === 255 &&
            data[2] === 255 && data[3] === 255) {
            return {
                meshId : null,
                pickingId : null
            };
        }
        let pickingId, meshId;
        if (shader === this._shader1) {
            //only fbo_picking_meshId
            meshId = pack3(data);
        } else if (shader === this._shader0) {
            meshId = data[3];
            pickingId = pack3(data);
        } else {
            meshId = null;
            pickingId = pack3(data);
        }
        return { meshId, pickingId };
    }

    _clearFbo(framebuffer) {
        this._renderer.regl.clear({
            color: [1, 1, 1, 1],
            depth: 1,
            stencil: 0,
            framebuffer
        });
    }

    _getShader(meshes) {
        const mesh = meshes[0];
        if (!mesh.geometry.data['aPickingId']) {
            //only fbo_picking_meshId
            return this._shader1;
        }
        if (meshes.length < 256) {
            return this._shader0;
        }
        return this._shader2;
    }

    _getFBO1() {
        const regl = this._renderer.regl;
        const fbo = this._fbo;
        if (!this._fbo1) {
            this._fbo1 = regl.framebuffer(fbo.width, fbo.height);
        } else if (this._fbo1.width !== fbo.width || this._fbo1.height !== fbo.height) {
            this._fbo1.resize(fbo.width, fbo.height);
        }
        return this._fbo1;
    }

    // _getPartialMeshForPicking(mesh, pickingId) {
    //     if (!mesh.geometry.rawData || !mesh.geometry.rawData.aPickingId) {
    //         return { count : null, offset : 0 };
    //     }
    //     let pickingMap = mesh._pickingIdMap;
    //     if (!pickingMap) {
    //         const pickingIds = mesh.geometry.rawData.aPickingId;
    //         const map = {};
    //         let offset = 0;
    //         let prev = pickingIds[0];
    //         for (let i = 1, l = pickingIds.length; i < l; i++) {
    //             if (pickingIds[i] !== prev || i === l - 1) {
    //                 map[prev] = {
    //                     offset,
    //                     count : i === l - 1 ? l - offset : i - offset
    //                 };
    //                 offset = i;
    //                 prev = pickingIds[i];
    //             }
    //         }
    //         pickingMap = mesh._pickingIdMap = map;
    //     }

    //     return pickingMap[pickingId];
    // }
}

function applyMatrix(out, v, e) {
    const x = v[0], y = v[1], z = v[2];
    // const e = in;

    const w = 1 / (e[ 3 ] * x + e[ 7 ] * y + e[ 11 ] * z + e[ 15 ]);

    out[0] = (e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z + e[ 12 ]) * w;
    out[1] = (e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z + e[ 13 ]) * w;
    out[2] = (e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z + e[ 14 ]) * w;

    return out;
}
