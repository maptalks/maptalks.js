import { pushIn, exportIndices } from '../../common/Util';
import earcut from 'earcut';
import { vec3 } from 'gl-matrix';

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
        indices[i] = cursor++;
    }

    return data;
}

//http://wiki.jikexueyuan.com/project/modern-opengl-tutorial/tutorial39.html
export function buildShadowVolume(allVerts, allVertIds, allIndices, allNormals, featureIndexes, shadowDir) {
    const features = new featureIndexes.constructor(featureIndexes.length);
    const shadowVerts = [];
    const shadowIndices = [];
    let preOffset = 0;
    for (let i = 0, l = 1; i < l; i++) {
        const offset = featureIndexes[i];
        const { vertices, indices } = buildFeatureShadow(
            allVerts,
            allVertIds,
            allIndices.subarray(preOffset, offset),
            allNormals,
            shadowDir
        );
        preOffset = offset;
        pushIn(shadowVerts, vertices);
        pushIn(shadowIndices, indices.map(p => p + shadowIndices.length));
        features[i] = shadowIndices.length;
    }
    return {
        vertices: new Int16Array(shadowVerts),
        indices: exportIndices(shadowIndices),
        indexes: features
    };
}

function buildFeatureShadow(vertices, verticeIds, indices, normals, shadowDir) {
    let front = [];
    const back = [];

    const edges = {};
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

        faceEdges[0] = {
            edgeId: v0 < v1 ? v0 + ':' + v1 : v1 + ':' + v0,
            v0: indices[i],
            v1: indices[i + 1]
        };
        faceEdges[1] = {
            edgeId: v2 < v1 ? v2 + ':' + v1 : v1 + ':' + v2,
            v0: indices[i + 1],
            v1: indices[i + 2]
        };
        faceEdges[2] = {
            edgeId: v0 < v2 ? v0 + ':' + v2 : v2 + ':' + v0,
            v0: indices[i + 2],
            v1: indices[i]
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
                    const silhoutte = dot0 >= 0 ? front : back;
                    if (checkEdgeVertice(silhoutte, vertices, v0)) {
                        silhoutte.push(vertices[v0 * 3], vertices[v0 * 3 + 1], vertices[v0 * 3 + 2]);
                    }
                    if (checkEdgeVertice(silhoutte, vertices, v1)) {
                        silhoutte.push(vertices[v1 * 3], vertices[v1 * 3 + 1], vertices[v1 * 3 + 2]);
                    }

                }
            } else {
                // record current face normal index to compare with the next one
                edges[edgeId] = idx;
            }
        }
    }
    if (!front.length) {
        return {
            vertices: [],
            indices: []
        };
    }

    const lightCap = front,
        l = lightCap.length;

    if (lightCap[0] === lightCap[l - 3] && lightCap[1] === lightCap[l - 2] && lightCap[2] === lightCap[l - 1]) {
        front = front.slice(0, l - 3);
    }
    const shadowIndices = earcut(front, null, 3);


    // const vertCount = l / 3,
    const totalCount = l / 3 * 4, //l * 2 / 3 * 4
        shadowVerts = new Array(totalCount);
    let vertIdx;

    for (let i = 0; i < l; i += 3) {
        vertIdx = i / 3 * 4;
        // light cap vertices
        shadowVerts[vertIdx] = lightCap[i];
        shadowVerts[vertIdx + 1] = lightCap[i + 1];
        shadowVerts[vertIdx + 2] = lightCap[i + 2];
        shadowVerts[vertIdx + 3] = 1; // w

        // shadow cap vertices - along shadowDir to infinity
        // shadowVerts[vertIdx + totalCount / 2] = lightCap[i] - shadowDir[0];
        // shadowVerts[vertIdx + 1 + totalCount / 2] = lightCap[i + 1] - shadowDir[1];
        // shadowVerts[vertIdx + 2 + totalCount / 2] = lightCap[i + 2] - shadowDir[2];
        // shadowVerts[vertIdx + 3 + totalCount / 2] = 0; // w = 0 (infinity)

        // // build side indices
        // if (i === 0) {
        //     shadowIndices.push(0, vertCount - 1, 2 * vertCount - 1);
        //     shadowIndices.push(0, 2 * vertCount - 1, vertCount);
        // } else {
        //     const idx = i / 3;
        //     // ccw order
        //     //      1 --0
        //     //      | /
        //     //      2
        //     shadowIndices.push(idx, idx - 1, idx + vertCount);
        //     //          0
        //     //        / |
        //     //       1--2
        //     shadowIndices.push(idx, idx - 1 + vertCount, idx + vertCount);
        // }
    }

    return {
        vertices: shadowVerts,
        indices: shadowIndices
    };
}

function checkEdgeVertice(silhoutte, vertices, v0) {
    const x = vertices[v0 * 3], y = vertices[v0 * 3 + 1], z = vertices[v0 * 3 + 2];
    const l = silhoutte.length;
    if (l > 3 && silhoutte[l - 1] === z && silhoutte[l - 2] === y && silhoutte[l - 3] === x) {
        return false;
    }
    if (l > 6 && silhoutte[l - 4] === z && silhoutte[l - 5] === y && silhoutte[l - 3] === x) {
        return false;
    }
    return true;
}

export function createBarycentric(position, indices) {
    const bary = new Uint8Array(position.length);
    for (let i = 0, l = indices.length; i < l;) {
        for (let j = 0; j < 3; j++) {
            const ii = indices[i++];
            bary[ii * 3 + j] = 1;
        }
    }
    return bary;
}
