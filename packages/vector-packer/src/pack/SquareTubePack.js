import { addTubeNormalVertexs, default as RoundTubePack } from './RoundTubePack';
import { LINE_DISTANCE_SCALE } from './LinePack';
import { vec2, vec3 } from 'gl-matrix';

export default class SquareTubePack extends RoundTubePack {
    addHalfVertex(currentVertex, extrudeX, extrudeY, round, up, dir, segment, normalDistance) {
        const { x, y, z } = currentVertex;
        // scale down so that we can store longer distances while sacrificing precision.
        const linesofar = this.scaledDistance * LINE_DISTANCE_SCALE;
        // const factor = up ? 1 : -1;
        // TEMP_EXTRUDE.x = extrudeX * factor;
        // TEMP_EXTRUDE.y = extrudeY * factor;
        // const { x: dirx, y: diry } = TEMP_EXTRUDE._perp();
        // const dirz = normal.z;

        // const factor = 1;//up ? 1 : -1;
        // TEMP_EXTRUDE.x = normal.x * factor;
        // TEMP_EXTRUDE.y = normal.y * factor;
        // const { x: dirx, y: diry } = TEMP_EXTRUDE._perp()._mult(-1);

        // const dz = this.prevVertex ? z - this.prevVertex.z : 0;
        // *100 是因为zScale是把厘米转为glres point，所以要把米转为厘米
        // const altitudeToLocal = getAltitudeToLocal(this.options);
        // console.log(segment.dir);
        // console.log(dirx, diry, normal.z);
        const { x: dirx, y: diry, z: dirz } = segment.dir;
        // console.log(dirx, diry, dirz);
        // console.log(segment.dir.x, segment.dir.y, segment.dir.z);
        const radialOffsets = getSquareVertexes(this.feaLineWidth, this.feaLineHeight, dirx, diry, dirz, extrudeX, extrudeY, up);

        if (this.prevVertex) {
            this.fillTubeElements(up);
        }

        this.fillData(this.data, x, y, z || 0, radialOffsets, up, linesofar, normalDistance);
    }

    ensureDataCapacity(join, vertexCount, approxAngle, halfVertexCount) {
        // SquareTubePack中 每个 addHalfVertex 里都包含了两个 radialOffsets
        return super.ensureDataCapacity(join, vertexCount, approxAngle, halfVertexCount * 2);
    }
}

const SIZE = [];
const Q = [];
const U = [];
const V = [];
// const P1 = [];
// const P2 = [];

const radialOffsets = [];

// 如何计算向量的垂直圆
// https://stackoverflow.com/questions/36760771/how-to-calculate-a-circle-perpendicular-to-a-vector
function getSquareVertexes(width, height, dirX, dirY, dirZ, normalX, normalY, up) {
    // vec3.set(P1, p1.x, p1.y, p1.z);
    // vec3.set(P2, p2.x, p2.y, p2.z);
    // // Q = P1→P2 moved to origin
    // vec3.sub(Q, P2, P1);

    vec3.set(Q, dirX, dirY, dirZ);
    vec3.set(U, normalX, normalY, 0);

    // The cross product of two vectors is perpendicular to both, so to find V:
    vec3.cross(V, Q, U);

    // normalize U and V:
    vec3.normalize(U, U);
    vec3.normalize(V, V);

    vec2.set(SIZE, width, height);
    const radius = vec2.len(SIZE) / width;
    const ratio = Math.atan(height / width);

    let theta = Math.PI / 2 + (Math.PI / 2 - ratio);  // theta
    if (!radialOffsets[0]) {
        radialOffsets[0] = [];
    }
    addTubeNormalVertexs(U, V, radialOffsets[0], radius, theta, up ? 1 : -1);
    theta += 2 * ratio;
    if (!radialOffsets[1]) {
        radialOffsets[1] = [];
    }
    addTubeNormalVertexs(U, V, radialOffsets[1], radius, theta, up ? 1 : -1);

    return radialOffsets;
}
