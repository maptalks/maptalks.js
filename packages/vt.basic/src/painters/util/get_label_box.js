import { vec2, vec3 } from '@maptalks/gl';
import { projectPoint } from './projection';
import { clamp } from '../../Util';
import { getPitchPosition, getPosition, getShapeMatrix } from './box_util';

//temparary variables
const ANCHOR = [], PROJ_ANCHOR = [];
const MAT2 = [];
const V2_0 = [], V2_1 = [], V2_2 = [], V2_3 = [];

const DXDY = [];

const AXIS_FACTOR = [1, -1];

export function getLabelBox(out, mesh, textSize, i, matrix, map) {
    const uniforms = mesh.material.uniforms;
    const cameraToCenterDistance = map.cameraToCenterDistance;
    const geoProps = mesh.geometry.properties;
    const symbol = geoProps.symbol;
    const isAlongLine = (symbol['textPlacement'] === 'line');

    const glyphSize = 24;

    const aAnchor = geoProps.aAnchor;
    const anchor = vec3.set(ANCHOR, aAnchor[i * 3], aAnchor[i * 3 + 1], aAnchor[i * 3 + 2]);
    const projAnchor = projectPoint(PROJ_ANCHOR, anchor, matrix, map.width, map.height);

    const cameraDistance = projAnchor[2];

    let perspectiveRatio = 1;
    if (uniforms['textPerspectiveRatio']) {
        const distanceRatio = (1.0 - cameraToCenterDistance / cameraDistance) * uniforms['textPerspectiveRatio'];
        //通过distance动态调整大小
        perspectiveRatio = clamp(
            0.5 + 0.5 * (1.0 - distanceRatio),
            0.0, // Prevents oversized near-field symbols in pitched/overzoomed tiles
            4.0);
    }

    const dxdy = vec2.set(DXDY, symbol['markerDx'] || 0, symbol['markerDy'] || 0);

    if (!isAlongLine) {
        const { aShape } = geoProps;
        let tl = vec2.set(V2_0, aShape[i * 2], aShape[i * 2 + 1]),
            tr = vec2.set(V2_1, aShape[i * 2 + 2], aShape[i * 2 + 3]),
            bl = vec2.set(V2_2, aShape[i * 2 + 4], aShape[i * 2 + 5]),
            br = vec2.set(V2_3, aShape[i * 2 + 6], aShape[i * 2 + 7]);

        vec2.scale(tl, tl, textSize / glyphSize);
        vec2.scale(tr, tr, textSize / glyphSize);
        vec2.scale(bl, bl, textSize / glyphSize);
        vec2.scale(br, br, textSize / glyphSize);

        let textRotation = symbol['textRotation'] || 0;

        const mapRotation = !isAlongLine ? map.getBearing() * Math.PI / 180 : 0;
        const shapeMatrix = getShapeMatrix(MAT2, textRotation, mapRotation, uniforms['rotateWithMap'], uniforms['pitchWithMap']);
        tl = vec2.transformMat2(tl, tl, shapeMatrix);
        tr = vec2.transformMat2(tr, tr, shapeMatrix);
        bl = vec2.transformMat2(bl, bl, shapeMatrix);
        br = vec2.transformMat2(br, br, shapeMatrix);
        //1. 获得shape的tl, tr, bl, 和br
        //2. 计算旋转矩阵: shapeMatrix
        //3. 计算最终的shape
        //   3.1 如果没有pitchWithMap，值是 shapeMatrix * shape
        //   3.2 如果pitchWidthMap， 值是aAnchor和shape相加后，projectPoint后的计算结果
        //4. 将最终计算结果与dxdy相加

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
        //2. offset中已经包含了shape的值
        //3. 获得offset
        //4. 计算最终的offset
        //   4.1 如果没有pitchWithMap
        //   4.2 如果pitchWidthMap，和pos相加后，projectPoint后的计算结果
        //5. 将最终计算结果与dxdy相加

        const { aOffset } = geoProps;
        //除以10是因为赋值时, aOffset有精度修正
        let tl = vec2.set(V2_0, aOffset[i * 2] / 10, aOffset[i * 2 + 1] / 10),
            tr = vec2.set(V2_1, aOffset[i * 2 + 2] / 10, aOffset[i * 2 + 3] / 10),
            bl = vec2.set(V2_2, aOffset[i * 2 + 4] / 10, aOffset[i * 2 + 5] / 10),
            br = vec2.set(V2_3, aOffset[i * 2 + 6] / 10, aOffset[i * 2 + 7] / 10);
        if (uniforms['pitchWithMap'] === 1) {
            getPitchPosition(out, anchor, tl, tr, bl, br, matrix, dxdy, uniforms, map, cameraDistance, perspectiveRatio);
        } else {
            vec2.multiply(tl, tl, AXIS_FACTOR);
            vec2.multiply(tr, tr, AXIS_FACTOR);
            vec2.multiply(bl, bl, AXIS_FACTOR);
            vec2.multiply(br, br, AXIS_FACTOR);
            getPosition(out, projAnchor, tl, tr, bl, br, dxdy, perspectiveRatio);
        }
    }
    return out;
}

