import { vec4 } from '@maptalks/gl';

export function projectLine(out, line, matrix, width, height) {
    const v = [];
    for (let i = 0; i < line.length; i += 3) {
        vec4.set(v, line[i], line[i + 1], line[i + 2], 1);
        projectPoint(v, v, matrix, width, height);
        const idx = i / 3 * 2;
        out[idx] = v[0];
        out[idx + 1] = v[1];
    }
    return out;
}

const v4 = [];

/**
 * Project a tile coordinate to height coordinate
 * @param {Number[]} out - array to receive result
 * @param {Number[]} point - tile coordinate
 * @param {Number[]} matrix - projection matrix
 * @param {Number} width - canvas width
 * @param {Number} height - canvas height
 */
export function projectPoint(out, point, matrix, width, height) {
    vec4.set(v4, point[0], point[1], point[2], 1);
    vec4.transformMat4(v4, v4, matrix);
    vec4.scale(v4, v4, 1 / v4[3]);
    out[0] = (v4[0] + 1) * width / 2;
    out[1] = (-v4[1] + 1) * height / 2;
    return out;
}
