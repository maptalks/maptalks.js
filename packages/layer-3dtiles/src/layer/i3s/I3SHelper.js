import transcoders from '@maptalks/gl/dist/transcoders.js';
import I3SNode from './I3SNode';
// import I3SMesh from './I3SMesh';
import { isObject } from '../../common/Util';
import { mat4 } from '@maptalks/gl';

const supportKTX2 = !!transcoders.ktx2;
const IDENTITY_MAT4 = mat4.identity([]);

const supportWASM = (() => {
    try {
        if (typeof WebAssembly === "object"
            && typeof WebAssembly.instantiate === "function") {
            const module = new WebAssembly.Module(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
            if (module instanceof WebAssembly.Module)
                return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
        }
        /* eslint-disable no-empty */
    } catch (e) {
    }
    /* eslint-enable no-empty */
    return false;
})();

export function parseI3SJSON(layer, json, rootIdx, service, url, nodeCache, fnFetchNodepages) {
    if (!nodeCache.layerScene) {
        // the scene layer
        nodeCache.layerScene = json;
        nodeCache.nodesPerPage = json.nodePages && json.nodePages.nodesPerPage || 64;
        nodeCache.lodSelectionMetricType = json.nodePages && json.nodePages.lodSelectionMetricType;
        let baseUrl = url;
        nodeCache.layerScene.eslpk = baseUrl.indexOf('3dSceneLayer.json') >= 0;
        const isUrlConfigFile = baseUrl.endsWith('.json');
        if (isUrlConfigFile) {
            const lastSlash = url.lastIndexOf('/');
            if (lastSlash < 0) {
                baseUrl = './';
            } else {
                baseUrl = url.substring(0, lastSlash);
            }
        }
        nodeCache.layerScene.baseUrl = regulateURL(baseUrl);
    }
    const node = new I3SNode(url, rootIdx, nodeCache, layer, fnFetchNodepages);
    return node.load();
}

export function isI3STileset(url) {
    return url.indexOf('i3s:tileset') >= 0;
}

export function isI3SMesh(url) {
    return url.indexOf('i3s:mesh') >= 0;
}

const prefixIndex = 'i3s:mesh:'.length
export function getI3SNodeIndex(version, url) {
    const id = url.substring(prefixIndex);
    if (version >= 1.7) {
        return parseInt(id);
    } else {
        return id;
    }

}

export function getI3SNodeInfo(url, nodeCache, regl, enableDraco, forceDraco) {
    const isESLPK = nodeCache.layerScene.eslpk;
    const nodeIndex = getI3SNodeIndex(nodeCache.version, url);
    const node = nodeCache[nodeIndex];
    const baseUrl = nodeCache.layerScene.baseUrl;
    const meshes = [];
    let hasCompression = false;
    const transform = IDENTITY_MAT4;
    let geometry, material;
    if (nodeCache.version <= 1.6) {
        // 1.6
        if (!node.geometryData) {
            return null;
        }
        const len = node.geometryData.length;
        if (!len) {
            return null;
        }
        let geoUrl = baseUrl + `/nodes/${node.id}/` + node.geometryData[len - 1].href;
        if (isESLPK) {
            geoUrl += '.bin';
        }
        const meshInfo = { geometry: { url: geoUrl, info: nodeCache.layerScene.store.defaultGeometrySchema } };
        let textureUrl = node.textureData && node.textureData[0] && node.textureData[0].href;
        if (textureUrl) {
            const mimeType = nodeCache.layerScene.store.textureEncoding[0];
            let format;
            if (mimeType === 'image/jpeg') {
                format = 'jpg';
            } else {
                format = 'png';
            }
            if (isESLPK) {
                textureUrl += '.' + format;
            }
            const matInfo = {
                pbrMetallicRoughness: {
                    baseColorTexture: {
                        url: baseUrl + `/nodes/${node.id}/` + textureUrl,
                        factor: 1,
                        format,
                        mimeType
                    },
                    metallicFactor: 0.0,
                }
            }
            meshInfo.material = matInfo;
        }
        meshes.push(meshInfo);
    } else {
        // 1.7+
        geometry = node.mesh.geometry;
        material = node.mesh.material;
        const geoDefinitions = nodeCache.layerScene.geometryDefinitions;
        //read texture encode array
        const textureEncoding = (nodeCache.layerScene.store || {}).textureEncoding;
        const geoDef = geoDefinitions[geometry.definition];
        const { geometryBuffers } = geoDef;
        // geometryBuffers[1] is the draco version
        hasCompression = enableDraco && geometryBuffers.length === 2;
        const geometryInfo = transcoders['draco'] && hasCompression ? geometryBuffers[1] : geometryBuffers[0];
        const index = transcoders['draco'] && hasCompression ? 1 : 0;
        let geoUrl = baseUrl + `/nodes/${geometry.resource}/geometries/` + index;
        if (isESLPK) {
            geoUrl += '.bin';
        }
        const meshInfo = { geometry: { url: geoUrl, info: geometryInfo } };
        if (forceDraco && supportWASM && hasCompression && !transcoders['draco']) {
            throw new Error('Must import @maptalks/transcoder.draco to load i3s draco compressed geometry');
        }

        const materialDefinitions = nodeCache.layerScene.materialDefinitions;
        const textureSetDefinitions = nodeCache.layerScene.textureSetDefinitions;
        let materialDef = 0;
        if (material) {
            materialDef = materialDefinitions[material.definition];
        }
        let materialInfo;
        if (materialDefinitions) {
            const resource = material.resource;
            materialInfo = parseMaterial(textureEncoding, materialDef, textureSetDefinitions, baseUrl, resource, regl, nodeCache.layerScene.eslpk);
        } else {
            materialInfo = {
                pbrMetallicRoughness: {
                    metallicFactor: 0.0,
                }
            };
        }
        meshInfo.material = materialInfo;
        meshes.push(meshInfo);
    }



    return {
        dracoCompression: hasCompression,
        meshes,
        nodeIndex,
        center: node.obb && node.obb.center || node.mbs && [node.mbs[0], node.mbs[1], node.mbs[2]],
        transform
    };
}

function parseMaterial(textureEncoding, materialDefinition, textureSetDefinitions, baseUrl, nodeIndex, regl, isESLPK) {
    const matInfo = JSON.parse(JSON.stringify(materialDefinition));

    resolveTextures(textureEncoding, matInfo, textureSetDefinitions, baseUrl, nodeIndex, regl, isESLPK);
    return matInfo;
}

function resolveTextures(textureEncoding, matInfo, textureSetDefinitions, baseUrl, resource, regl, isESLPK) {
    for (const p in matInfo) {
        // is a texture
        if (matInfo[p] && matInfo[p].textureSetDefinitionId >= 0) {
            const texDef = textureSetDefinitions[matInfo[p].textureSetDefinitionId];
            const mimeType = 'images/' + texDef.formats[0].format;
            const format = getSupportedTexture(texDef.formats, regl, textureEncoding);
            const texture = {
                url: baseUrl + `/nodes/${resource}/textures/${format.name}`,
                factor: matInfo[p].factor === undefined ? 1 : matInfo[p].factor,
                format: format.format,
                mimeType
            };
            if (isESLPK) {
                let ext = '';
                switch (format.format) {
                    case 'dds':
                        ext = 'bin.dds';
                        break;
                    case 'jpg':
                    case 'png':
                        ext = format.format;
                        break;
                }
                texture.url += '.' + ext;
            }
            matInfo[p] = texture;
        } else if (isObject(matInfo[p])) {
            resolveTextures(textureEncoding, matInfo[p], textureSetDefinitions, baseUrl, resource, regl, isESLPK);
        }
    }
}

const textureEnCodingMap = {
    "image/jpeg": 'jpg',
    "image/jpg": 'jpg',
    "image/png": 'jpg',
    "image/vnd-ms.dds": "dds",
    "image/ktx": 'jpg'
};

function getSupportedTexture(formats, regl, textureEncoding) {
    if (textureEncoding && textureEncoding.length) {
        const textureEncode = textureEncoding[textureEncoding.length - 1];
        const textureFormat = textureEnCodingMap[textureEncode];
        if (!textureFormat) {
            console.error(`i3s not find texture format type from:`, textureEnCodingMap, 'current textureEncoding:', textureEncode);
        } else {
            for (let i = 0, len = formats.length; i < len; i++) {
                const format = formats[i].format;
                if (format === textureFormat) {
                    return formats[i];
                }
            }
        }

    }
    // for (let i = formats.length - 1; i >= 0; i--) {
    for (let i = 0; i <= formats.length; i++) {
        const format = formats[i].format;
        if (format === 'dds' && regl.hasExtension('WEBGL_compressed_texture_s3tc')) {
            //only support dxt1 and dtx5 compression
            return formats[i];
        } else if (format === 'jpg' || format === 'png') {
            // png or jpg
            return formats[i];
        } else if (format === 'ktx2' && supportKTX2) {
            return formats[i];
        } else if (format === 'ktx-etc2') {
            // not supported yet
        }
    }
    return null;
}

function regulateURL(url) {
    return url.split('?')[0];
}
