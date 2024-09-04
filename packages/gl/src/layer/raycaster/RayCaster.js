import { vec3, vec4, mat4 } from '@maptalks/reshader.gl';
import { Coordinate, Point, Util } from 'maptalks';
import Ray from './Ray';

const TRIANGLE = [], POS_A = [], POS_B = [], POS_C = [], TEMP_POINT = new Point(0, 0), NULL_ALTITUDES = [];
const TEMP_VEC_AB = [], TEMP_VEC_AC = [];
const EMPTY_MAT = [];
const pA_VEC = [], pB_VEC = [], pC_VEC = [];
const INTERSECT_POINT = [];
const bboxIntersects = [];
export default class RayCaster {
    constructor(from, to) {
        this._from = new Coordinate(from);
        this._to = new Coordinate(to);
    }

    test(meshes, map) {
        const results = [];
        const from = coordinateToWorld(map, this._from.x, this._from.y, this._from.z);
        const to = coordinateToWorld(map, this._to.x, this._to.y, this._to.z);
        const ray = new Ray(from, to);
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            if (!this._checkBBox(mesh.getBoundingBox(), ray)) {
                continue;
            }
            const localTransform = mesh.localTransform;
            const geometry = mesh.geometry;
            const positions = geometry.data[geometry.desc.positionAttribute].array;
            const altitudes = (geometry.data[geometry.desc.altitudeAttribute] && geometry.data[geometry.desc.altitudeAttribute].array) || NULL_ALTITUDES;
            const geoIndices = geometry.indices;
            if (!positions || !positions.length || !geoIndices || !geoIndices.length) {
                // console.warn('there are no POSITION or inidces in mesh');
                continue;
            }
            const matrix = mat4.multiply(EMPTY_MAT, localTransform, mesh.positionMatrix);
            const coordinates = this._testMesh(mesh, ray, map, positions, altitudes, geoIndices, geometry.desc.positionSize, matrix);
            if (coordinates) {
                // const { coordinate, indices } = intersect;
                const result = {
                    mesh,
                    coordinates
                };
                results.push(result);
            }
        }
        return results;
    }

    _testMesh(mesh, ray, map, positions, altitudes, indices, dim, matrix) {
        const coordinates = [];
        for (let j = 0; j < indices.length; j += 3) {
            if (j > mesh.properties.skirtOffset) {
                break;
            }
            const a = indices[j];
            const b = indices[j + 1];
            const c = indices[j + 2];
            const positionsA = vec3.set(pA_VEC, positions[a * dim], positions[a * dim + 1], positions[a * dim + 2]);
            const pA = this._toWorldPosition(POS_A, map, positionsA, altitudes[a] / 100, matrix);
            const positionsB = vec3.set(pB_VEC, positions[b * dim], positions[b * dim + 1], positions[b * dim + 2]);
            const pB = this._toWorldPosition(POS_B, map, positionsB, altitudes[b] / 100, matrix);
            const positionsC = vec3.set(pC_VEC, positions[c * dim], positions[c * dim + 1], positions[c * dim + 2]);
            const pC = this._toWorldPosition(POS_C, map, positionsC, altitudes[c] / 100, matrix);

            const triangle = vec3.set(TRIANGLE, pA, pB, pC);
            const vAB = vec3.sub(TEMP_VEC_AB, pA, pB);
            const vAC = vec3.sub(TEMP_VEC_AC, pA, pC);
            const intersectPoint = this._testIntersection(INTERSECT_POINT, triangle, ray);
            if (intersectPoint) {
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
            vec4.set(out, pos[0], pos[1], pos[2], 1);
            vec4.transformMat4(out, out, matrix);
        }
        return out;
    }

    _testIntersection(out, triangle, ray) {
        return ray.intersectTriangle(triangle[0], triangle[1], triangle[2], null, out);
    }

    _checkBBox(bbox, ray) {
        return ray.intersectBox(bbox, bboxIntersects);
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

