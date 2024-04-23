import { vec2, vec3, vec4, mat4 } from '@maptalks/reshader.gl';
import { Coordinate, Point, Util } from 'maptalks';

const CUBE_POSITIONS = [1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1,
        1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1,
        1, 1, 1, 1, 1, -1, -1, 1, -1, -1, 1, 1,
        -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1,
        -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1,
        1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, -1],
    CUBE_INDICES = [0, 1, 2, 0, 2, 3,
        4, 5, 6, 4, 6, 7,
        8, 9, 10, 8, 10, 11,
        12, 13, 14, 12, 14, 15,
        16, 17, 18, 16, 18, 19,
        20, 21, 22, 20, 22, 23],
    BBOX_POSITIONS = [];
const TRIANGLE = [], LINE = [], POINT = [], VEC3 = [], POS_A = [], POS_B = [], POS_C = [], TEMP_POINT = new Point(0, 0), NULL_ALTITUDES = [];
const TEMP_VEC_AB = [], TEMP_VEC_AC = [];
const EMPTY_MAT = [];
const pA_VEC = [], pB_VEC = [], pC_VEC = [];
const vAB_VEC = [], vAC_VEC = [], CROSS = [];
const INTERSECT_POINT = [];
export default class RayCaster {
    constructor(from, to, options = {}) {
        this.setFromPoint(from);
        this.setToPoint(to);
        this._options = options;
        this._intersectCache = {};
        this._version = 0;
    }

    setFromPoint(from) {
        this._from = this._adaptCoordinate(from);
        this._incrVersion();
    }

    setToPoint(to) {
        this._to = this._adaptCoordinate(to);
        this._incrVersion();
    }

    setOptions(options) {
        this._options = options;
    }

    _incrVersion() {
        this._intersectCache = {};
        this._version++;
    }

