import LinePack from './LinePack';
import { EXTRUDE_SCALE } from './LinePack';
import { vec3 } from 'gl-matrix';
import Point from '@mapbox/point-geometry';

// We don't have enough bits for the line distance as we'd like to have, so
// use this value to scale the line distance (in tile units) down to a smaller
// value. This lets us store longer distances while sacrificing precision.
const LINE_DISTANCE_SCALE = 1;
const TEMP_EXTRUDE = new Point();

export default class RoundTubePack extends LinePack {
    constructor(features, symbol, options) {
        super(features, symbol, options);
        if (this.options.radialSegments % 2 === 1) {
            this.options.radialSegments--;
        }
    }

    getFormat() {
        const { lineWidthFn, lineColorFn, lineOpacityFn, linePatternAnimSpeedFn, linePatternGapFn } = this._fnTypes;
        const format = [
            ...this.getPositionFormat(),
            {
                type: Int8Array,
                size: 3,
                name: 'aTubeNormal'
            },
            {
                type: this.options.positionType || Uint16Array,
                width: 1,
                name: 'aLinesofar'
            }
        ];
        if (this.iconAtlas) {
            format.push(
                {
                    type: Int8Array,
                    width: 1,
                    name: 'aNormalDistance'
                }
            );
        }
        if (lineWidthFn) {
            format.push(
                {
                    type: Uint8Array,
                    width: 1,
                    name: 'aLineWidth'
                }
            );
        }
        if (lineColorFn) {
            format.push(
                {
                    type: Uint8Array,
                    width: 4,
                    name: 'aColor'
                }
            );
        }
        if (lineOpacityFn) {
            format.push(
                {
                    type: Uint8Array,
                    width: 1,
                    name: 'aOpacity'
                }
            );
        }
        if (linePatternAnimSpeedFn || linePatternGapFn) {
            format.push({
                type: Int8Array,
                width: 2,
                name: 'aLinePattern'
            });
        }
        return format;
    }

    addHalfVertex(currentVertex, extrudeX, extrudeY, round, up, dir, segment, normalDistance) {

        const { x, y, z } = currentVertex;
        // scale down so that we can store longer distances while sacrificing precision.
        const linesofar = this.scaledDistance * LINE_DISTANCE_SCALE;

        const segments = this.options.radialSegments / 2;
        // 如果没有prevVertex，则用currentVertex和nextVertex来计算
        // const P1 = this.prevVertex || currentVertex;
        // const P2 = this.prevVertex ? currentVertex : this.nextVertex;

        const factor = up ? 1 : -1;
        TEMP_EXTRUDE.x = extrudeX * factor;
        TEMP_EXTRUDE.y = extrudeY * factor;
        const { x: dirx, y: diry } = TEMP_EXTRUDE._perp();
        const radialOffsets = getRadialVertexes(1, segments, dirx, diry, 0, up);

        if (this.prevVertex) {
            const positionSize = this.needAltitudeAttribute() ? 2 : 3;
            const currentOffset = this.data.aPosition.length / positionSize;
            for (let i = 0; i < segments; i++) {
                // d-------b
                // |       |
                // c-------a
                const a = i + currentOffset;
                const c = i + currentOffset - segments * 2;
                let b, d;
                if (i === segments - 1 && up) {
                    // 如果是down的最后一个点
                    // b是该圆圈中的第一个点
                    // d是上一个圆圈的第一个点
                    // - segments * 2 + 1 就是用圆圈的最后一个点的序号找到圆圈第一个点的序号
                    b = i + currentOffset - segments * 2 + 1;
                    d = i + currentOffset - segments * 2 - segments * 2 + 1;
                } else {
                    // b是圆圈上下一个点
                    // d是上一个圆圈对应的下一个点
                    // 如果up为false，且最后一个点，则b是up上第一个点，但序号仍然是 i + currentOffset + 1
                    b = i + currentOffset + 1;
                    d = i + currentOffset + 1 - segments * 2;
                }
                super.addElements(a, b, c);
                super.addElements(c, b, d);
            }
        }

        this.fillData(this.data, x, y, z || 0, radialOffsets, linesofar, normalDistance);
    }

