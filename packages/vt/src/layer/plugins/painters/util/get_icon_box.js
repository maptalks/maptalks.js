import { vec2, vec3 } from '@maptalks/gl';
import { projectPoint } from './projection';
import { getPitchPosition, getPosition, getShapeMatrix } from './box_util';
import { getDefaultMarkerSize } from './atlas_util';
import { isNil, clamp } from '../../Util';
import { DEFAULT_MARKER_WIDTH, DEFAULT_MARKER_HEIGHT, ICON_SIZE } from '../Constant';

//temparary variables
const ANCHOR = [], PROJ_ANCHOR = [];
const MAT2 = [];
const V2_0 = [], V2_1 = [], V2_2 = [], V2_3 = [];
const DXDY = [];

const AXIS_FACTOR = [1, -1];
const SIZE_SCALE = [1, 1];

export function getIconBox(out, mesh, i, matrix, map) {

    const uniforms = mesh.material.uniforms;
    const cameraToCenterDistance = map.cameraToCenterDistance;
    const geoProps = mesh.geometry.properties;
    const symbol = this.getSymbol(geoProps.symbolIndex);

    const positionSize = mesh.geometry.desc.positionSize;
    const aAnchor = geoProps.aAnchor;
    const anchor = vec3.set(ANCHOR, aAnchor[i * positionSize], aAnchor[i * positionSize + 1], positionSize === 2 ? 0 : aAnchor[i * positionSize + 2]);
    const { aTerrainAltitude } = geoProps;
    if (aTerrainAltitude) {
        const altitude = aTerrainAltitude[i * 2] * 100;
        if (altitude) {
            anchor[2] += altitude;
        }
    }
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

    const { aShape, aMarkerDx, aMarkerDy, aMarkerWidth, aMarkerHeight, aPitchAlign, aRotationAlign, aRotation } = geoProps;
    const markerDx = aMarkerDx ? aMarkerDx[i] : symbol['markerDx'];
    const markerDy = aMarkerDy ? aMarkerDy[i] : symbol['markerDy'];
    const pitchWithMap = aPitchAlign ? aPitchAlign[i * 2] : uniforms['markerPitchWithMap'];
    const rotateWithMap = aRotationAlign ? aRotationAlign[i * 2] : uniforms['markerRotateWithMap'];
    const dxdy = vec2.set(DXDY, markerDx || 0, -(markerDy || 0));

    let tl = vec2.set(V2_0, aShape[i * 2] / 10, aShape[i * 2 + 1] / 10),
        tr = vec2.set(V2_1, aShape[i * 2 + 2] / 10, aShape[i * 2 + 3] / 10),
        bl = vec2.set(V2_2, aShape[i * 2 + 4] / 10, aShape[i * 2 + 5] / 10),
        br = vec2.set(V2_3, aShape[i * 2 + 6] / 10, aShape[i * 2 + 7] / 10);
    if (uniforms['flipY'] === 0.0 && pitchWithMap === 1.0) {
        vec2.multiply(tl, tl, AXIS_FACTOR);
        vec2.multiply(tr, tr, AXIS_FACTOR);
        vec2.multiply(bl, bl, AXIS_FACTOR);
        vec2.multiply(br, br, AXIS_FACTOR);
    }

    const [ defaultMarkerWidth, defaultMarkerHeight ] = getDefaultMarkerSize(mesh.geometry);
    let markerWidth = (aMarkerWidth ? aMarkerWidth[i] : symbol['markerWidth']);
    if (isNil(markerWidth)) {
        markerWidth = defaultMarkerWidth || DEFAULT_MARKER_WIDTH;
    }
    let markerHeight = (aMarkerHeight ? aMarkerHeight[i] : symbol['markerHeight']);
    if (isNil(markerHeight)) {
        markerHeight = defaultMarkerHeight || DEFAULT_MARKER_HEIGHT;
    }
    const sizeScale = vec2.set(SIZE_SCALE, markerWidth / ICON_SIZE, markerHeight / ICON_SIZE);
    vec2.mul(tl, tl, sizeScale);
    vec2.mul(tr, tr, sizeScale);
    vec2.mul(bl, bl, sizeScale);
    vec2.mul(br, br, sizeScale);

    let boxRotation;
    if (aRotation) {
        boxRotation = aRotation[i * 2] / 9362;
    } else {
        boxRotation = -(symbol['markerRotation'] || 0) * Math.PI / 180;
    }

    const rotation = -boxRotation;

    //1. 获得shape的tl, tr, bl, 和br
    //2. 计算旋转矩阵: shapeMatrix
    //3. 计算最终的shape
    //   3.1 如果没有pitchWithMap，值是 shapeMatrix * shape
    //   3.2 如果pitchWithMap， 值是aAnchor和shape相加后，projectPoint后的计算结果
    //4. 将最终计算结果与dxdy相加
    const mapRotation = map.getBearing() * Math.PI / 180;
    if (mapRotation * rotateWithMap || rotation) {
        const shapeMatrix = getShapeMatrix(MAT2, rotation, mapRotation, rotateWithMap, pitchWithMap);

        tl = vec2.transformMat2(tl, tl, shapeMatrix);
        tr = vec2.transformMat2(tr, tr, shapeMatrix);
        bl = vec2.transformMat2(bl, bl, shapeMatrix);
        br = vec2.transformMat2(br, br, shapeMatrix);
    }

    if (pitchWithMap === 1) {
        getPitchPosition(out, anchor, tl, tr, bl, br, matrix, dxdy, uniforms, map, cameraDistance, perspectiveRatio);
    } else {
        vec2.multiply(tl, tl, AXIS_FACTOR);
        vec2.multiply(tr, tr, AXIS_FACTOR);
        vec2.multiply(bl, bl, AXIS_FACTOR);
        vec2.multiply(br, br, AXIS_FACTOR);
        getPosition(out, projAnchor, tl, tr, bl, br, dxdy, perspectiveRatio);
    }

    const dpr = this.getMap().getDevicePixelRatio();
    if (dpr !== 1) {
        out[0] *= dpr;
        out[1] *= dpr;
        out[2] *= dpr;
        out[3] *= dpr;
    }
    return out;
}

