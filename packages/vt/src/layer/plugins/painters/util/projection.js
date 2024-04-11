import { vec4 } from '@maptalks/gl';

const v4 = [];

/**
 * Project a tile coordinate to screen coordinate
 * @param {Number[]} out - array to receive result
 * @param {Number[]} point - tile coordinate
 * @param {Number[]} matrix - projection matrix
 * @param {Number} width - canvas width
 * @param {Number} height - canvas height
 */
export function projectPoint(out, point, matrix, width, height) {
    vec4.set(v4, point[0], point[1], point[2], 1);
    vec4.transformMat4(v4, v4, matrix);
    out[2] = v4[3]; //depth
    vec4.scale(v4, v4, 1 / v4[3]);
    out[0] = (v4[0] + 1) * width / 2;
    out[1] = (-v4[1] + 1) * height / 2;
    return out;
}

/**
 * Project a line from tile coordinate to screen coordinate
 * @param {Number[]} out - array to receive result
 * @param {Number[]} line - line's tile coordinate
 * @param {Number[]} matrix - projection matrix
 * @param {Number} width - canvas width
 * @param {Number} height - canvas height
 */
export function projectLine(out, line, matrix, width, height) {
    for (let i = 0; i < line.length; i += 3) {
        vec4.set(v4, line[i], line[i + 1], line[i + 2], 1);
        projectPoint(v4, v4, matrix, width, height);
        out[i] = v4[0];
        out[i + 1] = v4[1];
        //TODO line[i + 2]的单位？
        out[i + 2] = line[i + 2];
    }
    return out;
}
