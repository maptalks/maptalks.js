import LinePack from './LinePack';
import { vec3 } from 'gl-matrix';
import Point from '@mapbox/point-geometry';

// aPosition: glData.vertices,
// aTexCoord0: glData.uvs,
// aNormal: glData.normals,
// aColor: glData.colors,
// aPickingId: glData.featureIndexes,
// aTangent: glData.tangents

const DESCRIPTION = {
    aPosition: { size: 3 },
    aLinesofar: { size: 1 },
    aUp: { size: 1 },
    featureIndexes: { size: 1 }
};

export default class LineExtrusionPack extends LinePack {

    getFormat() {
        return [
            {
                type: Int16Array,
                width: 3,
                name: 'aPosition'
            },
            //round? + up?
            {
                type: Uint16Array,
                width: 1,
                name: 'aLinesofar'
            },
            //当前点距离aPos的凸起方向
            {
                type: Uint8Array,
                width: 1,
                name: 'aUp'
            }
        ];
    }

    addLineVertex(data, point, extrude, round, up, linesofar) {
        // debugger
        const { glScale, zScale } = this.options;
        const tileScale = this.options['EXTENT'] / this.options['tileSize'];
        const lineWidth = this.symbol['lineWidth'] / 2 * tileScale;

        const extrudedPoint = new Point(lineWidth * extrude.x, lineWidth * extrude.y)._add(point);
        const height = this.symbol['lineHeight'] * glScale / zScale;
        //计算uv坐标
        data.push(extrudedPoint.x, extrudedPoint.y, height, linesofar, up);
        data.push(extrudedPoint.x, extrudedPoint.y, 0, linesofar, up);

        this.maxPos = Math.max(this.maxPos, Math.abs(extrudedPoint.x), Math.abs(extrudedPoint.y));
    }

    addElements(e1, e2, e3) {
        const offset = this.offset;
        //顶点插入的顺序是 1. down0, up0, down1, 2. up0, down1, up1
        //    up0  ____  up1
        //  down0 |____| down1
        // const { vertexLength } = this;
        const formatWidth = this.formatWidth; //x, y, height, linesofar, up
        const up = this.data[e3 * 2 * formatWidth + 4];
        if (up) {
            if (this.options['top'] !== false) {
                //顶点的添加顺序：up0, down1, up1
                super.addElements(offset + e1 * 2, offset + e2 * 2, offset + e3 * 2);
            }
            if (this.options['side'] !== false) {
                //侧面按顺时针(因为在背面)
                //up0, up1, up1-底
                super.addElements(offset + e1 * 2, offset + e3 * 2, offset + e3 * 2 + 1);
                //up0, up1-底, up0-底
                super.addElements(offset + e1 * 2, offset + e3 * 2 + 1, offset + e1 * 2 + 1);
            }
        } else {
            //参数中的顺序down0, up0, down1
            if (this.options['top'] !== false) {
                //添加的顺序(变成逆时针): down0, down1, up0
                super.addElements(offset + e1 * 2, offset + e3 * 2, offset + e2 * 2);
            }
            if (this.options['side'] !== false) {
                //down0, down0-底， down1
                super.addElements(offset + e1 * 2, offset + e1 * 2 + 1, offset + e3 * 2);
                //down0-底， down1-底， down1
                super.addElements(offset + e1 * 2 + 1, offset + e3 * 2 + 1, offset + e3 * 2);
            }
        }
    }

    createDataPack(vectors, scale) {
        const pack = super.createDataPack(vectors, scale);
        console.log(new Array(pack.data.aPosition).join());
        const { data, indices } = pack;
        // debugger
        buildUniqueVertex(data, indices, DESCRIPTION);
        const { aPosition, aLinesofar, aUp } = data;
        const arrays = {};
        const uvs = buildUVS(aPosition, aLinesofar, aUp, indices, this.options);
        const normals = buildFaceNormals(aPosition, indices);
        const tangents = computeTangents(aPosition, normals, uvs, indices);

        arrays['vertices'] = aPosition;
        arrays['uvs'] = new Float32Array(uvs);
        arrays['normals'] = new Float32Array(normals);
        arrays['tangents'] = new Float32Array(tangents);
        arrays['featureIndexes'] = data.featureIndexes;
        console.log(JSON.stringify(arrays));
        console.log(JSON.stringify(indices));
        const buffers = [];
        for (const p in arrays) {
            buffers.push(arrays[p].buffer);
        }
        pack.data = arrays;
        pack.buffers = buffers;
        return pack;
    }
}


