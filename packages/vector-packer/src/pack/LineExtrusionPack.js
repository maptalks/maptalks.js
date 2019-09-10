import { default as LinePack, EXTRUDE_SCALE }  from './LinePack';
import { vec3, vec4 } from 'gl-matrix';
import Point from '@mapbox/point-geometry';
import { buildNormals, buildTangents, packTangentFrame } from '@maptalks/tbn-packer';

// aPosition: glData.vertices,
// aTexCoord0: glData.uvs,
// aNormal: glData.normals,
// aColor: glData.colors,
// aPickingId: glData.featureIndexes,
// aTangent: glData.tangents

const DESCRIPTION = {
    aPosition: { size: 3 },
    aPosition0: { size: 3 },
    aLinesofar: { size: 1 },
    aUp: { size: 1 },
    aPickingId: { size: 1 },
    aExtrude: { size: 2 }
};

export default class LineExtrusionPack extends LinePack {

    getFormat() {
        return [
            {
                type: Int16Array,
                width: 3,
                name: 'aPosition'
            },
            {
                type: Uint16Array,
                width: 1,
                name: 'aLinesofar'
            },
            {
                type: Uint8Array,
                width: 1,
                name: 'aUp'
            },
            {
                type: Int16Array,
                width: 3,
                name: 'aPosition0'
            },
            {
                type: Int8Array,
                width: 2,
                name: 'aExtrude'
            },
        ];
    }

    _addLine(vertices, feature, join, cap, miterLimit, roundLimit) {
        super._addLine(vertices, feature, join, cap, miterLimit, roundLimit);
        const end = this.data.length / this.formatWidth;
        const isPolygon = feature.type === 3; //POLYGON)
        // debugger
        if (!isPolygon) {
            //封闭两端
            //line开始时顶点顺序: down0, down0-底, up0, up0-底
            //开始端封闭的两个三角形: 1. down0, up0, up0-底, 2. down0, up0-底, down0-底
            super.addElements(this.offset, this.offset + 2, this.offset + 3);
            super.addElements(this.offset, this.offset + 3, this.offset + 1);

            //line结束的顶点顺序: down1, down1底, up1, up1底
            //结束段封闭的两个三角形: 1. up1, down1, down1底, 2. up1, down1底, up1底
            super.addElements(end - 2, end - 4, end - 3);
            super.addElements(end - 2, end - 3, end - 1);
        }
    }

    addLineVertex(data, point, normal, extrude, round, up, linesofar) {
        // debugger
        const tileScale = this.options['EXTENT'] / this.options['tileSize'];
        const lineWidth = this.symbol['lineWidth'] / 2 * tileScale;

        const aExtrudeX = EXTRUDE_SCALE * extrude.x;
        const aExtrudeY = EXTRUDE_SCALE * extrude.y;

        const extrudedPoint = new Point(lineWidth * extrude.x, lineWidth * extrude.y)._add(point);
        const height = this.symbol['lineHeight'];

        data.push(extrudedPoint.x, extrudedPoint.y, height, linesofar, up, point.x, point.y, height, aExtrudeX, aExtrudeY);
        data.push(extrudedPoint.x, extrudedPoint.y, 0, linesofar, up, point.x, point.y, 0, aExtrudeX, aExtrudeY);

        this.maxPos = Math.max(this.maxPos, Math.abs(point.x), Math.abs(point.y));
    }

    addElements(e1, e2, e3) {
        const offset = this.offset;
        //顶点插入的顺序是 1. down0, up0, down1, 2. up0, down1, up1
        //    up0  ____  up1
        //  down0 |____| down1
        // const { vertexLength } = this;
        const formatWidth = this.formatWidth; //x, y, height, linesofar, up
        //*2 是因为不同于 LinePack, LineExtrusionPack 在addLineVertex方法中会为每个端点插入两个vertex (0和height)
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
        const { data, indices } = pack;
        buildUniqueVertex(data, indices, DESCRIPTION);
        const { aPosition, aPosition0, aLinesofar, aUp, aExtrude } = data;
        const arrays = {};
        const normals = buildNormals(aPosition, indices);
        let uvs;
        let tangents;
        if (this.symbol['material'] && hasTexture(this.symbol['material'])) {
            uvs = buildUVS(aPosition, aLinesofar, aUp, indices, this.options);
            tangents = buildTangents(aPosition, normals, uvs, indices);
            tangents = createQuaternion(normals, tangents);
        }
        arrays['aPosition'] = aPosition0;
        if (tangents) {
            arrays['aTexCoord0'] = new Float32Array(uvs);
            arrays['aTangent'] = tangents;
        } else {
            //normal被封装在了tangents中，不用再次定义
            arrays['aNormal'] = new Float32Array(normals);
        }
        arrays['aPickingId'] = data.aPickingId;
        arrays['aExtrude'] = aExtrude;
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

function createQuaternion(normals, tangents) {
    const aTangent = new Float32Array(tangents.length);
    const t = [], n = [], q = [];
    for (let i = 0; i < tangents.length; i += 4) {
        const ni = i / 4 * 3;
        vec3.set(n, normals[ni], normals[ni + 1], normals[ni + 2]);
        vec4.set(t, tangents[i], tangents[i + 1], tangents[i + 2], tangents[i + 3]);
        packTangentFrame(q, n, t);
        vec4.copy(aTangent.subarray(i, i + 4), q);
    }
    return aTangent;
}

function hasTexture(material) {
    for (const p in material) {
        if (p.indexOf('Texture') >= 0 || p.indexOf('anisotropy') >= 0) {
            return true;
        }
    }
    return false;
}
