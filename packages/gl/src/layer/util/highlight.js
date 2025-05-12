import { extend, isNil, normalizeColor255, pushIn } from './util.js';
import { vec4, mat4 } from '@maptalks/reshader.gl';
import * as reshader from '@maptalks/reshader.gl';

const COLOR = [];


export function clearShowOnly(mesh) {
    if (!mesh.properties.showOnlyTimestamp) {
        return;
    }
    delete mesh.properties.showOnlyTimestamp;
    restoreOldElements(mesh);
}

function saveOldElements(mesh, elements) {
    const geoProps = mesh.geometry.properties;
    if (!geoProps.oldElementsBeforeHighlight) {
        geoProps.oldElementsBeforeHighlight = mesh.geometry.elements;
    }
    if (geoProps.elements) {
        if (!geoProps.oldElementsArrBeforeHighlight) {
            geoProps.oldElementsArrBeforeHighlight = geoProps.elements;
        }
        geoProps.elements = elements;
    }
}

function restoreOldElements(mesh) {
    const oldElementsBeforeHighlight = mesh.geometry.properties.oldElementsBeforeHighlight;
    if (!oldElementsBeforeHighlight || mesh.geometry.elements === oldElementsBeforeHighlight) {
        return;
    }
    mesh.geometry.deleteElements();
    mesh.geometry.setElements(mesh.geometry.properties.oldElementsBeforeHighlight);
    if (mesh.geometry.properties.oldElementsArrBeforeHighlight) {
        mesh.geometry.properties.elements = mesh.geometry.properties.oldElementsArrBeforeHighlight;
        delete mesh.geometry.properties.oldElementsArrBeforeHighlight;
    }
    delete mesh.geometry.properties.hasInvisible;
    delete mesh.geometry.properties.oldElementsBeforeHighlight;
}

export function showOnly(regl, mesh, items, timestamp, feaIdIndiceMap) {
    const { showOnlyTimestamp } = mesh.properties;
    if (!items) {
        if (showOnlyTimestamp) {
            clearShowOnly(mesh);
        }
        return;
    }
    if (timestamp === showOnlyTimestamp) {
        return;
    }
    mesh.properties.showOnlyTimestamp = timestamp;
    const ids = items.keys();
    const elements = [];
    for (const id of ids) {
        if (!feaIdIndiceMap.has(id)) {
            continue;
        }
        const indices = feaIdIndiceMap.get(id);
        if (indices) {
            pushIn(elements, indices);
        }
    }

    saveOldElements(mesh, elements);
    if (mesh.geometry.elements !== mesh.geometry.properties.oldElementsBeforeHighlight && mesh.geometry.elements.destroy) {
        mesh.geometry.deleteElements();
    }
    const info = {
        data: elements,
        // type: mesh.geometry.getElementsType(elements),
        primitive: mesh.geometry.getPrimitive()
    };
    mesh.geometry.setElements(regl.elements(info));
    mesh.geometry.generateBuffers(regl);
}

export function clearHighlight(mesh) {
    if (!mesh.properties.highlightTimestamp) {
        return;
    }
    const defines = mesh.defines;
    delete defines['HAS_HIGHLIGHT_COLOR'];
    delete defines['HAS_HIGHLIGHT_OPACITY'];
    mesh.setDefines(defines);
    delete mesh.properties.highlightTimestamp;
    restoreOldElements(mesh);
    deleteHighlightBloomMesh(mesh);
}

