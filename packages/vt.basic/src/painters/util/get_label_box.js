import * as maptalks from 'maptalks';
import { vec2, vec3, vec4, mat2 } from '@maptalks/gl';
import { projectPoint } from './projection';

const ANCHOR = [], PROJ_ANCHOR = [];
const MAT2 = [];
const V2_0 = [], V2_1 = [], V2_2 = [], V2_3 = [];
const V3_0 = [], V3_1 = [], V3_2 = [], V3_3 = [];
const DXDY = [], OFFSET = [];
const MIN = [], MAX = [];

const AXIS_FACTOR = [1, -1];

export function getLabelBox(out, mesh, i, matrix, map) {
    const uniforms = mesh.material.uniforms;
    const cameraToCenterDistance = map.cameraToCenterDistance;
    const geoProps = mesh.geometry.properties,
        symbol = geoProps.symbol,
        isAlongLine = (symbol['textPlacement'] === 'line');

    const glyphSize = 24;

    const aAnchor = geoProps.aAnchor;
    const anchor = vec3.set(ANCHOR, aAnchor[i * 3], aAnchor[i * 3 + 1], aAnchor[i * 3 + 2]);
    let projAnchor = projectPoint(PROJ_ANCHOR, anchor, matrix, map.width, map.height);

    const cameraDistance = projAnchor[2];

    let perspectiveRatio = 1;
    if (uniforms['textPerspectiveRatio']) {
        const distanceRatio = (1.0 - cameraToCenterDistance / cameraDistance) * uniforms['textPerspectiveRatio'];
        //通过distance动态调整大小
        perspectiveRatio = maptalks.Util.clamp(
            0.5 + 0.5 * (1.0 - distanceRatio),
            0.0, // Prevents oversized near-field symbols in pitched/overzoomed tiles
            4.0);
    }

    const { aShape0, aRotation, aDxDy, aSize } = geoProps;
    const textSize = aSize[i];
    const dxdy = vec2.set(DXDY, aDxDy[i * 2], aDxDy[i * 2 + 1]);

    let tl = vec2.set(V2_0, aShape0[i * 2], aShape0[i * 2 + 1]),
        tr = vec2.set(V2_1, aShape0[i * 2 + 2], aShape0[i * 2 + 3]),
        bl = vec2.set(V2_2, aShape0[i * 2 + 4], aShape0[i * 2 + 5]),
        br = vec2.set(V2_3, aShape0[i * 2 + 6], aShape0[i * 2 + 7]);

    vec2.scale(tl, tl, textSize / glyphSize);
    vec2.scale(tr, tr, textSize / glyphSize);
    vec2.scale(bl, bl, textSize / glyphSize);
    vec2.scale(br, br, textSize / glyphSize);

    let textRotation = aRotation[i];

    if (!isAlongLine) {
        //1. 获得shape的tl, tr, bl, 和br
        //2. 计算旋转矩阵: shapeMatrix
        //3. 计算最终的shape
        //   3.1 如果没有pitchWithMap，值是 shapeMatrix * shape
        //   3.2 如果pitchWidthMap， 值是aAnchor和shape相加后，projectPoint后的计算结果
        //4. 将最终计算结果与dxdy相加
        const mapRotation = map.getBearing() * Math.PI / 180;
        textRotation *= Math.PI / 180;
        textRotation -= mapRotation * uniforms['rotateWithMap'];
        if (uniforms['pitchWithMap'] === 1) {
            textRotation += mapRotation;
        }

        const angleSin = Math.sin(textRotation),
            angleCos = Math.cos(textRotation);
        // the order: c0r0, c0r1, c1r0, c1r1
        // const shapeMatrix = mat2.set(MAT2,
        //     angleCos, angleSin, -angleSin, angleCos);
        const shapeMatrix = mat2.set(MAT2, angleCos, -1.0 * angleSin, angleSin, angleCos);
        tl = vec2.transformMat2(tl, tl, shapeMatrix);
        tr = vec2.transformMat2(tr, tr, shapeMatrix);
        bl = vec2.transformMat2(bl, bl, shapeMatrix);
        br = vec2.transformMat2(br, br, shapeMatrix);

        vec2.multiply(tl, tl, AXIS_FACTOR);
        vec2.multiply(tr, tr, AXIS_FACTOR);
        vec2.multiply(bl, bl, AXIS_FACTOR);
        vec2.multiply(br, br, AXIS_FACTOR);

        if (uniforms['pitchWithMap'] === 1) {
            getPitchPosition(out, anchor, tl, tr, bl, br, matrix, dxdy, uniforms, map, cameraDistance, perspectiveRatio);
        } else {
            getPosition(out, projAnchor, tl, tr, bl, br, dxdy, perspectiveRatio);
        }

    } else {
        //1. 获得shape的tl, tr, bl, 和br  //需要考虑shape0和shape1吗？
        //2. 计算旋转矩阵: shapeMatrix
        //3. 获得offset
        //4. 计算最终的offset
        //   4.1 如果没有pitchWithMap，offset是 shapeMatrix * shape + offset * (1.0, -1.0)
        //   4.2 如果pitchWidthMap，offset是shapeMatrix * shape * (1.0, -1.0) + offset，和pos相加后，projectPoint后的计算结果
        //5. 将最终计算结果与dxdy相加

        //TODO 根据flip和vertical翻转文字和换成aShape1
        const aOffset = geoProps.aOffset.data || geoProps.aOffset;
        const offset = vec2.set(OFFSET, aOffset[i * 2], aOffset[i * 2 + 1]);
        if (uniforms['pitchWithMap'] === 1) {
            vec2.add(tl, tl, offset);
            vec2.add(tr, tr, offset);
            vec2.add(bl, bl, offset);
            vec2.add(br, br, offset);

            getPitchPosition(out, anchor, tl, tr, bl, br, matrix, dxdy, uniforms, map, cameraDistance, perspectiveRatio);
        } else {
            vec2.multiply(tl, tl, AXIS_FACTOR);
            vec2.multiply(tr, tr, AXIS_FACTOR);
            vec2.multiply(bl, bl, AXIS_FACTOR);
            vec2.multiply(br, br, AXIS_FACTOR);

            vec2.add(tl, tl, offset);
            vec2.add(tr, tr, offset);
            vec2.add(bl, bl, offset);
            vec2.add(br, br, offset);

            getPosition(out, projAnchor, tl, tr, bl, br, dxdy, perspectiveRatio);
        }
    }
    return out;
}

