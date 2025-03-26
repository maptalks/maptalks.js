import { vec2, vec3 } from '@maptalks/gl';
import { getCharOffset } from './get_char_offset';

const FIRST_POINT = [], LAST_POINT = [];

export function getLabelNormal(firstCharOffset, lastCharOffset, mesh,
    textSize, line, firstChrIdx, lastChrIdx, projectedAnchor,
    anchor, scale, aspectRatio, planeMatrix, textMaxAngle) {
    const { aVertical } = mesh.geometry.properties;
    const isVertical = aVertical[firstChrIdx];

    //一个feature中包含多个文字的anchor
    //1. 遍历anchor
    //2. 读取anchor第一个文字和最后一个文字的位置
    //3. 计算flip和vertical的值并设置

    let offset = getCharOffset.call(this, FIRST_POINT, mesh, textSize, line, firstChrIdx, projectedAnchor, anchor, scale, false);
    if (!offset) {
        return null;
    }
    vec3.copy(firstCharOffset, offset);
    offset = getCharOffset.call(this, LAST_POINT, mesh, textSize, line, lastChrIdx, projectedAnchor, anchor, scale, false);
    textMaxAngle = Math.PI * textMaxAngle / 180;
    if (!offset || Math.abs(offset[2]) > textMaxAngle) {
        return null;
    }
    vec3.copy(lastCharOffset, offset);
    if (planeMatrix) {
        vec2.transformMat2(FIRST_POINT, FIRST_POINT, planeMatrix);
        vec2.transformMat2(LAST_POINT, LAST_POINT, planeMatrix);
    }
    let vertical, flip;
    if (!isVertical) {
        vertical = 0;
        flip = FIRST_POINT[0] > LAST_POINT[0] ? 1 : 0;
    } else {
        const rise = Math.abs(LAST_POINT[1] - FIRST_POINT[1]);
        const run = Math.abs(LAST_POINT[0] - FIRST_POINT[0]) * aspectRatio;
        flip = FIRST_POINT[0] > LAST_POINT[0] ? 1 : 0;
        if (rise > run) {
            vertical = 1;
            flip = FIRST_POINT[1] < LAST_POINT[1] ? 0 : 1;
        } else {
            vertical = 0;
        }
    }
    // flip = 1;
    // vertical = FIRST_POINT[0] > LAST_POINT[0] ? 1 : 0;
    // vertical = 1;

    return 2 * flip + vertical;
}