export function highlightMesh(regl, mesh, highlighted, timestamp, feaIdIndiceMap) {
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
    const isInstanced = mesh instanceof reshader.InstancedMesh;
    const vertexCount = isInstanced ? mesh.instanceCount : mesh.geometry.getVertexCount();
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
            const highlightedData = highlighted.get(id);
            const { color, bloom, visible, nodeIndex } = highlightedData;
            if (!isNil(nodeIndex) && nodeIndex !== mesh.properties.nodeIndex) {
                continue;
            }
            let { opacity } = highlightedData;
            let normalizedColor;
            if (color) {
                if (!hasColor) {
                    if (!aHighlightColor) {
                        aHighlightColor = new Uint8Array(vertexCount * 4);
                    }
                    hasColor = true;
                }
                normalizedColor = normalizeColor255(COLOR, color);
            }
            opacity = isNil(opacity) ? 1 : opacity;
            if (opacity < 1) {
                if (!hasOpacity) {
                    if (!aHighlightOpacity) {
                        aHighlightOpacity = new Uint8Array(vertexCount);
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
            if (normalizedColor || opacity < 1 || bloom) {
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
    }


    const geometry = mesh.geometry;
    const defines = mesh.defines;
    if (hasColor) {
        if (isInstanced) {
            mesh.updateInstancedData('aHighlightColor', aHighlightColor);
            mesh.generateInstancedBuffers(regl);
        } else {
            if (!geometry.data.aHighlightColor) {
                geometry.data.aHighlightColor = aHighlightColor;
                geometry.generateBuffers(regl);
            } else {
                geometry.updateData('aHighlightColor', aHighlightColor);
            }
            geometry.properties.aHighlightColor = aHighlightColor;
        }
        defines['HAS_HIGHLIGHT_COLOR'] = 1;
    } else if (defines['HAS_HIGHLIGHT_COLOR']) {
        if (isInstanced) {
            mesh.updateInstancedData('aHighlightColor', aHighlightColor);
            mesh.generateInstancedBuffers(regl);
        } else {
            geometry.updateData('aHighlightColor', aHighlightColor);
        }
        delete defines['HAS_HIGHLIGHT_COLOR'];
    }
    if (hasOpacity) {
        if (isInstanced) {
            mesh.updateInstancedData('aHighlightOpacity', aHighlightOpacity);
            mesh.generateInstancedBuffers(regl);
        } else {
            if (!geometry.data.aHighlightOpacity) {
                geometry.data.aHighlightOpacity = aHighlightOpacity;
                geometry.generateBuffers(regl);
            } else {
                geometry.updateData('aHighlightOpacity', aHighlightOpacity);
            }
            geometry.properties.aHighlightOpacity = aHighlightOpacity;
        }

        defines['HAS_HIGHLIGHT_OPACITY'] = 1;
    } else if (defines['HAS_HIGHLIGHT_OPACITY']) {
        if (isInstanced) {
            mesh.updateInstancedData('aHighlightOpacity', aHighlightOpacity);
            mesh.generateInstancedBuffers(regl);
        } else {
            geometry.updateData('aHighlightOpacity', aHighlightOpacity);
        }
        delete defines['HAS_HIGHLIGHT_OPACITY'];
    }
    if (invisibleIds && invisibleIds.size > 0) {
        let elements = [];
        feaIdIndiceMap.forEach((value, key) => {
            if (invisibleIds.has(key)) {
                return;
            }
            pushIn(elements, value);
        });
        geometry.properties.hasInvisible = true;
        saveOldElements(mesh, elements);
        const info = {
            data: elements,
            // type: geometry.getElementsType(elements),
            primitive: geometry.getPrimitive()
        };
        if (geometry.elements !== geometry.properties.oldElementsBeforeHighlight && geometry.elements.destroy) {
            geometry.deleteElements();
        }
        elements = regl.elements(info);
        geometry.setElements(elements);
        geometry.generateBuffers(regl);
    } else if (geometry.properties.hasInvisible) {
        restoreOldElements(mesh);
    }
    mesh.setDefines(defines);
    mesh.properties.highlightTimestamp = timestamp;

    let hlBloomMesh = mesh.properties.hlBloomMesh;
    if (hlElements && hlElements.length) {
        if (!hlBloomMesh) {
            const geo = new reshader.Geometry(geometry.data, hlElements, 0, geometry.desc);
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
            extend(geo.properties, geometry.properties);
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
            hlGeo.deleteElements();
        }
        hlBloomMesh.dispose();
        delete mesh.properties.hlBloomMesh;
    }
}
