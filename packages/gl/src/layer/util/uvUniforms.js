import * as maptalks from 'maptalks';
import { vec2 } from '@maptalks/reshader.gl';

const DEFAULT_TEX_OFFSET = [0, 0];
const COORD0 = new maptalks.Coordinate(0, 0);
const COORD1 = new maptalks.Coordinate(0, 0);
const ARR2_0 = [];
const ARR2_1 = [];
const UNIFORMS = [];

export function computeUVUniforms(map,
    xmin, ymin,
    patternOrigin, patternWidth, patternHeight, texAspect,
    uvScale,
    isOffsetInMeter, offsetValue, uvOffsetAnim) {
    const glRes = map.getGLRes();
    if (patternOrigin) {
        COORD0.set(patternOrigin[0], patternOrigin[1]);
        map.coordToPointAtRes(COORD0, glRes, COORD1);
        xmin = xmin - COORD1.x;
        ymin = ymin - COORD1.y;
    }

    const pointOrigin = patternOrigin ? COORD0 : null;
    // compute uv offset
    offsetValue = vec2.copy(ARR2_1, offsetValue);
    const uvOffset = !isOffsetInMeter && offsetValue || DEFAULT_TEX_OFFSET;
    let meterOffset = isOffsetInMeter && offsetValue || DEFAULT_TEX_OFFSET;
    meterOffset = vec2.copy(ARR2_0, meterOffset);
    if (meterOffset[0]) {
        meterOffset[0] = meterToPoint(map, meterOffset[0], pointOrigin);
    }
    if (meterOffset[1]) {
        meterOffset[1] = meterToPoint(map, meterOffset[1], pointOrigin, 1);
    }

    // compute uv scale
    let texWidth = 0.5;
    if (patternWidth) {
        texWidth = meterToPoint(map, patternWidth, pointOrigin);
    }

    let texHeight = texWidth / texAspect;
    if (patternHeight) {
        texHeight = meterToPoint(map, patternHeight, pointOrigin, 1);
    }

    const hasUVAnim = uvOffsetAnim && (uvOffsetAnim[0] || uvOffsetAnim[1]);
    if (hasUVAnim) {
        const timeStamp = performance.now() / 1000;
        // 256 是noiseTexture的高宽，乘以256可以保证动画首尾平滑过渡，不会出现跳跃
        // const speed = hasNoise ? 50000 : 1000;
        // const scale = (hasNoise ? 256 : 1);
        let animX = uvOffsetAnim[0];
        let animY = uvOffsetAnim[1];
        if (isOffsetInMeter) {
            animX = -meterToPoint(map, uvOffsetAnim[0], pointOrigin);
            animY = -meterToPoint(map, uvOffsetAnim[1], pointOrigin, 1);
        }
        if (uvOffsetAnim[0]) {
            if (isOffsetInMeter) {
                meterOffset[0] = timeStamp * animX;
            } else {
                uvOffset[0] = timeStamp * animX;
            }
        }
        if (uvOffsetAnim[1]) {
            if (isOffsetInMeter) {
                meterOffset[1] = timeStamp * animY;
            } else {
                uvOffset[1] = timeStamp * animY;
            }
        }
    }

    const uvStartX = ((xmin + meterOffset[0]) / (texWidth / uvScale[0]));
    const uvStartY = ((ymin - meterOffset[1]) / (texHeight / uvScale[1]));

    UNIFORMS[0] = texWidth / uvScale[0];
    UNIFORMS[1] = texHeight / uvScale[1];
    UNIFORMS[2] = uvStartX;
    UNIFORMS[3] = uvStartY;
    UNIFORMS[4] = uvOffset;
    return UNIFORMS;
}

function meterToPoint(map, meter, patternOrigin, isYAxis) {
    const glRes = map.getGLRes();
    const point = map.distanceToPointAtRes(meter, meter, glRes, patternOrigin ? COORD0 : null, COORD1);
    return isYAxis ? point.y : point.x;
}
