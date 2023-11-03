import { radianToCartesian3 } from '../../common/Transform';
import { toRadian } from '../../common/Util';
import { vec3, mat3, mat4 } from 'gl-matrix';
import { fillNodepagesToCache } from './Util';

const TEMP_VEC3 = [];

export default class I3SNode {
    constructor(url, rootIdx, nodeCache, layer, fnFetchNodepages) {
        this._layer = layer;
        this._url = url;
        this._rootIdx = rootIdx;
        this._fnFetchNodepages = fnFetchNodepages;
        this._version = nodeCache.version;
        if (url.indexOf('i3s:tileset:') < 0) {
            if (this._version <= 1.6) {
                this._index = 'root';
            } else {
                this._index = 0;
            }
            nodeCache.version = this._version;
        } else {
            this._index = url.substring('i3s:tileset:'.length);
            if (this._version > 1.6) {
                this._index = parseInt(this._index);
            }
        }
        this._url = url;
        this._nodeCache = nodeCache;
    }

    load() {
        const nodeCache = this._nodeCache;
        const baseUrl = nodeCache.layerScene.baseUrl;

        if (this._version <= 1.6) {
            if (nodeCache[this._index] && nodeCache[this._index].lodSelection) {
                this._nodeJSON = nodeCache[this._index];
                return this._loadNode();
            }
            return new Promise((resolve) => {
                let url = baseUrl + '/nodes/' + this._index;
                if (nodeCache.layerScene.eslpk) {
                    url += '/3dNodeIndexDocument.json';
                }
                this._fnFetchNodepages(this._rootIdx, url, () => {
                    this._nodeJSON = nodeCache[this._index];
                    resolve(this._loadNode());
                });
            });
        } else if (this._version >= 1.7) {
            if (nodeCache[this._index]) {
                this._nodeJSON = nodeCache[this._index];
                return this._loadNode();
            }
            const nodepage = Math.floor(this._index / nodeCache.nodesPerPage);
            //root node

            return new Promise((resolve) => {
                let url = baseUrl + '/nodepages/' + nodepage;
                if (nodeCache.layerScene.eslpk) {
                    url += '.json';
                }
                this._fnFetchNodepages(this._rootIdx, url, () => {
                    this._nodeJSON = nodeCache[this._index];
                    resolve(this._loadNode());
                });
            });
        } else {
            // leaf nodes
            return null;
        }
    }

    getTileset() {
        return this._tileset;
    }

    getChildrenURL() {
        return this._childrenURL;
    }

    _loadNode() {
        const nodeCache = this._nodeCache;
        const baseUrl = nodeCache.layerScene.baseUrl;
        const children = this._nodeJSON.children;
        const promises = [];
        const pendingReqs = {};
        if (children) {
            for (let i = 0; i < children.length; i++) {
                if (this._version <= 1.6) {
                    const id = children[i].id;
                    if (nodeCache[id]) {
                        continue;
                    }
                    const childPageIndex = id;
                    if (!pendingReqs[childPageIndex]) {
                        pendingReqs[childPageIndex] = new Promise((resolve) => {
                            let url = baseUrl + '/nodes/' + childPageIndex;
                            if (nodeCache.layerScene.eslpk) {
                                url += '/3dNodeIndexDocument.json';
                            }
                            this._fnFetchNodepages(this._rootIdx, url, () => {
                                resolve();
                            });
                        });
                        promises.push(pendingReqs[childPageIndex]);
                    }
                } else {
                    const id = children[i];
                    if (nodeCache[id]) {
                        continue;
                    }
                    const childPageIndex = Math.floor(id / nodeCache.nodesPerPage);
                    if (!pendingReqs[childPageIndex]) {
                        pendingReqs[childPageIndex] = new Promise((resolve) => {
                            let url = baseUrl + '/nodepages/' + childPageIndex;
                            if (nodeCache.layerScene.eslpk) {
                                url += '.json';
                            }
                            this._fnFetchNodepages(this._rootIdx, url, () => {
                                resolve();
                            });
                        });
                        promises.push(pendingReqs[childPageIndex]);
                    }
                }

            }
        }
        if (promises.length) {
            return Promise.all(promises).then(() => {
                return this._loadContent();
            });
        } else {
            return this._loadContent();
        }
    }

    _loadContent() {
        return Promise.resolve(this._createTileset());
    }

    _fillCache(nodes) {
        fillNodepagesToCache(this._nodeCache, nodes);
    }

    _createTileset() {
        const inPlaceTileset = {
            asset: {
                i3s: true,
                version: "1.0",
                gltfUpAxis: 'Z'
            },
            geometricError: Number.MAX_VALUE,
            root: this._convertNode(this._nodeJSON, true),
        };
        return inPlaceTileset;
    }

