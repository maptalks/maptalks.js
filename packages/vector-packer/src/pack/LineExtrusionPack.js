import { default as LinePack, EXTRUDE_SCALE }  from './LinePack';
import { vec3, vec4 } from 'gl-matrix';
import Point from '@mapbox/point-geometry';
import { buildNormals, buildTangents, packTangentFrame } from '@maptalks/tbn-packer';
import { interpolated } from '@maptalks/function-type';
import { isFnTypeSymbol } from '../style/Util';
import { getPosArrayType } from './util/array';

export default class LineExtrusionPack extends LinePack {

    constructor(features, symbol, options) {
        super(features, symbol, options);
        if (isFnTypeSymbol('lineHeight', this.symbolDef)) {
            this.heightFn = interpolated(this.symbolDef['lineHeight']);
        }
    }

    getFormat() {
        const format = [
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
                name: 'aExtrudedPosition'
            },
            {
                type: Int8Array,
                width: 2,
                name: 'aExtrude'
            },
        ];
        if (this.colorFn) {
            format.push(
                {
                    type: Uint8Array,
                    width: 4,
                    name: 'aColor'
                }
            );
        }
        if (this.lineWidthFn) {
            format.push(
                {
                    type: Uint8Array,
                    width: 1,
                    name: 'aLineWidth'
                }
            );
        }
        if (this.heightFn) {
            format.push(
                {
                    type: Array,
                    width: 1,
                    name: 'aLineHeight'
                }
            );
        }
        return format;
    }

    placeVector(line) {
        const feature = line.feature;
        if (this.heightFn) {
            this.feaHeight = feature ? this.heightFn(this.options['zoom'], feature.properties) || 0 : 0;
            if (this.feaHeight > this.maxHeight) {
                this.maxHeight = this.feaHeight;
            }
        }
        return super.placeVector(line);
    }

    _addLine(vertices, feature, join, cap, miterLimit, roundLimit) {

        super._addLine(vertices, feature, join, cap, miterLimit, roundLimit);
        const end = this.data.length / this.formatWidth - this.offset;
        const isPolygon = feature.type === 3; //POLYGON)
        // debugger
        if (!isPolygon && end > 0) {
            //封闭两端
            //line开始时顶点顺序: down0, down0-底, up0, up0-底
            //开始端封闭的两个三角形: 1. down0, up0, up0-底, 2. down0, up0-底, down0-底
            super.addElements(0, 2, 3);
            super.addElements(0, 3, 1);

            //line结束的顶点顺序: down1, down1底, up1, up1底
            //结束段封闭的两个三角形: 1. up1, down1, down1底, 2. up1, down1底, up1底
            super.addElements(end - 2, end - 4, end - 3);
            super.addElements(end - 2, end - 3, end - 1);
        }
    }

    addLineVertex(data, point, normal, extrude, round, up, linesofar) {
        // debugger
        const tileScale = this.options['EXTENT'] / this.options['tileSize'];
        const lineWidth = this.feaLineWidth || this.symbol['lineWidth'] / 2 * tileScale;

        const aExtrudeX = EXTRUDE_SCALE * extrude.x;
        const aExtrudeY = EXTRUDE_SCALE * extrude.y;
        //只用于计算uv和tangent
        const extrudedPoint = new Point(lineWidth * extrude.x, lineWidth * extrude.y)._add(point);
        // const height = this.symbol['lineHeight'];

        data.push(point.x, point.y, 1, linesofar, +up, extrudedPoint.x, extrudedPoint.y, 1, aExtrudeX, aExtrudeY);
        if (this.colorFn) {
            data.push(...this.feaColor);
        }
        if (this.lineWidthFn) {
            //乘以2是为了解决 #190
            data.push(Math.round(this.feaLineWidth * 2));
        }
        if (this.heightFn) {
            data.push(this.feaHeight);
        }
        data.push(point.x, point.y, 0, linesofar, +up, extrudedPoint.x, extrudedPoint.y, 0, aExtrudeX, aExtrudeY);
        if (this.colorFn) {
            data.push(...this.feaColor);
        }
        if (this.lineWidthFn) {
            //乘以2是为了解决 #190
            data.push(Math.round(this.feaLineWidth * 2));
        }
        if (this.heightFn) {
            data.push(this.feaHeight);
        }

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
        const up = this.data[(offset + e3 * 2) * formatWidth + 4];
        if (up) {
            if (this.options['top'] !== false) {
                //顶点的添加顺序：up0, down1, up1
                super.addElements(e1 * 2, e2 * 2, e3 * 2);
            }
            if (this.options['side'] !== false) {
                //侧面按顺时针(因为在背面)
                //up0, up1, up1-底
                super.addElements(e1 * 2, e3 * 2, e3 * 2 + 1);
                //up0, up1-底, up0-底
                super.addElements(e1 * 2, e3 * 2 + 1, e1 * 2 + 1);
            }
        } else {
            //参数中的顺序down0, up0, down1
            if (this.options['top'] !== false) {
                //添加的顺序(变成逆时针): down0, down1, up0
                super.addElements(e1 * 2, e3 * 2, e2 * 2);
            }
            if (this.options['side'] !== false) {
                //down0, down0-底， down1
                super.addElements(e1 * 2, e1 * 2 + 1, e3 * 2);
                //down0-底， down1-底， down1
                super.addElements(e1 * 2 + 1, e3 * 2 + 1, e3 * 2);
            }
        }
    }

    createDataPack(vectors, scale) {
        this.maxHeight = 0;
        // debugger
        const pack = super.createDataPack(vectors, scale);
        if (!pack) {
            return pack;
        }
        const { data, indices } = pack;
        const format = this.getFormat();
        const description = format.reduce((accumulator, currentValue) => {
            accumulator[currentValue.name] = {
                size: currentValue.width
            };
            return accumulator;
        }, {});
        description.aPickingId = { size: 1 };
        buildUniqueVertex(data, indices, description);
        const { aExtrudedPosition, aPosition, aLinesofar, aUp, aExtrude,
            aColor, aLineHeight, aLineWidth } = data;
        const arrays = {};
        const normals = buildNormals(aExtrudedPosition, indices);
        //因为line的三角形旋转方向是反的，所以normal的结果需要取反
        for (let i = 0; i < normals.length; i++) {
            normals[i] = -normals[i];
        }
        let uvs;
        let tangents;
        if (this.symbol['material'] && hasTexture(this.symbol['material'])) {
            uvs = buildUVS(aExtrudedPosition, aLinesofar, aUp, indices, this.options);
            tangents = buildTangents(aExtrudedPosition, normals, uvs, indices);
            tangents = createQuaternion(normals, tangents);
        }
        arrays['aPosition'] = aPosition;
        if (tangents) {
            arrays['aTexCoord0'] = new Float32Array(uvs);
            arrays['aTangent'] = tangents;
        } else {
            //normal被封装在了tangents中，不用再次定义
            arrays['aNormal'] = new Float32Array(normals);
        }
        arrays['aPickingId'] = data.aPickingId;
        arrays['aExtrude'] = aExtrude;
        if (aColor) {
            arrays['aColor'] = aColor;
        }
        if (aLineWidth) {
            arrays['aLineWidth'] = aLineWidth;
        }
        if (aLineHeight) {
            const ArrType = getPosArrayType(this.maxHeight);
            arrays['aLineHeight'] = new ArrType(aLineHeight);
        }
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
