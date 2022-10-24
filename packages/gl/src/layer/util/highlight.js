import { extend, isNil, normalizeColor255, pushIn } from './util.js';
import { vec4, mat4 } from 'gl-matrix';
import * as reshader from '@maptalks/reshader.gl';

const COLOR = [];

export function clearHighlight(mesh) {
    const defines = mesh.defines;
    delete defines['HAS_HIGHLIGHT_COLOR'];
    delete defines['HAS_HIGHLIGHT_OPACITY'];
    mesh.setDefines(defines);
    delete mesh.properties.highlightTimestamp;
    deleteHighlightBloomMesh(mesh);
}

export function highlightMesh(regl, mesh, highlighted, timestamp, aFeaIds, feaIdIndiceMap) {
    const { highlightTimestamp } = mesh.properties;
    if (!highlighted) {
        if (highlightTimestamp) {
            clearHighlight(mesh);
        }
        return;
    }
    if (timestamp === highlightTimestamp) {
        return;
    }
    let { aHighlightColor, aHighlightOpacity } = mesh.geometry.properties;
    if (aHighlightColor) {
        aHighlightColor.fill(0);
    }
    if (aHighlightOpacity) {
        aHighlightOpacity.fill(255);
    }
    let hasColor = false;
    let hasOpacity = false;
    const ids = highlighted.keys();
    let hlElements = null;
    let invisibleIds = null;
    for (const id of ids) {
        if (feaIdIndiceMap.has(id)) {
            // update attribute data
            let { color, opacity, bloom, visible } = highlighted.get(id);
            let normalizedColor;
            if (color) {
                if (!hasColor) {
                    if (!aHighlightColor) {
                        aHighlightColor = new Uint8Array(aFeaIds.length * 4);
                    }
                    hasColor = true;
                }
                normalizedColor = normalizeColor255(COLOR, color);
            }
            opacity = isNil(opacity) ? 1 : opacity;
            if (opacity < 1) {
                if (!hasOpacity) {
                    if (!aHighlightOpacity) {
                        aHighlightOpacity = new Uint8Array(aFeaIds.length);
                        aHighlightOpacity.fill(255);
                    }
                    hasOpacity = true;
                }
            }
            if (visible === false) {
                if (!invisibleIds) {
                    invisibleIds = new Set();
                }
                invisibleIds.add(id);
            }
            const indices = feaIdIndiceMap.get(id);
            if (indices) {
                for (let j = 0; j < indices.length; j++) {
                    const idx = indices[j];
                    if (normalizedColor) {
                        vec4.set(aHighlightColor.subarray(idx * 4, idx * 4 + 4), ...normalizedColor);
                    }
                    if (opacity < 1) {
                        aHighlightOpacity[idx] = opacity * 255;
                    }
                    if (bloom) {
                        if (!hlElements) {
                            hlElements = [];
                        }
                        hlElements.push(idx);
                    }
                }
            }
        }
    }

    const defines = mesh.defines;
    if (hasColor) {
        if (!mesh.geometry.data.aHighlightColor) {
            mesh.geometry.data.aHighlightColor = aHighlightColor;
            mesh.geometry.generateBuffers(regl);
        } else {
            mesh.geometry.updateData('aHighlightColor', aHighlightColor);
        }
        mesh.geometry.properties.aHighlightColor = aHighlightColor;
        defines['HAS_HIGHLIGHT_COLOR'] = 1;
    } else if (defines['HAS_HIGHLIGHT_COLOR']) {
        mesh.geometry.updateData('aHighlightColor', aHighlightColor);
        delete defines['HAS_HIGHLIGHT_COLOR'];
    }
    if (hasOpacity) {
        if (!mesh.geometry.data.aHighlightOpacity) {
            mesh.geometry.data.aHighlightOpacity = aHighlightOpacity;
            mesh.geometry.generateBuffers(regl);
        } else {
            mesh.geometry.updateData('aHighlightOpacity', aHighlightOpacity);
        }
        mesh.geometry.properties.aHighlightOpacity = aHighlightOpacity;
        defines['HAS_HIGHLIGHT_OPACITY'] = 1;
    } else if (defines['HAS_HIGHLIGHT_OPACITY']) {
        mesh.geometry.updateData('aHighlightOpacity', aHighlightOpacity);
        delete defines['HAS_HIGHLIGHT_OPACITY'];
    }
    if (invisibleIds && invisibleIds.size > 0) {
        const elements = [];
        feaIdIndiceMap.forEach((value, key) => {
            if (invisibleIds.has(key)) {
                return;
            }
            pushIn(elements, value);
        });
        mesh.properties.hasInvisible = true;
        mesh.properties.oldElementsBeforeHighlight = mesh.geometry.elements;
        mesh.geometry.setElements(elements);
        mesh.geometry.generateBuffers(regl);
    } else if (mesh.properties.hasInvisible) {
        mesh.geometry.setElements(mesh.properties.oldElementsBeforeHighlight);
        delete mesh.properties.hasInvisible;
        delete mesh.properties.oldElementsBeforeHighlight;
    }
    mesh.setDefines(defines);
    mesh.properties.highlightTimestamp = timestamp;

    let hlBloomMesh = mesh.properties.hlBloomMesh;
    if (hlElements && hlElements.length) {
        if (!hlBloomMesh) {
            const geo = new reshader.Geometry(mesh.geometry.data, hlElements, 0, mesh.geometry.desc);
            geo.generateBuffers(regl);
            const material = mesh.material;
            hlBloomMesh = new reshader.Mesh(geo, material, mesh.config);
            const uniforms = mesh.uniforms;
            for (const p in uniforms) {
                Object.defineProperty(hlBloomMesh.uniforms, p, {
                    enumerable: true,
                    get: function () {
                        return mesh.getUniform(p);
                    }
                });
            }

            const defines = extend({}, mesh.defines);
            defines['HAS_BLOOM'] = 1;
            const localTransform = mat4.copy([], mesh.localTransform);
            const positionMatrix = mat4.copy([], mesh.positionMatrix);
            hlBloomMesh.setLocalTransform(localTransform);
            hlBloomMesh.setPositionMatrix(positionMatrix);
            extend(hlBloomMesh.properties, mesh.properties);
            extend(geo.properties, mesh.geometry.properties);
            hlBloomMesh.setDefines(defines);
            hlBloomMesh.bloom = 1;
        } else {
            const localTransform = mat4.copy(hlBloomMesh.localTransform, mesh.localTransform);
            const positionMatrix = mat4.copy(hlBloomMesh.positionMatrix, mesh.positionMatrix);
            hlBloomMesh.setLocalTransform(localTransform);
            hlBloomMesh.setPositionMatrix(positionMatrix);
            mesh.properties.hlBloomMesh.geometry.setElements(hlElements);
        }
        mesh.properties.hlBloomMesh = hlBloomMesh;
    } else if (hlBloomMesh) {
        deleteHighlightBloomMesh(mesh);
    }
}

export function deleteHighlightBloomMesh(mesh) {
    if (!mesh) {
        return;
    }
    const { hlBloomMesh } = mesh.properties;
    if (hlBloomMesh) {
        const hlGeo = hlBloomMesh.geometry;
        if (hlGeo.elements && hlGeo.elements.destroy) {
            hlGeo.elements.destroy();
        }
        hlBloomMesh.dispose();
        delete mesh.properties.hlBloomMesh;
    }
}
