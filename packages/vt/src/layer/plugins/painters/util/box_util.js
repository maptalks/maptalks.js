import { vec2, vec3, vec4, mat2 } from '@maptalks/gl';
import { projectPoint } from './projection';

const V3_0 = [], V3_1 = [], V3_2 = [], V3_3 = [];
const MIN = [], MAX = [];

export function getPitchPosition(out, anchor, tl, tr, bl, br, matrix, dxdy, uniforms, map, cameraDistance, perspectiveRatio, is3DPitchText, altitudeScale) {
    /**
     * 对应的glsl代码：
     * gl_Position = projViewModelMatrix * vec4(aPosition + vec3(offset, 0.0) * tileRatio / zoomScale * cameraScale * perspectiveRatio, 1.0);
     */

    const { tileRatio, tileResolution } = uniforms;
    const zoomScale = tileResolution / map.getResolution();
    const cameraToCenterDistance = map.cameraToCenterDistance;
    const cameraScale = cameraDistance / cameraToCenterDistance;
    const scale = tileRatio / zoomScale * cameraScale * perspectiveRatio;

    vec2.scale(tl, tl, scale);
    vec2.scale(tr, tr, scale);
    vec2.scale(bl, bl, scale);
    vec2.scale(br, br, scale);

    vec3.set(V3_0, tl[0], tl[1], is3DPitchText ? tl[2] / altitudeScale : 0);
    vec3.set(V3_1, tr[0], tr[1], is3DPitchText ? tr[2] / altitudeScale : 0);
    vec3.set(V3_2, bl[0], bl[1], is3DPitchText ? bl[2] / altitudeScale : 0);
    vec3.set(V3_3, br[0], br[1], is3DPitchText ? br[2] / altitudeScale : 0);

    vec3.add(V3_0, V3_0, anchor);
    vec3.add(V3_1, V3_1, anchor);
    vec3.add(V3_2, V3_2, anchor);
    vec3.add(V3_3, V3_3, anchor);

    projectPoint(tl, V3_0, matrix, map.width, map.height);
    projectPoint(tr, V3_1, matrix, map.width, map.height);
    projectPoint(bl, V3_2, matrix, map.width, map.height);
    projectPoint(br, V3_3, matrix, map.width, map.height);

    //min
    vec2.set(MIN, Math.min(tl[0], tr[0], bl[0], br[0]), Math.min(tl[1], tr[1], bl[1], br[1]));
    //max
    vec2.set(MAX, Math.max(tl[0], tr[0], bl[0], br[0]), Math.max(tl[1], tr[1], bl[1], br[1]));
    vec4.set(out,
        MIN[0] + dxdy[0], MIN[1] + dxdy[1],
        MAX[0] + dxdy[0], MAX[1] + dxdy[1]
    );
}

export function getPosition(out, projAnchor, tl, tr, bl, br, dxdy, perspectiveRatio) {
    if (perspectiveRatio !== 1) {
        /**
         *  vec2 offset = shape * 2.0 / canvasSize;
         *  //乘以distance，用来抵消透视齐次坐标
            gl_Position.xy += offset * perspectiveRatio * distance;
            */
        vec2.scale(tl, tl, perspectiveRatio);
        vec2.scale(tr, tr, perspectiveRatio);
        vec2.scale(bl, bl, perspectiveRatio);
        vec2.scale(br, br, perspectiveRatio);
    }

    //min
    vec2.set(MIN, Math.min(tl[0], tr[0], bl[0], br[0]), Math.min(tl[1], tr[1], bl[1], br[1]));
    //max
    vec2.set(MAX, Math.max(tl[0], tr[0], bl[0], br[0]), Math.max(tl[1], tr[1], bl[1], br[1]));
    vec4.set(out,
        projAnchor[0] + MIN[0] + dxdy[0], projAnchor[1] + MIN[1] - dxdy[1],
        projAnchor[0] + MAX[0] + dxdy[0], projAnchor[1] + MAX[1] - dxdy[1]
    );
}

export function getShapeMatrix(out, rotation, mapRotation, rotateWithMap, pitchWithMap) {
    // const mapRotation = map.getBearing() * Math.PI / 180;
    rotation -= mapRotation * rotateWithMap;
    if (pitchWithMap === 1) {
        rotation += mapRotation;
    }

    const angleSin = Math.sin(rotation),
        angleCos = Math.cos(rotation);
    // the order: c0r0, c0r1, c1r0, c1r1
    // const shapeMatrix = mat2.set(MAT2,
    //     angleCos, angleSin, -angleSin, angleCos);
    const shapeMatrix = mat2.set(out, angleCos, -angleSin, angleSin, angleCos);
    return shapeMatrix;
}
