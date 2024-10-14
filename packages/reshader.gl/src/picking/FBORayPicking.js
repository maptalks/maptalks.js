import { interpolate, extend, isNumber } from '../common/Util';
import { mat4 } from 'gl-matrix';
import MeshShader from '../shader/MeshShader';
import Scene from '../Scene';
import { pack3, packDepth } from './PickingUtil';

let TMP_POINT;
let TMP_COORD;
const TOLERANCE = [1, 1];
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

// picking id and mesh id, only when mesh's count is < 256
const frag0 = `
    precision highp float;

    varying float vPickingId;
    varying float vFbo_picking_visible;

    uniform float fbo_picking_meshId;

    ${unpackFun}

    void main() {
        if (vFbo_picking_visible == 0.0) {
            discard;
            return;
        }
        gl_FragColor = vec4(unpack(vPickingId), fbo_picking_meshId / 255.0);
    }
`;

// only mesh id
const frag1 = `
    precision highp float;

    uniform int fbo_picking_meshId;
    varying float vFbo_picking_visible;

    ${unpackFun}

    void main() {
        if (vFbo_picking_visible == 0.0) {
            discard;
            return;
        }
        gl_FragColor = vec4(unpack(float(fbo_picking_meshId)), 1.0);
        // gl_FragColor = vec4(unpack(float(35)), 1.0);
    }
`;

// only picking id
const frag2 = `
    precision highp float;

    varying float vPickingId;
    varying float vFbo_picking_visible;

    ${unpackFun}

    void main() {
        if (vFbo_picking_visible == 0.0) {
            discard;
            return;
        }
        gl_FragColor = vec4(unpack(vPickingId), 1.0);
    }
`;

//from https://github.com/mikolalysenko/glsl-read-float
// const depthFrag = `
//     #define SHADER_NAME depth

//     precision highp float;
//     varying float vFbo_picking_viewZ;

//     #include <common_pack_float>

//     void main() {
//         gl_FragColor = common_unpackFloat(vFbo_picking_viewZ);
//         // gl_FragColor = unpack(34678.3456789);
//     }
// `;

const depthFrag = `
    #ifdef GL_ES
        precision highp float;
    #endif
    #if __VERSION__ == 100 && defined(GL_EXT_frag_depth)
        #extension GL_EXT_frag_depth : enable
    #endif
    #include <gl2_frag>
    #include <common_pack_float>
    varying float vFbo_picking_viewZ;
    uniform float logDepthBufFC;
    varying float vFbo_picking_fragDepth;

    const float PackUpscale = 256. / 255.;
    const float UnpackDownscale = 255. / 256.;
    const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
    const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
    const float ShiftRight8 = 1. / 256.;
    vec4 packDepthToRGBA(const in float v ) {
        vec4 r = vec4(fract(v * PackFactors), v);
        r.yzw -= r.xyz * ShiftRight8;
        return r * PackUpscale;
    }

    void main() {
        float fragDepth = vFbo_picking_fragDepth > 1.0 ? vFbo_picking_fragDepth : vFbo_picking_viewZ + 1.0;
        #if __VERSION__ == 300 || __VERSION__ == 100 && defined(GL_EXT_frag_depth)
            gl_FragDepthEXT = log2(fragDepth) * logDepthBufFC * 0.5;
        #endif
        vec4 depthColor = packDepthToRGBA(fragDepth - 1.0);
        glFragColor = common_unpackFloat(dot(depthColor, UnpackFactors));
        #if __VERSION__ == 100
            gl_FragColor = glFragColor;
        #endif
    }
`;


export default class FBORayPicking {

    constructor(renderer, { vert, uniforms, defines, extraCommandProps }, fbo, map) {
        this._renderer = renderer;
        this._fbo = fbo;
        this._map = map;
        this._clearFbo(fbo);
        this._vert = vert;
        this._uniforms = uniforms;
        this._defines = defines;
        this._extraCommandProps = extend({}, extraCommandProps);
        delete this._extraCommandProps.blend;
        delete this._extraCommandProps.stencil;
        this._currentMeshes = [];
        this._init();
    }

