import { vec2, vec3 } from '@maptalks/gl';
import { projectPoint } from './projection';
import { getPitchPosition, getPosition, getShapeMatrix } from './box_util';
import { clamp } from '../../Util';
import { DEFAULT_MARKER_WIDTH, DEFAULT_MARKER_HEIGHT } from '../Constant';

//temparary variables
const ANCHOR = [], PROJ_ANCHOR = [];
const MAT2 = [];
const V2_0 = [], V2_1 = [], V2_2 = [], V2_3 = [];
const DXDY = [];

const AXIS_FACTOR = [1, -1];
const ICON_SIZE = 24;

export function getIconBox(out, mesh, i, matrix, map) {
    const uniforms = mesh.material.uniforms;
    const cameraToCenterDistance = map.cameraToCenterDistance;
    const geoProps = mesh.geometry.properties;

    const positionSize = mesh.geometry.desc.positionSize;
    const aAnchor = geoProps.aAnchor;
    const anchor = vec3.set(ANCHOR, aAnchor[i * positionSize], aAnchor[i * positionSize + 1], positionSize === 2 ? 0 : aAnchor[i * positionSize + 2]);
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

    const { aShape, symbol, aMarkerDx, aMarkerDy, aMarkerWidth, aMarkerHeight } = geoProps;
    const markerDx = aMarkerDx ? aMarkerDx[i] : symbol['markerDx'];
    const markerDy = aMarkerDy ? aMarkerDy[i] : symbol['markerDy'];
    const dxdy = vec2.set(DXDY, markerDx || 0, markerDy || 0);

    let tl = vec2.set(V2_0, aShape[i * 2] / 10, aShape[i * 2 + 1] / 10),
        tr = vec2.set(V2_1, aShape[i * 2 + 2] / 10, aShape[i * 2 + 3] / 10),
        bl = vec2.set(V2_2, aShape[i * 2 + 4] / 10, aShape[i * 2 + 5] / 10),
        br = vec2.set(V2_3, aShape[i * 2 + 6] / 10, aShape[i * 2 + 7] / 10);

    const markerWidth = (aMarkerWidth ? aMarkerWidth[i] : symbol['markerWidth']) || DEFAULT_MARKER_WIDTH;
    const markerHeight = (aMarkerHeight ? aMarkerHeight[i] : symbol['markerHeight']) || DEFAULT_MARKER_HEIGHT;
    const sizeScale = [markerWidth / ICON_SIZE, markerHeight / ICON_SIZE];
    vec2.mul(tl, tl, sizeScale);
    vec2.mul(tr, tr, sizeScale);
    vec2.mul(bl, bl, sizeScale);
    vec2.mul(br, br, sizeScale);

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

