import { exportIndices } from '../util/Util.js';
import { vec3 } from '@mapbox/gl-matrix';

/**
 * Generate normals per vertex.
 * from claygl's Geometry
 */
export function buildFaceNormals(vertices, indices) {
    const normals = new Float32Array(vertices.length);

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

        vec3.set(p1, vertices[i1 * 3], vertices[i1 * 3 + 1], vertices[i1 * 3 + 2]);
        vec3.set(p2, vertices[i2 * 3], vertices[i2 * 3 + 1], vertices[i2 * 3 + 2]);
        vec3.set(p3, vertices[i3 * 3], vertices[i3 * 3 + 1], vertices[i3 * 3 + 2]);

        vec3.sub(v21, p2, p1);
        vec3.sub(v32, p2, p3);

        vec3.cross(n, v21, v32);

        vec3.normalize(n, n);

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
    const l = indices.length;
    for (let i = 0; i < keys.length; i++) {
        const name = keys[i];
        oldData[name] = data[name];
        data[name] = new oldData[name].constructor(l * desc[name].size);
    }

    let cursor = 0;
    for (let i = 0; i < l; i++) {
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

//http://wiki.jikexueyuan.com/project/modern-opengl-tutorial/tutorial39.html
export function buildShadowVolume(vertices, verticeIds, indices, normals, shadowDir) {
    const edges = {};
    const silhoutte = [];

    // find silhoutte
    let v0, v1, v2;
    // variables to reuse
    const faceEdges = [],
        faceNormal = [],
        otherNormal = [];
    for (let i = 0, l = indices.length; i < l; i += 3) {
        v0 = verticeIds[i];
        v1 = verticeIds[i + 1];
        v2 = verticeIds[i + 2];

        // faceEdges[0] = v0; faceEdges[1] = v1;
        // faceEdges[2] = v1; faceEdges[3] = v2;
        // faceEdges[4] = v0; faceEdges[5] = v2;
        faceEdges[0] = {
            edgeId : v0 < v1 ? v0 + ':' + v1 : v1 + ':' + v0,
            v0 : indices[i],
            v1 : indices[i + 1]
        };
        faceEdges[1] = {
            edgeId : v2 < v1 ? v2 + ':' + v1 : v1 + ':' + v2,
            v0 : indices[i + 1],
            v1 : indices[i + 2]
        };
        faceEdges[2] = {
            edgeId : v0 < v2 ? v0 + ':' + v2 : v2 + ':' + v0,
            v0 : indices[i + 2],
            v1 : indices[i]
        };

        const idx = indices[i] * 3;
        vec3.set(faceNormal, normals[idx], normals[idx + 1], normals[idx + 2]);

        for (let ii = 0; ii < faceEdges.length; ii++) {
            // const e0 = faceEdges[ii], e1 = faceEdges[ii + 1];
            const edgeId = faceEdges[ii].edgeId;

            if (edgeId in edges) {
                const normIdx = edges[edgeId];
                vec3.set(otherNormal, normals[normIdx], normals[normIdx + 1], normals[normIdx + 2]);
                const dot0 = vec3.dot(faceNormal, shadowDir),
                    dot1 = vec3.dot(otherNormal, shadowDir);
                if (dot0 * dot1 <= 0 && (dot0 > 0 || dot1 > 0)) {
                    // found a silhoutte edge
                    v0 = faceEdges[ii].v0;
                    v1 = faceEdges[ii].v1;
                    silhoutte.push(vertices[v0 * 3], vertices[v0 * 3 + 1], vertices[v0 * 3 + 2]);
                    silhoutte.push(vertices[v1 * 3], vertices[v1 * 3 + 1], vertices[v1 * 3 + 2]);
                }
            } else {
                // record current face normal index to compare with the next one
                edges[edgeId] = idx;
            }
        }
    }
    const lightCap = silhoutte,
        l = lightCap.length,
        vertCount = l / 3,
        totalCount = lightCap.length * 2 / 3 * 4,
        shadowVerts = new Int16Array(totalCount);

    const sideIndices = [];
    let vertIdx;

    for (let i = 0; i < l; i += 3) {
        vertIdx = i / 3 * 4;
        // light cap vertices
        shadowVerts[vertIdx] = lightCap[i];
        shadowVerts[vertIdx + 1] = lightCap[i + 1];
        shadowVerts[vertIdx + 2] = lightCap[i + 2];
        shadowVerts[vertIdx + 3] = 1; // w

        // shadow cap vertices - along shadowDir to infinity
        shadowVerts[vertIdx + totalCount / 2] = lightCap[i] - shadowDir[0];
        shadowVerts[vertIdx + 1 + totalCount / 2] = lightCap[i + 1] - shadowDir[1];
        shadowVerts[vertIdx + 2 + totalCount / 2] = lightCap[i + 2] - shadowDir[2];
        shadowVerts[vertIdx + 2 + totalCount / 2] = 0; // w = 0 (infinity)

        // build side indices
        if (i === 0) {
            sideIndices.push(0, vertCount - 1, 2 * vertCount - 1);
            sideIndices.push(0, 2 * vertCount - 1, vertCount);
        } else {
            const idx = i / 3;
            // ccw order
            //      1 --0
            //      | /
            //      2
            sideIndices.push(idx, idx - 1, idx + vertCount);
            //          0
            //        / |
            //       1--2
            sideIndices.push(idx, idx - 1 + vertCount, idx + vertCount);
        }
    }

    return {
        vertices : shadowVerts,
        indices : exportIndices(sideIndices)
    };
}