/**
 * Generate normals per vertex.
 * from claygl's Geometry
 */
export function buildFaceNormals(vertices, indices) {
    const normals = new Array(vertices.length);

    const p1 = new Array(3);
    const p2 = new Array(3);
    const p3 = new Array(3);

    const v21 = new Array(3);
    const v32 = new Array(3);
    const n = new Array(3);

    const len = indices.length;
    let i1, i2, i3;
    for (let f = 0; f < len;) {
        if (indices) {
            i1 = indices[f++];
            i2 = indices[f++];
            i3 = indices[f++];
        } else {
            i1 = f++;
            i2 = f++;
            i3 = f++;
        }

        vec3.set(p1, vertices[i1 * 3], vertices[i1 * 3 + 1], vertices[i1 * 3 + 2]);
        vec3.set(p2, vertices[i2 * 3], vertices[i2 * 3 + 1], vertices[i2 * 3 + 2]);
        vec3.set(p3, vertices[i3 * 3], vertices[i3 * 3 + 1], vertices[i3 * 3 + 2]);

        vec3.sub(v21, p2, p1);
        vec3.sub(v32, p2, p3);

        vec3.cross(n, v21, v32);

        vec3.normalize(n, n);

        for (let i = 0; i < 3; i++) {
            normals[i1 * 3 + i] = n[i];
            normals[i2 * 3 + i] = n[i];
            normals[i3 * 3 + i] = n[i];
        }
    }
    return normals;
}


/**
 * Create a unique vertex for each index.
 * base on claygl's Geometry
 */
export function buildUniqueVertex(data, indices, desc) {

    const keys = Object.keys(data);

    const oldData = {};
    const l = indices.length;
    for (let i = 0; i < keys.length; i++) {
        const name = keys[i];
        oldData[name] = data[name];
        data[name] = new oldData[name].constructor(l * desc[name].size);
    }

    let cursor = 0;
    for (let i = 0; i < l; i++) {
        const idx = indices[i];
        for (let ii = 0; ii < keys.length; ii++) {
            const name = keys[ii];
            const array = data[name];
            const size = desc[name].size;

            for (let k = 0; k < size; k++) {
                array[cursor * size + k] = oldData[name][idx * size + k];
            }
        }
        indices[i] = cursor++;
    }

    return data;
}


function computeTangents(positions, normals, uvs, indices) {
    const nVertices = positions.length / 3;

    const tangents = new Array(4 * nVertices);

    const tan1 = [], tan2 = [];

    for (let i = 0; i < nVertices; i++) {

        tan1[ i ] = [0, 0, 0];
        tan2[ i ] = [0, 0, 0];

    }

    const vA = [0, 0, 0],
        vB = [0, 0, 0],
        vC = [0, 0, 0],

        uvA = [0, 0],
        uvB = [0, 0],
        uvC = [0, 0],

        sdir = [0, 0, 0],
        tdir = [0, 0, 0];

    function handleTriangle(a, b, c) {

        fromArray3(vA, positions, a * 3);
        fromArray3(vB, positions, b * 3);
        fromArray3(vC, positions, c * 3);

        fromArray2(uvA, uvs, a * 2);
        fromArray2(uvB, uvs, b * 2);
        fromArray2(uvC, uvs, c * 2);

        const x1 = vB[0] - vA[0];
        const x2 = vC[0] - vA[0];

        const y1 = vB[1] - vA[1];
        const y2 = vC[1] - vA[1];

        const z1 = vB[2] - vA[2];
        const z2 = vC[2] - vA[2];

        const s1 = uvB[0] - uvA[0];
        const s2 = uvC[0] - uvA[0];

        const t1 = uvB[1] - uvA[1];
        const t2 = uvC[1] - uvA[1];

        const r = 1.0 / (s1 * t2 - s2 * t1);

        vec3.set(
            sdir,
            (t2 * x1 - t1 * x2) * r,
            (t2 * y1 - t1 * y2) * r,
            (t2 * z1 - t1 * z2) * r
        );

        vec3.set(
            tdir,
            (s1 * x2 - s2 * x1) * r,
            (s1 * y2 - s2 * y1) * r,
            (s1 * z2 - s2 * z1) * r
        );

        vec3.add(tan1[ a ], tan1[ a ], sdir);
        vec3.add(tan1[ b ], tan1[ b ], sdir);
        vec3.add(tan1[ c ], tan1[ c ], sdir);

        vec3.add(tan2[ a ], tan2[ a ], tdir);
        vec3.add(tan2[ b ], tan2[ b ], tdir);
        vec3.add(tan2[ c ], tan2[ c ], tdir);

    }

    for (let j = 0, jl = indices.length; j < jl; j += 3) {

        handleTriangle(
            indices[ j + 0 ],
            indices[ j + 1 ],
            indices[ j + 2 ]
        );

    }

    const tmp = [], tmp2 = [];
    const n = [], n2 = [];
    let w, t, test;

    function handleVertex(v) {

        fromArray3(n, normals, v * 3);
        vec3.copy(n2, n);
        // n2.copy(n);

        t = tan1[ v ];

        // Gram-Schmidt orthogonalize

        vec3.copy(tmp, t);
        vec3.sub(tmp, tmp, vec3.scale(n, n, vec3.dot(n, t)));
        vec3.normalize(tmp, tmp);
        // tmp.sub(n.multiplyScalar(n.dot(t))).normalize();

        // Calculate handedness

        vec3.cross(tmp2, n2, t);
        test = vec3.dot(tmp2, tan2[ v ]);
        // tmp2.crossVectors(n2, t);
        // test = tmp2.dot(tan2[ v ]);
        w = (test < 0.0) ? -1.0 : 1.0;

        tangents[ v * 4 ] = tmp[0];
        tangents[ v * 4 + 1 ] = tmp[1];
        tangents[ v * 4 + 2 ] = tmp[2];
        tangents[ v * 4 + 3 ] = w;

    }

    for (let j = 0, jl = indices.length; j < jl; j += 3) {

        handleVertex(indices[ j + 0 ]);
        handleVertex(indices[ j + 1 ]);
        handleVertex(indices[ j + 2 ]);

    }

    return tangents;
}