    fillData(data, x, y, altitude, radialOffsets, linesofar, normalDistance) {
        const { lineWidthFn, lineColorFn, lineOpacityFn, linePatternAnimSpeedFn, linePatternGapFn } = this._fnTypes;
        const segments = radialOffsets.length;
        for (let i = 0; i < segments; i++) {
            this.fillPosition(data, x, y, altitude);
            vec3.scale(radialOffsets[i], radialOffsets[i], EXTRUDE_SCALE);
            data.aTubeNormal.push(...radialOffsets[i]);
            data.aLinesofar.push(linesofar);
            if (this.iconAtlas) {
                data.aNormalDistance.push(EXTRUDE_SCALE * normalDistance);
            }
            if (lineWidthFn) {
                //乘以2是为了解决 #190
                data.aLineWidth.push(Math.round(this.feaLineWidth * 2));
            }
            if (lineColorFn) {
                data.aColor.push(...this.feaColor);
            }
            if (lineOpacityFn) {
                data.aOpacity.push(this.feaOpacity);
            }
            if (linePatternAnimSpeedFn || linePatternGapFn) {
                data.aLinePattern.push((this.feaPatternAnimSpeed || 0) * 127, (this.feaLinePatternGap || 0) * 10);
            }
        }
        this.maxPos = Math.max(this.maxPos, Math.abs(x) + 1, Math.abs(y) + 1);
    }
}

const Q = [];
const U = [];
const V = [];
// const P1 = [];
// const P2 = [];

const radialOffsets = {};

// 如何计算向量的垂直圆
// https://stackoverflow.com/questions/36760771/how-to-calculate-a-circle-perpendicular-to-a-vector
function getRadialVertexes(radius, segments, normalX, normalY, normalZ, up) {
    // vec3.set(P1, p1.x, p1.y, p1.z);
    // vec3.set(P2, p2.x, p2.y, p2.z);
    // // Q = P1→P2 moved to origin
    // vec3.sub(Q, P2, P1);

    vec3.set(Q, normalX, normalY, normalZ);

    // Create vectors U and V that are (1) mutually perpendicular and (2) perpendicular to Q
    if (Q[0] != 0) {  // create a perpendicular vector on the XY plane
        // there are an infinite number of potential vectors; arbitrarily select y = 1
        vec3.set(U, -Q[1] / Q[0], 1, 0)
        // to prove U is perpendicular:
        // (Qx, Qy, Qz)·(Ux, Uy, Uz) = Qx·Ux + Qy·Uy + Qz·Uz = Qx·-Qy/Qx + Qy·1 + Qz·0 = -Qy + Qy + 0 = 0
    } else if (Q[1] != 0) {  // create a perpendicular vector on the YZ plane
        vec3.set(U, 0, -Q[2] / Q[1], 1);
    } else {  // assume Qz != 0; create a perpendicular vector on the XZ plane
        vec3.set(U, 1, 0, -Q[0] / Q[2]);
    }

    // The cross product of two vectors is perpendicular to both, so to find V:
    // (Vx, Vy, Vz) = (Qx, Qy, Qz)×(Ux, Uy, Uz) = (Qy×Uz - Qz×Uy, Qz×Ux - Qx×Uz, Qx×Uy - Qy×Ux)
    vec3.cross(V, Q, U);

    // normalize U and V:
    vec3.normalize(U, U);
    vec3.normalize(V, V);

    if (!radialOffsets[segments]) {
        radialOffsets[segments] = [];
    }
    const offsets = radialOffsets[segments];
    const factor = up ? 1 : -1;
    for (var i = 0; i < segments; i++) {
        const θ = Math.PI * i / segments;  // theta
        const dx = factor * radius * (Math.cos(θ) * U[0] + Math.sin(θ) * V[0]);
        const dy = factor * radius * (Math.cos(θ) * U[1] + Math.sin(θ) * V[1]);
        const dz = factor * radius * (Math.cos(θ) * U[2] + Math.sin(θ) * V[2]);

        offsets[i] = offsets[i] || [];
        vec3.set(offsets[i], dx, dy, dz);
    }
    return offsets;
}