    test(meshes, map) {
        const results = [];
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            const key = mesh.uuid + '-' + mesh.version + '-' + mesh.geometry.version + '-' + this._version;
            if (this._intersectCache[key]) {
                results.push(this._intersectCache[key]);
                continue;
            }
            if (!this._checkBBox(mesh.getBoundingBox(), map)) {
                continue;
            }
            const localTransform = mesh.localTransform;
            const geometry = mesh.geometry;
            const positions = geometry.data[geometry.desc.positionAttribute].array;
            const altitudes = (geometry.data[geometry.desc.altitudeAttribute] && geometry.data[geometry.desc.altitudeAttribute].array) || NULL_ALTITUDES;
            const geoIndices = geometry.indices;
            if (!positions || !geoIndices) {
                console.warn('there are no POSITION or inidces in mesh');
                continue;
            }
            const matrix = mat4.multiply(EMPTY_MAT, localTransform, mesh.positionMatrix);
            const coordinates = this._testMesh(mesh, map, positions, altitudes, geoIndices, geometry.desc.positionSize, matrix);
            if (coordinates) {
                // const { coordinate, indices } = intersect;
                const result = {
                    mesh,
                    coordinates
                };
                results.push(result);
                this._intersectCache[key] = result;
            }
        }
        return results;
    }

    _testMesh(mesh, map, positions, altitudes, indices, positionSize, matrix) {
        const from = coordinateToWorld(map, this._from.x, this._from.y, this._from.z);
        const to = coordinateToWorld(map, this._to.x, this._to.y, this._to.z);
        const line = vec2.set(LINE, from, to);
        const coordinates = [];
        for (let j = 0; j < indices.length; j += 3) {
            if (j > mesh.properties.skirtOffset) {
                break;
            }
            const a = indices[j];
            const b = indices[j + 1];
            const c = indices[j + 2];
            const positionsA = vec3.set(pA_VEC, positions[a * positionSize], positions[a * positionSize + 1], positions[a * positionSize + 2]);
            const pA = this._toWorldPosition(POS_A, map, positionsA, altitudes[a] / 100, matrix);
            const positionsB = vec3.set(pB_VEC, positions[b * positionSize], positions[b * positionSize + 1], positions[b * positionSize + 2]);
            const pB = this._toWorldPosition(POS_B, map, positionsB, altitudes[b] / 100, matrix);
            const positionsC = vec3.set(pC_VEC, positions[c * positionSize], positions[c * positionSize + 1], positions[c * positionSize + 2]);
            const pC = this._toWorldPosition(POS_C, map, positionsC, altitudes[c] / 100, matrix);

            const triangle = vec3.set(TRIANGLE, pA, pB, pC);
            const vAB = vec3.sub(TEMP_VEC_AB, pA, pB);
            const vAC = vec3.sub(TEMP_VEC_AC, pA, pC);
            const intersectPoint = this._testIntersection(INTERSECT_POINT, triangle, line);
            if (intersectPoint) {
                if (!intersectPoint[0] || !intersectPoint[1]) {
                    continue;
                }
                const altitude = map.pointAtResToAltitude(intersectPoint[2], map.getGLRes());
                TEMP_POINT.x = intersectPoint[0];
                TEMP_POINT.y = intersectPoint[1];
                const coord = map.pointAtResToCoordinate(TEMP_POINT, map.getGLRes());
                coord.z = altitude;
                coordinates.push({
                    coordinate: coord,
                    indices: [a, b, c],
                    normal: vec3.cross([], vAB, vAC)
                });
            }
        }
        return coordinates.length ? coordinates : null;
    }

    _toWorldPosition(out, map, pos, altitude, matrix) {
        let alt;
        if (Util.isNumber(altitude)) {
            alt = map.altitudeToPoint(altitude, map.getGLRes());
            vec4.set(out, pos[0], pos[1], 0, 1);
            vec4.transformMat4(out, out, matrix);
            out[2] = alt;
        } else {
            alt = pos[2];
            vec4.set(out, pos[0], pos[1], alt, 1);
            vec4.transformMat4(out, out, matrix);
        }
        return out;
    }

    _testIntersection(out, triangle, line) {
        //直线方程: (x - a) / m = (y - b) / n = (z - c) / p;
        //平面方程: Ax + By + Cz + D = 0;
        const tP0 = triangle[0], tP1 = triangle[1], tP2 = triangle[2];
        const p1 = line[0], p2 = line[1];
        const a = p1[0], b = p1[1], c = p1[2];
        const m = p2[0] - p1[0], n = p2[1] - p1[1], p = p2[2] - p1[2];
        let A = 0, B = 0, C = 0;
        if (tP0[0] === tP1[0] && tP0[0] === tP2[0]) {
            A = 1;
        } else if (tP0[1] === tP1[1] && tP0[1] === tP2[1]) {
            B = 1;
        } else if (tP0[2] === tP1[2] && tP0[2] === tP2[2]) {
            C = 1;
        } else {
            A = (triangle[2][1] - triangle[0][1]) * (triangle[2][2] - triangle[0][2]) - (triangle[1][2] - triangle[0][2]) * (triangle[2][1] - triangle[0][1]);
            B = (triangle[2][0] - triangle[0][0]) * (triangle[1][2] - triangle[0][2]) - (triangle[1][0] - triangle[0][0]) * (triangle[2][2] - triangle[0][2]);
            C = (triangle[1][0] - triangle[0][0]) * (triangle[2][1] - triangle[0][1]) - (triangle[2][0] - triangle[0][0]) * (triangle[1][1] - triangle[0][1]);
        }
        const D = -(A * triangle[0][0] + B * triangle[0][1] + C * triangle[0][2]);
        const den = (A * m + B * n + C * p);
        if (den === 0) {//分母为0，直接除会报错，此时直线与平面平行
            return null;
        }
        const t = -(A * a + B * b + C * c + D) / den;
        const x = m * t + a;
        const y = n * t + b;
        const z = p * t + c;
        const point = vec3.set(POINT, x, y, z);
        if (this._isPointInTriangle(triangle, point)) {
            if (this._options['allowPointNotOnLine'] || this._isPointOnLine(line, point)) { //只要在线段之间的都返回，或者如果即使不在线段之间，但是设置了返回线段外的点，也返回
                return vec3.set(out, x, y, z);
            }
        }
        return null;
    }

    _isPointInTriangle(triangle, point) {
        const tolerance = this._options['tolerance'] || 1;
        if (!this._isPointInAABB(triangle, point)) {
            return false;
        }
        const A = triangle[0], B = triangle[1], C = triangle[2], P = point;
        A[2] = B[2] = C[2] = P[2] = 0;
        const Sabc = this._calArea(A, B, C);
        const Spab = this._calArea(P, A, B);
        const Spac = this._calArea(P, A, C);
        const Spbc = this._calArea(P, B, C);
        const areaDivValue = Math.abs(Spab + Spac + Spbc - Sabc);
        if (areaDivValue > tolerance) {
            return false;
        }
        return true;
    }

    _isPointInAABB(triangle, point) {
        const tolerance = this._options['tolerance'] || 1;
        const A = triangle[0], B = triangle[1], C = triangle[2];
        const xmin = minValue(A, B, C, 0) - tolerance
        const ymin = minValue(A, B, C, 1) - tolerance;
        const zmin = minValue(A, B, C, 2) - tolerance;
        const xmax = maxValue(A, B, C, 0) + tolerance;
        const ymax = maxValue(A, B, C, 1) + tolerance;
        const zmax = maxValue(A, B, C, 2) + tolerance;
        return point[0] >= xmin && point[0] <= xmax && point[1] >= ymin && point[1] <= ymax && point[2] >= zmin && point[2] <= zmax;
    }

    _isPointOnLine(line, point) {
        const tolerance = this._options['tolerance'] || 1;
        const p0 = line[0], p1 = line[1], p = point;
        const lengthp0p1 = vec3.length(vec3.sub(VEC3, p0, p1));
        const lengthp0p = vec3.length(vec3.sub(VEC3, p0, p));
        const lengthp1p = vec3.length(vec3.sub(VEC3, p1, p));
        if (Math.abs(lengthp0p + lengthp1p - lengthp0p1) > tolerance) {
            return false;
        }
        return true;
    }

    _calArea(pointA, pointB, pointC) {
        const vAB = vec3.sub(vAB_VEC, pointB, pointA);
        const vAC = vec3.sub(vAC_VEC, pointC, pointA);
        const cross = vec3.cross(CROSS, vAB, vAC);
        const S = vec3.length(cross) * 0.5;
        return S;
    }

    _adaptCoordinate(coord) {
        if (coord instanceof Coordinate) {
            return coord;
        } else if (Array.isArray(coord)) {
            return new Coordinate(coord);
        }
        return null;
    }

    _checkBBox(bbox, map) {
        const from = coordinateToWorld(map, this._from.x, this._from.y, this._from.z);
        const to = coordinateToWorld(map, this._to.x, this._to.y, this._to.z);
        const line = [from, to];
        const min = bbox[0], max = bbox[1];
        for (let i = 0; i < CUBE_POSITIONS.length; i += 3) {
            for (let j  = 0; j < 3; j++) {
                const index = i + j;
                if (CUBE_POSITIONS[index] > 0) {
                    BBOX_POSITIONS[index] = max[j];
                } else {
                    BBOX_POSITIONS[index] = min[j];
                }
            }
        }
        for (let j = 0; j < CUBE_INDICES.length; j += 3) {
            const a = CUBE_INDICES[j];
            const b = CUBE_INDICES[j + 1];
            const c = CUBE_INDICES[j + 2];
            const pA = vec3.set(pA_VEC, BBOX_POSITIONS[a * 3], BBOX_POSITIONS[a * 3 + 1], BBOX_POSITIONS[a * 3 + 2])
            const pB = vec3.set(pB_VEC, BBOX_POSITIONS[b * 3], BBOX_POSITIONS[b * 3 + 1], BBOX_POSITIONS[b * 3 + 2])
            const pC = vec3.set(pC_VEC, BBOX_POSITIONS[c * 3], BBOX_POSITIONS[c * 3 + 1], BBOX_POSITIONS[c * 3 + 2])
            const triangle = vec3.set(TRIANGLE, pA, pB, pC);
            const intersectPoint = this._testIntersection(INTERSECT_POINT, triangle, line);
            if (intersectPoint) {
                return true;
            }
        }
        return false;
    }
}

const COORD = new Coordinate(0, 0);

function coordinateToWorld(map, x, y, z) {
    if (!map) {
        return null;
    }
    COORD.set(x, y);
    const p = map.coordinateToPointAtRes(COORD, map.getGLRes());
    const height = map.altitudeToPoint(z || 0, map.getGLRes());
    return [p.x, p.y, height];
}

function minValue(A, B, C, axis) {
    let min = A[axis];
    if (min > B[axis]) {
        min = B[axis];
    }
    if (min > C[axis]) {
        min = C[axis];
    }
    return min;
}

function maxValue(A, B, C, axis) {
    let max = A[axis];
    if (max < B[axis]) {
        max = B[axis];
    }
    if (max < C[axis]) {
        max = C[axis];
    }
    return max;
}