function fromArray3(out, array, offset) {
    out[0] = array[offset];
    out[1] = array[offset + 1];
    out[2] = array[offset + 2];
    return out;
}

function fromArray2(out, array, offset) {
    out[0] = array[offset];
    out[1] = array[offset + 1];
    return out;
}

function buildUVS(vertexes, aLinesofar, ups, indices, options) {
    const TWIDTH = 256;
    // let maxUv = -Infinity;
    const uvs = [];
    let steps = 0;
    if (options['top'] !== false) {
        steps += 3;
    }
    if (options['side'] !== false) {
        steps += 6;
    }

    for (let i = 0; i < indices.length; i += steps) {
        //0-2是顶面的一个三角形
        //3-5,6-8是侧面的两个三角形

        let dist = Infinity, dist2 = -Infinity;
        for (let ii = 0; ii < steps; ii++) {
            const linesofar = aLinesofar[indices[ii]];
            if (dist > linesofar) {
                dist = linesofar;
            }
            if (dist2 < linesofar) {
                dist2 = linesofar;
            }
        }

        const up = ups[indices[i]];
        //buildUniqueVertex后，indices中成为递增的顺序，所以可以直接用push的方式推入uv数据，而无需从indices中取到真正的位置
        //    up0  ____  up1
        //  down0 |____| down1
        if (up) {
            if (options['top'] !== false) {
                //顶面的uv坐标 up0, down1, up1
                uvs.push(dist / TWIDTH, 1, dist2 / TWIDTH, 0, dist2 / TWIDTH, 1);
            }
            if (options['side'] !== false) {
                //up0, up1, up1-底
                uvs.push(dist / TWIDTH, 1, dist2 / TWIDTH, 1, dist2 / TWIDTH, 0);
                //up0, up1-底, up0-底
                uvs.push(dist / TWIDTH, 1, dist2 / TWIDTH, 0, dist / TWIDTH, 0);
            }
        } else {
            if (options['top'] !== false) {
                //顶面的uv坐标 down0, up0, down1
                uvs.push(dist / TWIDTH, 0, dist / TWIDTH, 1, dist2 / TWIDTH, 0);
            }
            if (options['side'] !== false) {
                //down0, down0-底， down1
                uvs.push(dist / TWIDTH, 1, dist / TWIDTH, 0, dist2 / TWIDTH, 1);
                //down0-底， down1-底， down1
                uvs.push(dist / TWIDTH, 1, dist2 / TWIDTH, 0, dist2 / TWIDTH, 1);
            }
        }
        //侧面的uv坐标
    }

    return uvs;
}