    _convertNode(nodeJSON) {
        const renderer = this._layer.getRenderer();
        const projection = this._nodeCache.projection;
        const is4326 = !projection || projection && projection.wkid === 4326;
        const version = this._version;
        const nodeCache = this._nodeCache;
        const nodeData = nodeJSON;
        const obb = nodeData.obb;
        const mbs = nodeData.mbs;

        const boundingVolume = {};
        let position;

        if (mbs) {
            position = vec3.set([], mbs[0], mbs[1], mbs[2]);
            if (!is4326) {
                position = renderer._tileCoordToLngLat(position, position);
            }
            position = _WGS84ToCartesian([], position[0], position[1], position[2]); // cartesian center of box
            boundingVolume.sphere = [
                ...position, // cartesian center of sphere
                mbs[3] // radius of sphere
            ];
        } else if (obb) {
            position = vec3.set([], obb.center[0], obb.center[1], obb.center[2]); // cartesian center of box;
            if (!is4326) {
                position = renderer._tileCoordToLngLat(position, position);
            }
            position = _WGS84ToCartesian([], position[0], position[1], position[2]); // cartesian center of box;
            const box = fromCenterHalfSizeQuaternion(
                position, // cartesian center of box
                obb.halfSize,
                obb.quaternion
            );
            // boundingVolume.box = box;
            // 计算box的半径
            const x = box[3] + box[6] + box[9];
            const y = box[4] + box[7] + box[10];
            const z = box[5] + box[8] + box[11];
            vec3.set(TEMP_VEC3, x, y, z);
            const radius = vec3.len(TEMP_VEC3);
            boundingVolume.sphere = [
                ...position,
                radius
            ];
        }

        // compute the geometric error
        let metersPerPixel = Infinity;

        let span = 0;
        if (nodeData.mbs) {
            span = nodeData.mbs[3];
        } else if (nodeData.obb) {
            span = Math.max(
                Math.max(nodeData.obb.halfSize[0], nodeData.obb.halfSize[1]),
                nodeData.obb.halfSize[2]
            );
        }

        // get the meters/pixel density required to pop the next LOD
        if (nodeData.lodThreshold !== undefined) {
            if (
                nodeCache.lodSelectionMetricType ===
          "maxScreenThresholdSQ"
            ) {
                const maxScreenThreshold =
            Math.sqrt(nodeData.lodThreshold) / (Math.PI * 0.25);
                metersPerPixel = span / maxScreenThreshold;
            } else {
                console.error("Unsupported lodSelectionMetricType in Layer");
            }
        } else if (nodeData.lodSelection !== undefined) {
            for (
                let lodIndex = 0;
                lodIndex < nodeData.lodSelection.length;
                lodIndex++
            ) {
                if (
                    nodeData.lodSelection[lodIndex].metricType === "maxScreenThreshold"
                ) {
                    metersPerPixel = span / nodeData.lodSelection[lodIndex].maxError;
                }
            }
        }

        if (metersPerPixel === Infinity || isNaN(metersPerPixel)) {
            metersPerPixel = 100000;
        }

        // calculate the length of 16 pixels in order to trigger the screen space error
        const geometricError = metersPerPixel * 16;

        const globalTransforms = mat4.identity([]);
        // globalTransforms[12] = position[0];
        // globalTransforms[13] = position[1];
        // globalTransforms[14] = position[2];

        const localTransforms = globalTransforms;

        const children = nodeData.children;
        let childrenDefinition;
        // get children definition
        if (children) {
            childrenDefinition = [];
            const nodeCache = this._nodeCache;
            for (let i = 0; i < children.length; i++) {
                const childIndex = version <= 1.6 ? children[i].id : children[i];
                if (nodeCache[childIndex]) {
                    childrenDefinition.push(
                        this._convertNode(nodeCache[childIndex])
                    );
                } else {
                    childrenDefinition = null;
                    break;
                }
            }
        }


        // Create a tile set
        const inPlaceTileDefinition = {
            refine: "REPLACE",
            boundingVolume: boundingVolume,
            transform: localTransforms,
            geometricError: geometricError,
        };

        if (version <= 1.6) {
            if (!nodeJSON.lodSelection) {
                // 1.6的node即是个tileset，又是个mesh
                // 因为只在3DNodeDocumentIndex中存了children信息
                // 载入3DNodeDocumentIndex之前，是个tileset，载入后，就成为了mesh
                // 如果没有lodSelection，说明是个tileset
                inPlaceTileDefinition.content = {
                    uri: 'i3s:tileset:' + (nodeJSON.id || nodeJSON.index),
                };
            } else if (nodeJSON.geometryData) {
                inPlaceTileDefinition.content = {
                    uri: 'i3s:mesh:' + (nodeJSON.id || nodeJSON.index),
                };
            }
        } else {
            if (children && children.length && !childrenDefinition) {
                // a child
                inPlaceTileDefinition.content = {
                    uri: 'i3s:tileset:' + (nodeJSON.id || nodeJSON.index),
                };
            } else if (nodeData.mesh) {
                inPlaceTileDefinition.content = {
                    uri: 'i3s:mesh:' + (nodeJSON.id || nodeJSON.index),
                };
            }
        }

        if (childrenDefinition && childrenDefinition.length) {
            inPlaceTileDefinition.children = childrenDefinition;
        }

        return inPlaceTileDefinition;
    }

    getJSON() {
        return this._nodeJSON;
    }
}



function _WGS84ToCartesian(out, long, lat, height) {
    return radianToCartesian3(out, toRadian(long), toRadian(lat), height);
}

function fromCenterHalfSizeQuaternion(center ,halfSize, quaternion) {
    const directionsMatrix = mat3.fromQuat([], quaternion);
    directionsMatrix[0] = directionsMatrix[0] * halfSize[0];
    directionsMatrix[1] = directionsMatrix[1] * halfSize[0];
    directionsMatrix[2] = directionsMatrix[2] * halfSize[0];
    directionsMatrix[3] = directionsMatrix[3] * halfSize[1];
    directionsMatrix[4] = directionsMatrix[4] * halfSize[1];
    directionsMatrix[5] = directionsMatrix[5] * halfSize[1];
    directionsMatrix[6] = directionsMatrix[6] * halfSize[2];
    directionsMatrix[7] = directionsMatrix[7] * halfSize[2];
    directionsMatrix[8] = directionsMatrix[8] * halfSize[2];
    return [
        ...center,
        ...directionsMatrix
    ];
}
