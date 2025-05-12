import { vec2, vec3 } from '@maptalks/gl';
import { clamp, isIconText } from '../../Util';
import { getPitchPosition, getPosition, getShapeMatrix } from './box_util';
import { GLYPH_SIZE } from '../Constant';
import { getCentiMeterScale } from '../../../../common/Util';
import { getVectorPacker } from '../../../../packer/inject';

const { PackUtil } = getVectorPacker();

const TEXT_BOX_MARGIN = 1;

//temparary variables
const MAT2 = [];
const V2_0 = [], V2_1 = [], V2_2 = [], V2_3 = [];

const DXDY = [];

const AXIS_FACTOR = [1, -1];

export function getLabelBox(out, anchor, projAnchor, mesh, textSize, textHaloRadius, i, matrix, map) {
    const uniforms = mesh.material.uniforms;
    const cameraToCenterDistance = map.cameraToCenterDistance;
    const geoProps = mesh.geometry.properties;
    const symbol = this.getSymbol(geoProps.symbolIndex);
    const isAlongLine = symbol['textPlacement'] === 'line' && !isIconText(symbol);

    const glyphSize = GLYPH_SIZE;

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

    const { aTextDx, aTextDy, aPitchAlign, aRotationAlign, aRotation, aType, aDxDy } = mesh.geometry.properties;
    let textDx, textDy;
    if (aDxDy) {
        textDx = aDxDy[i * 4 + 2];
        textDy = aDxDy[i * 4 + 3];
    } else {
        textDx = aTextDx ? aTextDx[i] : symbol['textDx'];
        textDy = aTextDy ? aTextDy[i] : symbol['textDy'];
    }

    let pitchAlign;
    if (aPitchAlign) {
        if (aType) {
            // with icon
            pitchAlign = aPitchAlign[i * 2 + 1];
        } else {
            pitchAlign = aPitchAlign[i];
        }
    }
    const pitchWithMap = aPitchAlign ? pitchAlign : uniforms['textPitchWithMap'];

    let rotateAlign;
    if (aRotationAlign) {
        if (aType) {
            // with icon
            rotateAlign = aRotationAlign[i * 2 + 1];
        } else {
            rotateAlign = aRotationAlign[i];
        }
    }
    const rotateWidthMap = aRotationAlign ? rotateAlign : uniforms['textRotateWithMap'];
    const dxdy = vec2.set(DXDY, textDx || 0, -(textDy || 0));

    if (!isAlongLine) {
        const { aShape } = geoProps;
        let tl = vec2.set(V2_0, aShape[i * 2] / 10, -aShape[i * 2 + 1] / 10),
            tr = vec2.set(V2_1, aShape[i * 2 + 2] / 10, -aShape[i * 2 + 3] / 10),
            bl = vec2.set(V2_2, aShape[i * 2 + 4] / 10, -aShape[i * 2 + 5] / 10),
            br = vec2.set(V2_3, aShape[i * 2 + 6] / 10, -aShape[i * 2 + 7] / 10);

        if (uniforms['flipY'] === 0.0 && pitchWithMap === 1.0) {
            vec2.multiply(tl, tl, AXIS_FACTOR);
            vec2.multiply(tr, tr, AXIS_FACTOR);
            vec2.multiply(bl, bl, AXIS_FACTOR);
            vec2.multiply(br, br, AXIS_FACTOR);
        }

        let textRotation;
        if (aRotation) {
            if (aType && aRotation.length > aType.length) {
                textRotation = aRotation[i * 2 + 1] / 9362;
            } else {
                textRotation = aRotation[i] / 9362;
            }
        } else {
            textRotation = (symbol['textRotation'] || 0) * Math.PI / 180;
        }
        const mapRotation = !isAlongLine ? map.getBearing() * Math.PI / 180 : 0;
        if (textRotation || mapRotation) {
            const shapeMatrix = getShapeMatrix(MAT2, textRotation, mapRotation, rotateWidthMap, pitchWithMap);
            tl = vec2.transformMat2(tl, tl, shapeMatrix);
            tr = vec2.transformMat2(tr, tr, shapeMatrix);
            bl = vec2.transformMat2(bl, bl, shapeMatrix);
            br = vec2.transformMat2(br, br, shapeMatrix);
        }

        const textScale = textSize / glyphSize;
        vec2.scale(tl, tl, textScale);
        vec2.scale(tr, tr, textScale);
        vec2.scale(bl, bl, textScale);
        vec2.scale(br, br, textScale);

        //1. 获得shape的tl, tr, bl, 和br
        //2. 计算旋转矩阵: shapeMatrix
        //3. 计算最终的shape
        //   3.1 如果没有pitchWithMap，值是 shapeMatrix * shape
        //   3.2 如果pitchWidthMap， 值是aAnchor和shape相加后，projectPoint后的计算结果
        //4. 将最终计算结果与dxdy相加


        if (pitchWithMap === 1) {
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

        const { aOffset, aShape } = geoProps;
        const is3DPitchText = aOffset.length !== aShape.length;
        let tl, tr, bl, br;
        //除以10是因为赋值时, aOffset有精度修正
        if (is3DPitchText) {
            tl = vec3.set(V2_0, aOffset[i * 3] / 10, aOffset[i * 3 + 1] / 10, aOffset[i * 3 + 2] / 10),
            tr = vec3.set(V2_1, aOffset[i * 3 + 3] / 10, aOffset[i * 3 + 4] / 10, aOffset[i * 3 + 5] / 10),
            bl = vec3.set(V2_2, aOffset[i * 3 + 6] / 10, aOffset[i * 3 + 7] / 10, aOffset[i * 3 + 8] / 10),
            br = vec3.set(V2_3, aOffset[i * 3 + 9] / 10, aOffset[i * 3 + 10] / 10, aOffset[i * 3 + 11] / 10);
        } else {
            tl = vec2.set(V2_0, aOffset[i * 2] / 10, aOffset[i * 2 + 1] / 10),
            tr = vec2.set(V2_1, aOffset[i * 2 + 2] / 10, aOffset[i * 2 + 3] / 10),
            bl = vec2.set(V2_2, aOffset[i * 2 + 4] / 10, aOffset[i * 2 + 5] / 10),
            br = vec2.set(V2_3, aOffset[i * 2 + 6] / 10, aOffset[i * 2 + 7] / 10);
        }
        if (pitchWithMap === 1) {
            const altitudeScale = getCentiMeterScale(map.getResolution(), map);
            getPitchPosition(out, anchor, tl, tr, bl, br, matrix, dxdy, uniforms, map, cameraDistance, perspectiveRatio, is3DPitchText, altitudeScale);
        } else {
            vec2.multiply(tl, tl, AXIS_FACTOR);
            vec2.multiply(tr, tr, AXIS_FACTOR);
            vec2.multiply(bl, bl, AXIS_FACTOR);
            vec2.multiply(br, br, AXIS_FACTOR);
            getPosition(out, projAnchor, tl, tr, bl, br, dxdy, perspectiveRatio);
        }
    }
    textHaloRadius = textHaloRadius || 0;
    out[0] -= textHaloRadius + TEXT_BOX_MARGIN;
    out[1] -= textHaloRadius + TEXT_BOX_MARGIN;
    out[2] += textHaloRadius + TEXT_BOX_MARGIN;
    out[3] += textHaloRadius + TEXT_BOX_MARGIN;

    const dpr = this.getMap().getDevicePixelRatio();
    if (dpr !== 1) {
        out[0] *= dpr;
        out[1] *= dpr;
        out[2] *= dpr;
        out[3] *= dpr;
    }
    return out;
}

export function getAnchor(out, mesh, i) {
    const positionSize = mesh.geometry.desc.positionSize;
    const { aAnchor, aAltitude, aTerrainAltitude } = mesh.geometry.properties;
    const idx = i * positionSize;
    if (aAltitude) {
        vec3.set(out, aAnchor[idx], aAnchor[idx + 1], aAltitude[i]);
    } else {
        if (positionSize === 3) {
            PackUtil.unpackPosition(out, aAnchor[idx], aAnchor[idx + 1], aAnchor[idx + 2]);
        } else {
            vec3.set(out, aAnchor[idx], aAnchor[idx + 1], 0);
        }
    }

    if (aTerrainAltitude) {
        const altitude = aTerrainAltitude[i * 2] * 100;
        if (altitude) {
            out[2] += altitude;
        }
    }
    return out;
}
