import { vec2, vec3, vec4 } from '@maptalks/gl';
import { Coordinate, Point } from 'maptalks';
import { coordinateToWorld } from './common/Util';

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
const TRIANGLE = [], LINE = [], POINT = [], VEC3 = [];
export default class RayCaster {
    constructor(from, to, options = {}) {
        this.setFromTo(from, to);
        this._options = options;
    }

    setFromTo(from, to) {
        this.setFromPoint(from);
        this.setToPoint(to);
    }

    setFromPoint(from) {
        this._from = this._adaptCoordinate(from);
    }

    setToPoint(to) {
        this._to = this._adaptCoordinate(to);
    }

    test(meshes, map) {
        const results = [];
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            if (!this._checkBBox(mesh.getBoundingBox(), map)) {
                continue;
            }
            const localTransform = mesh.localTransform;
            const geometry = mesh.geometry;
            const positions = geometry.data['POSITION'].array;
            const geoIndices = geometry.indices;
            if (!positions || !geoIndices) {
                console.warn('there are no POSITION or inidces in mesh');
                continue;
            }
            const intersect = this._testMesh(map, positions, geoIndices, localTransform);
            if (intersect) {
                const { coordinate, indices } = intersect;
                results.push({
                    mesh,
                    coordinate,
                    indices
                });
            }
        }
        return results;
    }

    _testMesh(map, positions, indices, localTransform) {
        const from = coordinateToWorld(map, this._from.x, this._from.y, this._from.z);
        const to = coordinateToWorld(map, this._to.x, this._to.y, this._to.z);
        const line = vec2.set(LINE, from, to);
        for (let j = 0; j < indices.length; j += 3) {
            const a = indices[j];
            const b = indices[j + 1];
            const c = indices[j + 2];
            const pA = this._toWorldPosition(positions.slice(a * 3, a * 3 + 3), localTransform);
            const pB = this._toWorldPosition(positions.slice(b * 3, b * 3 + 3), localTransform);
            const pC = this._toWorldPosition(positions.slice(c * 3, c * 3 + 3), localTransform);
            const triangle = vec3.set(TRIANGLE, pA, pB, pC);
            const intersectPoint = this._testIntersection(triangle, line);
            if (intersectPoint) {
              if (!intersectPoint[0] || !intersectPoint[1]) {
                continue;
              }
              const altitude = map.pointAtResToAltitude(intersectPoint[2], map.getGLRes());
              const coord = map.pointAtResToCoordinate(new Point(intersectPoint[0], intersectPoint[1]), map.getGLRes());
              const coordinate = new Coordinate(coord.x, coord.y, altitude);
              return {
                coordinate,
                indices: [a, b , c]
              };
            }
        }

    }

    _toWorldPosition(pos, localTransform) {
        const p = vec4.set([], pos[0], pos[1], pos[2], 1);
        const wp = vec4.transformMat4([], p, localTransform);
        return wp;
    }
  
    _testIntersection(triangle, line) {
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
        const t = -(A * a + B * b + C * c + D) / (A * m + B * n + C * p);
        const x = m * t + a;
        const y = n * t + b;
        const z = p * t + c;
        const point = vec3.set(POINT, x, y, z);
        if (this._isPointInTriangle(triangle, point) && this._isPointInLine(line, point)) {
          return [x, y, z];
        }
    }
  
    _isPointInTriangle(triangle, point) {
        const tolerance = this._options['tolerance'] || 1;
        const A = triangle[0], B = triangle[1], C = triangle[2], P = point;
        const Sabc = this._calArea(A, B, C);
        const Spab = this._calArea(P, A, B);
        const Spac = this._calArea(P, A, C);
        const Spbc = this._calArea(P, B ,C);
        const areaDivValue = Math.abs(Spab + Spac + Spbc - Sabc);
        if (areaDivValue > tolerance / 1000) {
          return false;
        }
        return true;
    }

    _isPointInLine(line, point) {
        const tolerance = this._options['tolerance'] || 1;
        const p0 = line[0], p1 = line[1], p = point;
        const lengthp0p1 = vec3.length(vec3.sub(VEC3, p0, p1));
        const lengthp0p = vec3.length(vec3.sub(VEC3, p0, p));
        const lengthp1p = vec3.length(vec3.sub(VEC3, p1, p));
        if (Math.abs(lengthp0p + lengthp1p - lengthp0p1) > tolerance / 100000) {
            return false;
        }
        return true;
    }
  
    _calArea(pointA, pointB, pointC) {
        const vAB = [pointB[0] - pointA[0], pointB[1] - pointA[1], pointB[2] - pointA[2]];
        const vAC = [pointC[0] - pointA[0], pointC[1] - pointA[1], pointC[2] - pointA[2]];
        const cross = vec3.cross([], vAB, vAC);
        const S = Math.sqrt(cross[0] * cross[0] + cross[1] * cross[1] + cross[2] * cross[2]) * 0.5;
        return S;
    }

    _adaptCoordinate(coord) {
        if (coord instanceof Coordinate) {
            return coord;
        } else if (Array.isArray(coord)) {
            return new Coordinate(coord);
        }
    }

    _checkBBox(bbox, map) {
        const from = coordinateToWorld(map, this._from.x, this._from.y, this._from.z);
        const to = coordinateToWorld(map, this._to.x, this._to.y, this._to.z);
        const line = [from, to];
        const min = bbox[0], max = bbox[1];
        for (let i = 0; i < CUBE_POSITIONS.length; i += 3) {
            for (let j  = 0; j < 3; j++) {
                const index = i * 3 + j;
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
            const pA = BBOX_POSITIONS.slice(a * 3, a * 3 + 3);
            const pB = BBOX_POSITIONS.slice(b * 3, b * 3 + 3);
            const pC = BBOX_POSITIONS.slice(c * 3, c * 3 + 3);
            const triangle = [pA, pB, pC];
            const intersectPoint = this._testIntersection(triangle, line);
            if (intersectPoint) {
                return true;
            }
        }
        return false;
    }
}