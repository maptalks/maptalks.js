/*!
 * from claygl
 * https://github.com/pissang/claygl/
 * License: BSD-2-Clause
 */

import { vec3 } from 'gl-matrix';

function harmonics(normal, index) {
    var x = normal[0];
    var y = normal[1];
    var z = normal[2];
    if (index === 0) {
        return 1.0;
    } else if (index === 1) {
        return x;
    } else if (index === 2) {
        return y;
    } else if (index === 3) {
        return z;
    } else if (index === 4) {
        return x * z;
    } else if (index === 5) {
        return y * z;
    } else if (index === 6) {
        return x * y;
    } else if (index === 7) {
        return 3.0 * z * z - 1.0;
    } else {
        return x * x - y * y;
    }
}

var normalTransform = {
    px: [2, 1, 0, -1, -1, 1],
    nx: [2, 1, 0, 1, -1, -1],
    py: [0, 2, 1, 1, -1, -1],
    ny: [0, 2, 1, 1, 1, 1],
    pz: [0, 1, 2, -1, -1, -1],
    nz: [0, 1, 2, 1, -1, 1]
};

var targets = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];

// Project on cpu.
export default function projectEnvironmentMapCPU(cubePixels, width, height) {
    var coeff = new Array(9);
    var normal = [];
    var texel = [];
    var fetchNormal = [];
    for (var m = 0; m < 9; m++) {
        var result = [0, 0, 0];
        for (var k = 0; k < targets.length; k++) {
            // var pixels = cubePixels[targets[k]];
            var pixels = cubePixels[k];

            var sideResult = [0, 0, 0];
            var divider = 0;
            var i = 0;
            var transform = normalTransform[targets[k]];
            for (var y = 0; y < height; y++) {
                for (var x = 0; x < width; x++) {

                    normal[0] = x / (width - 1.0) * 2.0 - 1.0;
                    // TODO Flip y?
                    normal[1] = y / (height - 1.0) * 2.0 - 1.0;
                    normal[2] = -1.0;
                    vec3.normalize(normal, normal);

                    fetchNormal[0] = normal[transform[0]] * transform[3];
                    fetchNormal[1] = normal[transform[1]] * transform[4];
                    fetchNormal[2] = normal[transform[2]] * transform[5];

                    texel[0] = pixels[i++] / 255;
                    texel[1] = pixels[i++] / 255;
                    texel[2] = pixels[i++] / 255;
                    // RGBM Decode
                    var scale = pixels[i++] / 255 * 7;
                    texel[0] *= scale;
                    texel[1] *= scale;
                    texel[2] *= scale;

                    vec3.scaleAndAdd(sideResult, sideResult, texel, harmonics(fetchNormal, m) * -normal[2]);
                    // -normal.z equals cos(theta) of Lambertian
                    divider += -normal[2];
                }
            }
            vec3.scaleAndAdd(result, result, sideResult, 1 / divider);
        }

        coeff[m] = vec3.scale(result, result, 1 / 6.0);
    }
    return coeff;
}