function getPitchPosition(out, anchor, tl, tr, bl, br, matrix, dxdy, uniforms, map, cameraDistance, perspectiveRatio) {
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

    vec3.set(V3_0, tl[0], tl[1], 0);
    vec3.set(V3_1, tr[0], tr[1], 0);
    vec3.set(V3_2, bl[0], bl[1], 0);
    vec3.set(V3_3, br[0], br[1], 0);

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
        MAX[0] + dxdy[0], MAX[1] + dxdy[1],
    );
}

function getPosition(out, projAnchor, tl, tr, bl, br, dxdy, perspectiveRatio) {
    /**
     *  vec2 offset = shape * 2.0 / canvasSize;
     *  //乘以distance，用来抵消透视齐次坐标
        gl_Position.xy += offset * perspectiveRatio * distance;
        */
    vec2.scale(tl, tl, perspectiveRatio);
    vec2.scale(tr, tr, perspectiveRatio);
    vec2.scale(bl, bl, perspectiveRatio);
    vec2.scale(br, br, perspectiveRatio);

    //min
    vec2.set(MIN, Math.min(tl[0], tr[0], bl[0], br[0]), Math.min(tl[1], tr[1], bl[1], br[1]));
    //max
    vec2.set(MAX, Math.max(tl[0], tr[0], bl[0], br[0]), Math.max(tl[1], tr[1], bl[1], br[1]));
    vec4.set(out,
        projAnchor[0] + MIN[0] + dxdy[0], projAnchor[1] + MIN[1] + dxdy[1],
        projAnchor[0] + MAX[0] + dxdy[0], projAnchor[1] + MAX[1] + dxdy[1],
    );
}