    _init() {
        const uniforms = [];
        if (this._uniforms) {
            uniforms.push(...this._uniforms);
        }
        const defines = {
            'ENABLE_PICKING' : 1,
            'HAS_PICKING_ID' : 1
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
            'ENABLE_PICKING' : 1,
            'HAS_PICKING_ID' : 1
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
            frag: depthFrag,
            uniforms,
            defines : defines1,
            extraCommandProps
        });
        this._scene = new Scene();
        this._scene1 = new Scene();
    }

    filter() {
        return true;
    }

    /**
     * Render meshes to fbo for further picking
     * @param {Mesh[]} meshes - meshes to render
     * @param {Object} uniforms - uniform values
     * @param {Boolean} once - if it's an one time rendering which can gain some performance improvement
     */
    render(meshes, uniforms, once = false) {
        if (!meshes || !meshes.length) {
            return this;
        }
        const fbo = this._fbo;

        if (once) {
            this.clear();
        }
        meshes = meshes.filter(m => m && m.isValid && m.isValid());
        this._scene.setMeshes(meshes);
        const shader = this._getShader(meshes, once);
        shader.filter = this.filter;
        if (this._currentShader && shader !== this._currentShader) {
            this.clear();
        }
        this._currentShader = shader;
        meshes.forEach((m, idx) => {
            m.setUniform('fbo_picking_meshId', idx + this._currentMeshes.length);
        });
        for (let i = 0; i < meshes.length; i++) {
            this._currentMeshes.push(meshes[i]);
        }
        this._renderer.render(shader, uniforms, this._scene, fbo);
        return this;
    }

    pickAll(x, y, tolerance, uniforms, options) {
        tolerance = getTolerance(tolerance);
        const { meshIds, pickingIds, coords, points } = this._pick(x, y, tolerance, uniforms, options);
        const results = [];
        if (pickingIds && meshIds) {
            const checked = {};
            for (let i = 0; i < meshIds.length; i++) {
                const key = `${pickingIds[i]}_${meshIds[i]}`;
                if (meshIds[i] != null && pickingIds[i] != null && !checked[key]) {
                    checked[key] = true;
                    results.push({
                        meshId: meshIds[i],
                        pickingId: pickingIds[i],
                        point: points[i] || null,
                        coordinate: coords[i] || null
                    });
                }
            }
        }
        return results;
    }

    pick(x, y, tolerance, uniforms, options = {}) {
        tolerance = getTolerance(tolerance);
        const { meshIds, pickingIds, width, coords, points } = this._pick(x, y, tolerance, uniforms, options);
        if (pickingIds && meshIds) {
            //从x,y开始从内往外遍历，优先测试离x,y较近的点
            const iterDists = [];
            for (let i = 0; i <= tolerance[0]; i++) {
                iterDists.push(i);
                if (i > 0) {
                    iterDists.push(-i);
                }
            }
            for (let i = 0; i < iterDists.length; i++) { //行
                for (let j = 0; j < iterDists.length; j++) { //列
                    const ii = (iterDists[j] + tolerance[1]) * width + (iterDists[i] + tolerance[0]);
                    if (meshIds[ii] != null) {
                        return {
                            meshId: meshIds[ii],
                            pickingId: pickingIds[ii],
                            point: points[ii] || null,
                            coordinate: coords[ii] || null
                        };
                    }
                }
            }
        }
        return {
            pickingId: null,
            meshId: null,
            point: null
        };
    }

    _pick(x, y, tolerance, uniforms, options = {}) {
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

        const fbo = this._fbo;
        if (x <= 2 || x >= fbo.width - 2 ||
            y <= 2 || y >= fbo.height - 2) {
            return {
                pickingId : null,
                meshId : null,
                point : null
            };
        }

        const { px, py, width, height } = this._getParams(x, y, tolerance, fbo);
        const pixels = new Uint8Array(4 * width * height);

        const regl = this._renderer.regl;
        const data = regl.read({
            data: pixels,
            x: px,
            y: py,
            framebuffer : fbo,
            width,
            height
        });

        const meshIds = [];
        let pickingIds = [];
        for (let i = 0; i < data.length; i += 4) {
            const { pickingId, meshId } = this._packData(data.subarray(i, i + 4), shader);
            meshIds.push(meshId);
            pickingIds.push(pickingId);
        }

        const visited = {};
        const pickedMeshes = meshIds.filter(id => {
            if (id != null && !visited[id]) {
                visited[id] = 1;
                return true;
            }
            return false;
        }).map(id => meshes[id]);

        let firstMesh;
        for (let i = 0; i < pickedMeshes.length; i++) {
            if (pickedMeshes[i] && pickedMeshes[i].geometry) {
                firstMesh = pickedMeshes[i];
                break;
            }
        }
        if (!firstMesh) {
            return {
                pickingId: null,
                meshId: null,
                point: null
            };
        }
        const pickingAttr = firstMesh.geometry.desc.pickingIdAttribute;
        if (meshIds.length && shader === this._shader1 && (firstMesh.getUniform('uPickingId') !== undefined || firstMesh.geometry.data[pickingAttr])) {
            pickingIds = this._getPickingId(px, py, width, height, pixels, pickedMeshes, uniforms);
        }

        const points = [];
        const coords = [];
        if (meshIds.length && options['returnPoint']) {
            const { viewMatrix, projMatrix } = options;
            const depths = this._pickDepth(px, py, width, height, pixels, pickedMeshes, uniforms);
            for (let i = 0; i < depths.length; i++) {
                if (depths[i] && meshIds[i] != null) {
                    const point = this._getWorldPos(x, y, depths[i], viewMatrix, projMatrix);
                    const coord = this._convertPickPoint(point);
                    points.push(point);
                    coords.push(coord);
                } else {
                    points.push(null);
                    coords.push(null);
                }
            }
        }
        return { meshIds, pickingIds, coords, points, width, height };
    }

    _convertPickPoint(point) {
        const map = this._map;
        if (!map) {
            return null;
        }
        const glRes = map.getGLRes();
        if (!TMP_POINT) {
            const center = map.getCenter();
            TMP_COORD = new center.constructor(0, 0, 0);
            const point = map.coordToPoint(center);
            TMP_POINT = new point.constructor(0, 0);
        }
        TMP_POINT.set(point[0], point[1]);
        const coord = map.pointAtResToCoord(TMP_POINT, glRes, TMP_COORD);
        const altitude = map.pointAtResToAltitude(point[2], glRes);
        return [coord.x, coord.y, altitude];
    }

    clear() {
        if (this._fbo) {
            this._clearFbo(this._fbo);
        }
        this._currentMeshes = [];
        delete this._currentShader;
        return this;
    }

    getMeshAt(idx) {
        if (!this._currentMeshes) {
            return null;
        }
        return this._currentMeshes[idx];
    }

    getRenderedMeshes() {
        return this._currentMeshes;
    }

    dispose() {
        this.clear();
        if (this._shader0) {
            this._shader0.dispose();
        }
        if (this._shader1) {
            this._shader1.dispose();
        }
        if (this._shader2) {
            this._shader2.dispose();
        }
        if (this._scene) {
            this._scene.clear();
        }
        if (this._scene1) {
            this._scene1.clear();
        }
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

    _getPickingId(x, y, width, height, pixels, meshes, uniforms) {
        const regl = this._renderer.regl;
        const fbo1 = this._getFBO1();
        this._clearFbo(fbo1);
        this._scene1.setMeshes(meshes);
        this._renderer.render(this._shader2, uniforms, this._scene1, fbo1);
        const data = regl.read({
            data: pixels,
            x, y,
            framebuffer : fbo1,
            width,
            height
        });
        const ids = [];
        for (let i = 0; i < data.length; i += 4) {
            ids.push(pack3(data.subarray(i, i + 4)));
        }
        return ids;
    }

    _pickDepth(x, y, width, height, pixels, meshes, uniforms) {
        const regl = this._renderer.regl;
        const fbo1 = this._getFBO1();
        //second render to find depth value of point

        // const { count, offset } = this._getPartialMeshForPicking(mesh, pickingId);

        // const geometry = mesh.geometry;
        // geometry.setDrawCount(count);
        // geometry.setDrawOffset(offset);

        this._scene1.setMeshes(meshes);
        this._clearFbo(fbo1);
        uniforms.logDepthBufFC = 2.0 / (Math.log(this._map.cameraFar + 1.0) / Math.LN2);

        this._renderer.render(this._depthShader, uniforms, this._scene1, fbo1);

        // geometry.setDrawCount(null);
        // geometry.setDrawOffset(0);

        const data = regl.read({
            data: pixels,
            x, y,
            framebuffer : fbo1,
            width,
            height
        });

        const depths = [];
        for (let i = 0; i < data.length; i += 4) {
            depths.push(packDepth(data.subarray(i, i + 4)));
        }
        // console.log(data);
        return depths;
    }

    _packData(data, shader) {
        if (data[0] === 255 && data[1] === 255 &&
            data[2] === 255 && data[3] === 255) {
            return {
                meshId : null,
                pickingId : null
            };
        }
        let pickingId = null;
        let meshId = null;
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

    _getShader(meshes, once) {
        if (once && meshes.length < 256) {
            return this._shader0;
        }
        return this._shader1;
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

    _getParams(px, py, tolerance, fbo) {
        const x = tolerance[0], y = tolerance[1];
        px -= x;
        py = fbo.height - py;
        py -= y;

        let width = 2 * x + 1;
        let height = 2 * y + 1;

        //        ____
        //      |      |
        //height|  x,y |
        //      | ____ | width
        // (px, py)

        const right = px + width;
        const top = py + height;
        if (right > fbo.width) {
            width -= right - fbo.width;
        }
        if (top > fbo.height) {
            height -= top - fbo.height;
        }

        px = px < 0 ? 0 : px;
        py = py < 0 ? 0 : py;

        return { px, py, width, height };
    }

    getPickingVert() {
        return this._vert;
    }

    getUniformDeclares() {
        return this._uniforms;
    }
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

function getTolerance(tolerance) {
    if (isNumber(tolerance)) { //tolerance增加对x,y方向的支持，同时对原来数字形式的支持
        TOLERANCE[0] = TOLERANCE[1] = tolerance;
        tolerance = TOLERANCE;
    }
    return tolerance;
}
