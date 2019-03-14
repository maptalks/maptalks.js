import { vec3 } from '@maptalks/gl';

const FIRST_POINT = [], LAST_POINT = [];

export function getLabelNormal(aOffset, firstChrIdx, lastChrIdx, aVertical, aspectRatio, planeMatrix) {
    const isVertical = aVertical[firstChrIdx];

    //每个position对应了1个aPickingId和2个aOffset，所以需要乘2
    firstChrIdx *= 2;
    lastChrIdx *= 2;

    //一个feature中包含多个文字的anchor
    //1. 遍历anchor
    //2. 读取anchor第一个文字和最后一个文字的位置
    //3. 计算flip和vertical的值并设置

    //第一个文字的offset位置
    vec3.set(FIRST_POINT, aOffset[firstChrIdx], aOffset[firstChrIdx + 1], 0);
    //最后一个文字的offset位置
    vec3.set(LAST_POINT, aOffset[lastChrIdx - 2], aOffset[lastChrIdx - 1], 0);
    if (planeMatrix) {
        vec3.transformMat3(FIRST_POINT, FIRST_POINT, planeMatrix);
        vec3.transformMat3(LAST_POINT, LAST_POINT, planeMatrix);
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
            if (planeMatrix) {
                //in tile coordinate system
                flip = FIRST_POINT[1] > LAST_POINT[1] ? 0 : 1;
            } else {
                flip = FIRST_POINT[1] < LAST_POINT[1] ? 0 : 1;
            }
        } else {
            vertical = 0;
        }
    }
    // flip = 1;
    // vertical = FIRST_POINT[0] > LAST_POINT[0] ? 1 : 0;
    // vertical = 1;

    return 2 * flip + vertical;
}
