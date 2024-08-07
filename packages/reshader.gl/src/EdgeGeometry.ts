import Geometry from './Geometry.js';
import { getPrimitive } from './common/REGLHelper';
import { vec3 } from 'gl-matrix';
import { AttributeData, GeometryDesc } from './types/typings';
import { PrimitiveType } from '@maptalks/regl';

const thresholdAngle = 0.8;
const VEC3_1: vec3 = [0, 0, 0], VEC3_2: vec3 = [0, 0, 0], NORMAL: vec3 = [0, 0, 0], VERTEX_A = [], VERTEX_B = [], VERTEX_C = [];
const vertKeys = ['a', 'b', 'c'];
export default class EdgeGeometry extends Geometry {

    constructor(data: AttributeData, elements, count: number, desc?: GeometryDesc) {
        super(data, elements, count, {
            primitive : getPrimitive(1) as PrimitiveType,
            positionAttribute: desc.positionAttribute
        });
    }

    //@internal
    _getPosAttritute(): number[] {
        const pos = this.data[this.desc.positionAttribute];
        if (!pos.length) {
            return [];
        }
        const precisionPoints = 4;
        const precision = Math.pow(10, precisionPoints);
        const thresholdDot = Math.cos(Math.PI / 180 * thresholdAngle);
        const indexAttr = this.elements;
        const positionAttr = pos.length ? pos : pos.array;
        const indexCount =  !indexAttr.length ? indexAttr : (indexAttr ? indexAttr.length : positionAttr.length / 3);
        const indexArr = [0, 0, 0];
        const hashes: string[] = new Array(3);

        const edgeData: Record<string, EdgeItem> = {};
        const vertices: number[] = [];
        const triangle = new Triangle();
        for (let i = 0; i < indexCount; i += 3) {
            if (indexAttr.length) {
                indexArr[0] = indexAttr[i];
                indexArr[1] = indexAttr[i + 1];
                indexArr[2] = indexAttr[i + 2];
            } else {
                indexArr[0] = i;
                indexArr[1] = i + 1;
                indexArr[2] = i + 2;
            }
            triangle.a = setPositionValue(VERTEX_A, positionAttr, indexArr[0]);
            triangle.b = setPositionValue(VERTEX_B, positionAttr, indexArr[1]);
            triangle.c = setPositionValue(VERTEX_C, positionAttr, indexArr[2]);
            const normal = triangle.getNormal();
            const a = triangle.a, b = triangle.b, c = triangle.c;
            hashes[0] = `${Math.round(a[0] * precision) },${Math.round(a[1] * precision)},${Math.round(a[2] * precision)}`;
            hashes[1] = `${Math.round(b[0] * precision) },${Math.round(b[1] * precision)},${Math.round(b[2] * precision)}`;
            hashes[2] = `${Math.round(c[0] * precision) },${Math.round(c[1] * precision)},${Math.round(c[2] * precision)}`;
            if (hashes[0] === hashes[1] || hashes[1] === hashes[2] || hashes[2] === hashes[0]) {
                continue;
            }
            for (let i = 0; i < 3; i++) {
                this._calEdgeData(i, indexArr, triangle, edgeData, hashes, thresholdDot, normal, vertices);
            }
        }

        for (const key in edgeData) {
            if (edgeData[key]) {
                const { index0, index1 } = edgeData[key];
                vertices.push(positionAttr[index0 * 3], positionAttr[index0 * 3 + 1], positionAttr[index0 * 3 + 2]);
                vertices.push(positionAttr[index1 * 3], positionAttr[index1 * 3 + 1], positionAttr[index1 * 3 + 2]);
            }
        }
        this.elements = this._createElements(vertices);
        return vertices;
    }

    //@internal
    _calEdgeData(index: number, indexArr: number[], triangle: Triangle, edgeData: Record<string, EdgeItem>, hashes: string[],
        thresholdDot: number, normal: vec3, vertices: number[]) {
        const next = (index + 1) % 3;
        const vecHash0 = hashes[index];
        const vecHash1 = hashes[next];
        const v0 = triangle[vertKeys[index]];
        const v1 = triangle[vertKeys[next]];

        const hash = `${vecHash0}_${vecHash1}`;
        const reverseHash = `${vecHash1 }_${vecHash0}`;

        if (reverseHash in edgeData && edgeData[reverseHash]) {
            const thre = vec3.dot(normal, edgeData[reverseHash].normal);
            if (thre <= thresholdDot) {
                vertices.push(v0[0], v0[1], v0[2]);
                vertices.push(v1[0], v1[1], v1[2]);
            }
            edgeData[reverseHash] = null;
        } else if (!(hash in edgeData)) {
            edgeData[hash] = {
                index0: indexArr[index],
                index1: indexArr[next],
                normal: vec3.copy([0, 0, 0], normal),
            };
        }
    }

    //@internal
    _createElements(vertices: number[]): number[] {
        const elements = [];
        const len = vertices.length / 3;
        for (let i = 0; i < len; i++) {
            elements.push(i);
        }
        return elements;
    }
}

class Triangle {
    a: vec3
    b: vec3
    c: vec3
    constructor(a: vec3 = [0, 0, 0], b: vec3 = [0, 0, 0], c: vec3 = [0, 0, 0]) {
        this.a = a;
        this.b = b;
        this.c = c;
    }

    getNormal() {
        const ab = vec3.sub(VEC3_1, this.a, this.b);
        const ac = vec3.sub(VEC3_2, this.a, this.c);
        vec3.cross(NORMAL, ab, ac);
        const len = vec3.length(NORMAL);
        return vec3.set(NORMAL, NORMAL[0] / len, NORMAL[1] / len, NORMAL[2] / len); //normalizd
    }
}

type EdgeItem = {
    index0: number,
    index1: number,
    normal: vec3
}

function setPositionValue(out, positionAttr, index) {
    return vec3.set(out, positionAttr[index * 3], positionAttr[index * 3 + 1], positionAttr[index * 3 + 2])
}
