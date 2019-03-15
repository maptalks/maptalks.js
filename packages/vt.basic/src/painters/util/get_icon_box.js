import { vec2, vec3 } from '@maptalks/gl';
import { projectPoint } from './projection';
import { getPitchPosition, getPosition, getShapeMatrix } from './box_util';
import { clamp } from '../../Util';

//temparary variables
const ANCHOR = [], PROJ_ANCHOR = [];
const MAT2 = [];
const V2_0 = [], V2_1 = [], V2_2 = [], V2_3 = [];
const DXDY = [];

const AXIS_FACTOR = [1, -1];

export function getIconBox(out, mesh, i, matrix, map) {
    const uniforms = mesh.material.uniforms;
    const cameraToCenterDistance = map.cameraToCenterDistance;
    const geoProps = mesh.geometry.properties;

    const aAnchor = geoProps.aAnchor;
    const anchor = vec3.set(ANCHOR, aAnchor[i * 3], aAnchor[i * 3 + 1], aAnchor[i * 3 + 2]);
    let projAnchor = projectPoint(PROJ_ANCHOR, anchor, matrix, map.width, map.height);

    const cameraDistance = projAnchor[2];

    let perspectiveRatio = 1;
    if (uniforms['markerPerspectiveRatio']) {
        const distanceRatio = (1.0 - cameraToCenterDistance / cameraDistance) * uniforms['markerPerspectiveRatio'];
        //通过distance动态调整大小
        perspectiveRatio = clamp(
            0.5 + 0.5 * (1.0 - distanceRatio),
            0.0, // Prevents oversized near-field symbols in pitched/overzoomed tiles
            4.0);
    }

    // const { aShape, aRotation, aDxDy } = geoProps;
    // const dxdy = vec2.set(DXDY, aDxDy[i * 2], aDxDy[i * 2 + 1]);

    const { aShape, symbol } = geoProps;
    const dxdy = vec2.set(DXDY, symbol['markerDx'] || 0, symbol['markerDy'] || 0);

    let tl = vec2.set(V2_0, aShape[i * 2], aShape[i * 2 + 1]),
        tr = vec2.set(V2_1, aShape[i * 2 + 2], aShape[i * 2 + 3]),
        bl = vec2.set(V2_2, aShape[i * 2 + 4], aShape[i * 2 + 5]),
        br = vec2.set(V2_3, aShape[i * 2 + 6], aShape[i * 2 + 7]);

    vec2.scale(tl, tl, 2);
    vec2.scale(tr, tr, 2);
    vec2.scale(bl, bl, 2);
    vec2.scale(br, br, 2);

    let rotation = symbol['markerRotation'] || 0;

    //1. 获得shape的tl, tr, bl, 和br
    //2. 计算旋转矩阵: shapeMatrix
    //3. 计算最终的shape
    //   3.1 如果没有pitchWithMap，值是 shapeMatrix * shape
    //   3.2 如果pitchWidthMap， 值是aAnchor和shape相加后，projectPoint后的计算结果
    //4. 将最终计算结果与dxdy相加
    const mapRotation = map.getBearing() * Math.PI / 180;
    const shapeMatrix = getShapeMatrix(MAT2, rotation, mapRotation, uniforms['rotateWithMap'], uniforms['pitchWithMap']);

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


    return out;
}

