import { vec3 } from '@mapbox/gl-matrix';

const normalOrigin = [1, 1, 1];

/**
 * Generate normals per vertex.
 * from claygl's Geometry
 */
export function buildFaceNormals(positions, indices) {
    const normals = new Float32Array(positions.length);

    const p1 = new Array(3);
    const p2 = new Array(3);
    const p3 = new Array(3);

    const v21 = new Array(3);
    const v32 = new Array(3);
    const n = new Array(3);

    const len = indices.length;
    let i1, i2, i3;
    for (let f = 0; f < len;) {
        if (indices) {
            i1 = indices[f++];
            i2 = indices[f++];
            i3 = indices[f++];
        } else {
            i1 = f++;
            i2 = f++;
            i3 = f++;
        }

        vec3.set(p1, positions[i1 * 3], positions[i1 * 3 + 1], positions[i1 * 3 + 2]);
        vec3.set(p2, positions[i2 * 3], positions[i2 * 3 + 1], positions[i2 * 3 + 2]);
        vec3.set(p3, positions[i3 * 3], positions[i3 * 3 + 1], positions[i3 * 3 + 2]);

        vec3.sub(v21, p2, p1);
        vec3.sub(v32, p2, p3);

        vec3.cross(n, v21, v32);

        vec3.normalize(n, n);

        // if (vec3.dot(n, normalOrigin) < 0) {
        //     vec3.negate(n, n);
        // }

        for (let i = 0; i < 3; i++) {
            normals[i1 * 3 + i] = n[i];
            normals[i2 * 3 + i] = n[i];
            normals[i3 * 3 + i] = n[i];
        }
    }
    return normals;
}


/**
 * Create a unique vertex for each index.
 * base on claygl's Geometry
 */
export function buildUniqueVertex(data, indices, desc) {

    const keys = Object.keys(data);

    const oldData = {};
    for (let i = 0; i < keys.length; i++) {
        const name = keys[i];
        oldData[name] = data[name];
        data[name] = new oldData[name].constructor(indices.length * desc[name].size);
    }

    let cursor = 0;
    for (let i = 0; i < indices.length; i++) {
        const idx = indices[i];
        for (let ii = 0; ii < keys.length; ii++) {
            const name = keys[ii];
            const array = data[name];
            const size = desc[name].size;

            for (let k = 0; k < size; k++) {
                array[cursor * size + k] = oldData[name][idx * size + k];
            }
        }
        indices[i] = cursor;
        cursor++;
    }

    return data;
}
