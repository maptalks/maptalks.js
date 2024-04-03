// shpere: http://localhost/3dtiles/debug/guangdong.html
// box: http://localhost/3dtiles/debug/xx.html
// region:

import * as maptalks from 'maptalks';
import { quat, vec2, vec3, mat3, mat4, MaskLayerMixin } from '@maptalks/gl';
import { intersectsSphere, intersectsOrientedBox } from 'frustum-intersects';
import { isFunction, extend, isNil, toRadian, toDegree, getAbsoluteURL, isBase64, pushIn } from '../common/Util';
import { isRelativeURL } from '../common/UrlUtil';
import { DEFAULT_MAXIMUMSCREENSPACEERROR } from '../common/Constants';
import Geo3DTilesRenderer from './renderer/Geo3DTilesRenderer';
import { radianToCartesian3, cartesian3ToDegree } from '../common/Transform';
import { distanceToCamera } from '../common/intersects_oriented_box.js';
import TileBoundingRegion from './renderer/TileBoundingRegion';

const options = {
    // 'maximumScreenSpaceError' : 8,
    'maxGPUMemory' : maptalks.Browser.mobile ? 32 : 1536,
    'retireInterval' : 2000,
    'loadingLimitOnInteracting' : 5,
    'loadingLimit' : 10,
    'renderer' : 'gl',
    'forceRenderOnZooming' : true,
    'forceRenderOnRotating' : true,
    'forceRenderOnMoving' : true,
    'debug' : false,
    'meshLimitPerFrame': 1,
    'i3sNodepageLimitPerFrame': 1,
    'enableI3SCompressedGeometry': true,
    'forceI3SCompressedGeometry': true,
    'picking': true,
    'pickingPoint': true,
    'geometryEvents': false,
    'alwaysShowTopTiles': true,
    // 'ambientLight' : [0, 0, 0],
    // 'heightOffsets' : null,
    // 'polygonOffsets' : null,
    'antialias': false,
    'optionalExtensions' : [
        'ANGLE_instanced_arrays',
        'OES_element_index_uint',
        'OES_standard_derivatives',
        'OES_vertex_array_object',
        'OES_texture_half_float', 'OES_texture_half_float_linear',
        'OES_texture_float', 'OES_texture_float_linear',
        'WEBGL_depth_texture', 'EXT_shader_texture_lod',
        'WEBGL_compressed_texture_astc',
        'WEBGL_compressed_texture_etc',
        'WEBGL_compressed_texture_etc1',
        'WEBGL_compressed_texture_pvrtc',
        'WEBGL_compressed_texture_s3tc',
        'WEBGL_compressed_texture_s3tc_srgb'
    ],
    'offset': [0, 0]
};

const TEMP_VEC3_0 = [];
const TEMP_VEC3_1 = [];
const TEMP_VEC3_2 = [];
const TEMP_VEC3_3 = [];
const TEMP_VEC3_4 = [];
const TEMP_VEC3_5 = [];
const TEMP_VEC3_6 = [];
const TEMP_SCALE = [];

const TEMP_QUAT_0 = [];

const EMPTY_ARRAY = [];
const TEMP_COORD = new maptalks.Coordinate(0, 0);
const TEMP_POINT = new maptalks.Point(0, 0);

const TEMP_MAT3_0 = [];
const TEMP_MAT4_0 = [];
const TEMP_MAT4_1 = [];
const TEMP_MAT4_2 = [];

const CAMERA_COORD = new maptalks.Coordinate(0, 0);
const IDENTITY_MATRIX = mat4.identity([]);
const EMPTY_COORD_OFFSET = [0, 0];

const DEFAULT_ROTATION = [0, 0, 0];
const DEFAULT_SCALE = [1, 1, 1];
const TEMP_SERVICE_SCALE = [0, 0, 0];
const DEFAULT_TRANSLATION = [0, 0, 0];

// BOX template
//    v2----- v1
//   / |     /|
//  v3------v0|
//  |  |v6  | /v5
//  | /     |/
//  v7------v4
const BOX_POS = [
    1.0, 1.0, 1.0,
    1.0, -1.0, 1.0,
    -1.0, -1.0, 1.0,
    -1.0, 1.0, 1.0,
    1.0, 1.0, -1.0,
    1.0, -1.0, -1.0,
    -1.0, -1.0, -1.0,
    -1.0, 1.0, -1.0
];

// const TEMP_TRANSFORMED_VERTICES = [];
// const TEMP_TRANSFORMED_CENTER = [];
/**
 * A layer to stream AnalyticalGraphicsInc's 3d-tiles geospatial data
 * 3d-tiles 规范：https://github.com/AnalyticalGraphicsInc/3d-tiles/
 */
export default class Geo3DTilesLayer extends MaskLayerMixin(maptalks.Layer) {
    /**
     * Reproduce a Geo3DTilesLayer from layer's profile JSON.
     * @param  {Object} layerJSON - layer's profile JSON
     * @return {Geo3DTilesLayer}
     * @static
     * @private
     * @function
     */
    static fromJSON(layerJSON) {
        if (!layerJSON || layerJSON['type'] !== 'Geo3DTilesLayer') {
            return null;
        }
        return new Geo3DTilesLayer(layerJSON['id'], layerJSON['options']);
    }

    constructor(id, options) {
        super(id, options);
        this._initRoots();
        //tileset.json requests
        this._requests = {};
        this._nodeBoxes = [];
    }

    _initRoots() {
        const urls = this.options.services.map(service => service.url);
        this._rootMap = this._rootMap || {};
        this._roots = this._roots || [];
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            let index = this._rootMap[url];
            if (index === undefined) {
                index = this._rootMap[url] = this._roots.length;
            }
            this._roots[index] = createRootTile(url, index, this.options.services[i]);
        }
        this.fire('rootready', { roots : this._roots.slice(0) });
    }

    showService(idx) {
        this.updateService(idx, { visible: 1 });
        return this;
    }

    hideService(idx) {
        this.updateService(idx, { visible: 0 });
        return this;
    }

    setToRedraw() {
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
    }

    addService(info) {
        this.options.services = this.options.services || [];
        this.options.services.push(info);
        this._initRoots();
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
        return this;
    }

    updateService(idx, info) {
        if (!info) {
            return this;
        }
        const services = this.options.services;
        let extentChanged = false;
        if (services && services[idx]) {
            extentChanged = !equals(services[idx].coordOffset, info.coordOffset) ||
                !equals(services[idx].heightOffset, info.heightOffset) ||
                !equals(services[idx].scale, info.scale) ||
                !equals(services[idx].rotation, info.rotation);
            extend(services[idx], info)
        }
        const url = services[idx].url;
        const rootIdx = this._rootMap[url];
        if (this._roots && this._roots[rootIdx]) {
            if (!isNil(info.visible)) {
                this._roots[rootIdx].visible = info.visible;
            }
            if (extentChanged) {
                this._roots[rootIdx].version++;
            }
        }
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
        return this;
    }

    removeService(idx) {
        const services = this.options.services;
        if (services && services[idx]) {
            const url = services[idx].url;
            const rootIdx = this._rootMap[url];
            if (this._roots[rootIdx]) {
                this._roots[rootIdx] = null;
            }
            delete this._rootMap[url];
            services.splice(idx, 1);
        }

        const renderer = this.getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
        return this;
    }

    getTileUrl(url, baseUrl, rootNode) {
        const subdomains = rootNode && rootNode.service && rootNode.service.subdomains;
        if (subdomains && rootNode.domainKey) {
            const len = subdomains.length;
            if (len) {
                const urlArr = [...url];
                const index = urlArr.reduce((a, char) => a + char.charCodeAt(), 0);
                const domain = index % len;
                // {s} is encoded in getAbsoluteUrl
                return url.replace(rootNode.domainKey, subdomains[domain]);
            }
        }
        return url;
    }

    getExtent(index) {
        if (!index && index !== 0) {
            const extent = new maptalks.Extent();
            for (let i = 0; i < this._roots.length; i++) {
                if (this._roots[i].boundingVolume) {
                    const nodeExtent = this.boundingVolumeToExtent(this._roots[i]);
                    extent['_combine'](nodeExtent);
                }
            }
            return extent;
        }
        if (!this._roots[index] || !this._roots[index].boundingVolume) {
            return null;
        }
        return this.boundingVolumeToExtent(this._roots[index]);
    }

    boundingVolumeToExtent(node) {
        const matrix = node.boundingVolume._centerTransformed ? IDENTITY_MATRIX : node.matrix;
        const map = this.getMap();
        const isIdentity = map.getProjection().code.toLowerCase() === 'identity';
        const renderer = this.getRenderer();
        if (node.boundingVolume.region) {
            const region = node.boundingVolume.region;
            return new maptalks.Extent(toDegree(region[0]), toDegree(region[1]), toDegree(region[2]), toDegree(region[3]));
        } else if (node.boundingVolume.sphere) {
            const sphere = node.boundingVolume.sphere;
            // let nodeCenter = sphere.slice(0, 3);
            const nodeCenter = vec3.transformMat4([], sphere, matrix);
            const center = cartesian3ToDegree([], nodeCenter);
            if (isIdentity) {
                renderer._lngLatToIdentityCoord(center, center);
            }
            const radius = sphere[3];
            const nw = map.locate(center, -radius, radius);
            const se = map.locate(center, radius, -radius);
            return new maptalks.Extent(nw, se);
        } else if (node.boundingVolume.box) {
            const nodeBox = node.boundingVolume.box;
            // let nodeCenter = nodeBox.slice(0, 3);
            const nodeCenter = vec3.transformMat4([], nodeBox, matrix);
            const center = new maptalks.Coordinate(cartesian3ToDegree([], nodeCenter));
            if (isIdentity) {
                renderer._lngLatToIdentityCoord(center, center);
            }
            const halfAxes = nodeBox.slice(3);
            mat3.multiply(halfAxes, mat3.fromMat4([], node.matrix), halfAxes);
            const rx = vec3.length(halfAxes.slice(0, 3));
            const ry = vec3.length(halfAxes.slice(3, 6));
            const rz = vec3.length(halfAxes.slice(6, 9));
            const radius = Math.max(rx, ry, rz);
            const nw = map.locate(center, -radius, radius);
            const se = map.locate(center, radius, -radius);
            return new maptalks.Extent(nw, se);
        }
        return null;
    }

    getRootTiles() {
        return this._roots;
    }

    getTiles() {
        const renderer = this.getRenderer();
        if (!renderer.ready) {
            this._setToRedraw();
            return  { tiles: EMPTY_ARRAY };
        }
        const map = this.getMap();
        const cameraPosition = map.cameraPosition;
        const distance = map.pointAtResToDistance(cameraPosition[2], 0, map.getGLRes());
        const cameraCoord = this._getCameraLonLat(cameraPosition);
        this._cameraLocation = this._cameraLocation || [];
        vec3.set(this._cameraLocation, toRadian(cameraCoord.x), toRadian(cameraCoord.y), distance);
        this._cameraCartesian3 = radianToCartesian3(this._cameraCartesian3 || [], this._cameraLocation[0], this._cameraLocation[1], this._cameraLocation[2]);
        this._fovDenominator = 2 * Math.tan(0.5 * toRadian(map.getFov()));
        // this._cameraProj = projection.project(cameraCoord).toArray();

        const projectionView = map.projViewMatrix;

        const root = {
            children : [],
            level : -1
        };
        let currentParent = root;
        const tiles = [];
        for (let i = 0; i < this._roots.length; i++) {
            const root = this._roots[i];
            if (!root || !root.visible) {
                continue;
            }
            // let firstContentLevel = Infinity;
            const queue = [root];
            const maxExtent = this._getRootMaxExtent(i);
            while (queue.length > 0) {
                const node = queue.pop();
                if (!node.id) {
                    this._initNode(node);
                }
                while (currentParent.level >= node._level) {
                    //pop parent
                    currentParent = currentParent.parent;
                }
                // if (this.options.debugTile && node.id === this.options.debugTile) {
                //     debugger
                // }
                const visible = this._isVisible(node, maxExtent, projectionView);
                // // find ancestors
                // if (node.id === 117) {
                //     let ancestors = [];
                //     let nodeParent = node.parent;
                //     while (nodeParent) {
                //         ancestors.push(nodeParent.id);
                //         nodeParent = nodeParent.parent;
                //     }
                //     console.log(ancestors.join());
                // }
                if (visible < 1 && (visible < 0 || !this.options['alwaysShowTopTiles'] || !isTopTile(node))) {
                    let parent = currentParent;
                    while (parent && !parent.content) {
                        parent = parent.parent;
                    }
                    if (visible === 0 && parent && parent.content) {
                        // node._contentParent = parent;
                        this._addCandidateNode(tiles, parent);
                        // tiles[parent.node.id] = parent;
                    }
                    continue;
                    // if (config['alwaysShow'] !== false) {
                    //     //当tile在frustum中，level处于第一个有content的层级，则永远绘制它
                    //     if (visible === 0 && node._level <= firstContentLevel) {
                    //         if (node.content) {
                    //             firstContentLevel = node._level;
                    //         }
                    //     } else {
                    //         continue;
                    //     }
                    // } else {

                    // }
                    // continue;
                }

                // if (node.content && node._level <= firstContentLevel) {
                //     firstContentLevel = node._level;
                // }

                if (node._cameraDistance < Infinity) {
                    this._updateParentDistance(node);
                }

                const candidate = this._createCandidate(node, currentParent);
                currentParent.children.push(candidate);

                //node is visible
                //根据规范，node不能同时是tileset或有children

                //检查tile的children
                const children = node.children;
                const hasChildren = children && children.length;
                const hasContent = candidate.content;

                // if (hasContent) tiles[candidate.node.id] = candidate;
                if (!hasChildren && hasContent) {
                    // candidate.selected = true;
                    // tiles[candidate.node.id] = candidate;
                    this._addCandidateNode(tiles, candidate);
                }
                if (hasChildren) {
                    if (hasContent && node.refine === 'add') {
                        // candidate.selected = true;
                        // tiles[candidate.node.id] = candidate;
                        this._addCandidateNode(tiles, candidate);
                    }
                    currentParent = candidate;
                    const inited = children[0].parent;
                    let hasValidChild = false;
                    for (let i = 0, l = children.length; i < l; i++) {
                        if (!inited) {
                            hasValidChild = true;
                            children[i].parent = node;
                            children[i]._upAxis = node._upAxis;
                            children[i].baseUrl = node.baseUrl;
                            const url = children[i].content && (children[i].content.url || children[i].content.uri);
                            if (url) {
                                if (isBase64(url) || url.indexOf('i3s:') >= 0) {
                                    children[i].baseUrl = node.baseUrl;
                                } else if (isRelativeURL(url)) {
                                    children[i].content.url = node.baseUrl + url;
                                } else {
                                    children[i].baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
                                }
                            }
                        } else {
                            const cached = renderer.getCachedTile(children[i].id);
                            if (cached && (cached.error && cached.error.status !== 404)) {
                                continue;
                            } else {
                                hasValidChild = true;
                            }
                        }
                        queue.push(children[i]);
                    }
                    // 如果所有子节点都发生了错误，则把当前节点加入到绘制。
                    if (!hasValidChild && hasContent) {
                        this._addCandidateNode(tiles, candidate);
                    }

                }

            }
        }
        return { root, tiles };
    }

    _addCandidateNode(tiles, candidate) {
        const { viewerRequestVolume } = candidate.node;
        if (!viewerRequestVolume || inViewerRequestVolume(this._cameraLocation, this._cameraCartesian3, viewerRequestVolume)) {
            tiles.push(candidate);
        }
    }

    _createCandidate(node, parent) {
        return {
            id : node.id, // for debug
            node,
            children : [],
            level : node._level,
            // cameraDistance : node._cameraDistance, // for debug
            parent : parent,
            content : node.content && node.content.url
        };
    }

    _initNode(node) {
        const layerId = this.getId();
        node.id = layerId + ':' + maptalks.Util.GUID();
        node.matrix = node.transform || mat4.identity([]);
        node._empty = this._isEmpty(node);
        if (node.parent) {
            if (!isI3SNode(node)) {
                node.matrix = mat4.multiply(node.matrix, node.parent.matrix, node.matrix);
            }
            node._rootIdx = node.parent._rootIdx;
            if (node._level === undefined) {
                node._level = node.parent._level + 1;
            }
            node.maxExtent = node.parent.maxExtent;
        }
        node.refine = node.refine && node.refine.toLowerCase() || 'replace';
        if (node.content && !node.content.url && node.content.uri) {
            node.content.url = node.content.uri;
        }
    }

    _getNodeService(rootIdx) {
        return this._roots[rootIdx].service;
    }

    // // boundingVolume上应用heightOffset，解决设置heightOffset后，visible计算不正确的问题
    _offsetBoundingVolume(node) {
        const boundingVolume = node.boundingVolume;
        if (!boundingVolume || boundingVolume._centerTransformed && !this._offsetChanged(node)) {
            return;
        }
        const service = this._getNodeService(node._rootIdx);
        const heightOffset = service.heightOffset || 0;

        // if (node.boundingVolume && node.boundingVolume.box) {
        //     node.boundingVolume.sphere = toSphere(node.boundingVolume.box);
        //     delete node.boundingVolume.box;
        // }
        const offset = this.options['offset'];
        const hasOffset = isFunction(offset) || offset[0] || offset[1];
        const coordOffset = service.coordOffset || EMPTY_COORD_OFFSET;
        if (!Array.isArray(coordOffset)) {
            throw new Error('service.coordOffset must be an array');
        }
        if (!boundingVolume._centerTransformed && (!node.boundingVolume || (!heightOffset && mat4.exactEquals(node.matrix, IDENTITY_MATRIX) && !hasOffset && coordOffset === EMPTY_COORD_OFFSET))) {
            return;
        }
        if (boundingVolume.box && boundingVolume.region) {
            // maptalks/issues#380
            // region和box同时存在时，说明region是从box转换过来的，需要先删除，更新box再重新创建新的region。
            delete boundingVolume.region;
        }
        const { region, box, sphere } = boundingVolume;
        boundingVolume.coordOffset = [coordOffset[0], coordOffset[1]];
        boundingVolume.heightOffset = heightOffset;
        if (region) {
            if (!boundingVolume.originalVolume) {
                boundingVolume.originalVolume = region.slice(0);
            }
            const volume = boundingVolume.originalVolume;
            const westSouth = this._offsetCenter([toDegree(volume[0]), toDegree(volume[1])]);
            region[0] = toRadian(westSouth.x + coordOffset[0]);
            region[1] = toRadian(westSouth.y + coordOffset[1]);
            const eastNorth = this._offsetCenter([toDegree(volume[2]), toDegree(volume[3])]);
            region[2] = toRadian(eastNorth.x + coordOffset[0]);
            region[3] = toRadian(eastNorth.y + coordOffset[1]);
            region[4] = volume[4] + heightOffset + (coordOffset[2] || 0);
            region[5] = volume[5] + heightOffset + (coordOffset[2] || 0);
        } else if (box || sphere) {
            if (!boundingVolume.originalVolume) {
                boundingVolume.originalVolume = (box || sphere).slice(0);
            }
            const volume = box || sphere;
            const originalVolume = boundingVolume.originalVolume;
            const cart3 = vec3.transformMat4(TEMP_VEC3_0, originalVolume, node.matrix);
            const center = cartesian3ToDegree(TEMP_VEC3_1, cart3);
            const offsetCenter = this._offsetCenter([center[0] + coordOffset[0], center[1] + coordOffset[1]]);
            center[0] = offsetCenter.x;
            center[1] = offsetCenter.y;
            center[2] += heightOffset + (coordOffset[2] || 0);
            radianToCartesian3(volume, toRadian(center[0]), toRadian(center[1]), center[2]);
        }
        boundingVolume._centerTransformed =  true;
    }

    _offsetChanged(node) {
        const boundingVolume = node.boundingVolume;
        const service = this._getNodeService(node._rootIdx);
        const heightOffset = service.heightOffset || 0;
        const coordOffset = service.coordOffset || EMPTY_COORD_OFFSET;
        return boundingVolume.coordOffset[0] !== coordOffset[0] || boundingVolume.coordOffset[1] !== coordOffset[1] || boundingVolume.heightOffset !== heightOffset;
    }

    _isEmpty(node) {
        return node.geometricError === undefined || !node.boundingVolume;/*  &&
        node.children && node.children.length > 0 */
    }

    _updateParentDistance(node) {
        let parent = node.parent;
        while (parent && parent._empty) {
            if (parent._cameraDistance <= node._cameraDistance) {
                break;
            }
            parent._cameraDistance = node._cameraDistance;
            parent = node.parent;
        }
    }

    onTileLoad(tile, node) {
        if (tile.children && (!node.children || !node.children.length)) {
            node.children = tile.children;
            const url = node.content.url;
            node.baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
            const renderer = this.getRenderer();
            if (renderer) {
                renderer.setToRedraw();
            }
        }
    }

    onTilesetLoad(tileset, parent, url) {
        if (!tileset) {
            console.warn('invalid tileset at : ' + url);
            return;
        }
        const service = this._getNodeService(parent._rootIdx);
        const axisUp = (tileset.asset && tileset.asset.gltfUpAxis || parent && parent._upAxis || service.upAxis || 'Y').toUpperCase();
        tileset.root.baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
        const isRealspace = url.indexOf("realspace/") > -1;
        if (parent._level === 0 && (tileset.asset && tileset.asset.s3mType && isRealspace || service.isSuperMapiServer)) {
            tileset.root.baseUrl += 'data/path/';
        }
        const isI3S = tileset.asset.i3s;
        const isS3M = !!tileset.asset.s3mType;
        tileset.root._upAxis = axisUp;
        if (parent) {
            // delete parent._contentNode;
            // parent.tileset = tileset;
            // tileset.root.parent = parent;
            const rootIdx = parent._rootIdx;
            const rootNode = this._roots[rootIdx];
            if (isS3M && !rootNode.isS3M) {
                rootNode.isS3M = isS3M;
            }
            const boundingVolume = parent.boundingVolume;
            extend(parent, tileset.root);
            parent.refine = parent.refine && parent.refine.toLowerCase() || 'replace';
            if (boundingVolume) {
                parent.boundingVolume = boundingVolume;
            }
            const transform = tileset.root.transform;
            if (transform) {
                if (!parent.parent) {
                    parent.matrix = transform;
                } else if (!isI3S) {
                    parent.matrix = mat4.multiply([], parent.parent.matrix, transform);
                }
            }
            // parent.matrix = tileset.root.transform || parent.matrix;
            // delete parent._topBottom;
            // delete this._nodeBoxes[parent.id];

            parent._content = parent.content;
            delete parent.content;
            if (tileset.root.content) {
                parent.content = tileset.root.content;
            }

            parent._empty = this._isEmpty(parent);
            const url = parent.content && (parent.content.url || parent.content.uri);
            if (url && parent.content.uri) {
                parent.content.url = parent.content.uri;
                delete parent.content.uri;
            }
            if (!isI3S && url && !isBase64(url) && isRelativeURL(url)) {
                parent.content.url = parent.baseUrl + url;
            }
            if (tileset.root && !parent.parent) {
                this._updateRootCenter(parent);
            }
        }
        this._setToRedraw();
        this.fire('loadtileset', { tileset, index: parent && parent._rootIdx, url });
    }

    _isVisible(node, maxExtent, projectionView) {
        node._cameraDistance = Infinity;
        if (node._level === 0 || node._empty) {
            this._updateRootCenter(node);
            return 1;
        }
        this._offsetBoundingVolume(node);
        //reset node status
        // node._error = Infinity;
        if (!this._isTileInFrustum(node, maxExtent, projectionView)) {
            // if (node.id !== 135) {
            //     return -1;
            // }
            return -1;
        }
        if (node.geometricError === 0) {
            return 1;
        }
        let maximumScreenSpaceError = this._getNodeService(node._rootIdx)['maximumScreenSpaceError'];
        if (maximumScreenSpaceError === undefined || maximumScreenSpaceError === null) {
            maximumScreenSpaceError = DEFAULT_MAXIMUMSCREENSPACEERROR;
        }
        let error = this._getScreenSpaceError(node);
        if (error === 0.0 && node.parent) {
            error = (node.parent._error || 0) * 0.5;
        }
        return error >= maximumScreenSpaceError ? 1 : 0;
    }

    _coordToPoint(coord, out) {
        if (!out) {
            out = new maptalks.Point(0, 0);
        }
        const map = this.getMap();
        if (map.getGLZoom) {
            return map.coordToPoint(coord, map.getGLZoom(), out);
        } else {
            return map.coordToPointAtRes(coord, map.getGLRes(), out);
        }
    }

    _isTileInFrustum(node, maxExtent, projectionView) {
        const id = node.id;
        let nodeBox = this._nodeBoxes[id];
        const { boundingVolume } = node;
        const region = boundingVolume.region;
        const box = boundingVolume.box;
        const sphere = boundingVolume.sphere;
        const rootNode = this._getRootNode(node._rootIdx);
        if (!nodeBox || nodeBox.version !== rootNode.version) {
            if (region) {
                nodeBox = this._nodeBoxes[id] = this._createRegionBox(node);
            } else if (box) {
                nodeBox = this._nodeBoxes[id] = this._createBBox(node);
            } else if (sphere) {
                //[xcenter, ycenter, radius]
                nodeBox = this._nodeBoxes[id] = this._createSphere(node);
                const nodeCenter = sphere;
                const center = cartesian3ToDegree(TEMP_VEC3_0, nodeCenter);
                const coord = new maptalks.Coordinate(center);
                nodeBox.center = coord;
            }
            nodeBox.version = rootNode.version;
            if (node._boxMesh) {
                this.getRenderer()._deleteBoxMesh(node._boxMesh);
                delete node._boxMesh;
            }
        }

        const service = this._getNodeService(node._rootIdx);
        if (service['debug']) {
            this._nodeBoxes[id].node = node;
            this.getRenderer()._createBoxMesh(node);
        }

        // if (maxExtent) {
        //     //比较简单的extent比较，
        //     if (region) {
        //         TEMP_EXTENT.xmin = nodeBox[0][0];
        //         TEMP_EXTENT.ymin = nodeBox[0][1];
        //         TEMP_EXTENT.xmax = nodeBox[1][0];
        //         TEMP_EXTENT.ymax = nodeBox[1][1];
        //     } else if (sphere) {
        //         const radius = nodeBox[2];
        //         TEMP_EXTENT.xmin = nodeBox[0][0] - radius;
        //         TEMP_EXTENT.ymin = nodeBox[0][1] - radius;
        //         TEMP_EXTENT.xmax = nodeBox[0][0] + radius;
        //         TEMP_EXTENT.ymax = nodeBox[0][1] + radius;
        //     } else if (box) {
        //         const hx = nodeBox[1];
        //         const hy = nodeBox[2];
        //         TEMP_EXTENT.xmin = nodeBox[0][0] - hx;
        //         TEMP_EXTENT.ymin = nodeBox[0][1] - hy;
        //         TEMP_EXTENT.xmax = nodeBox[0][0] + hx;
        //         TEMP_EXTENT.ymax = nodeBox[0][1] + hy;
        //     }
        //     if (!maxExtent.intersects(TEMP_EXTENT)) {
        //         return false;
        //     }
        // }

        if (nodeBox.obbox) {
            return intersectsOrientedBox(projectionView, nodeBox.obbox);
        } else if (sphere) {
            return intersectsSphere(projectionView, nodeBox);
        }
        return false;
    }

    _createRegionBox(node) {
        const map = this.getMap();
        const glRes = map.getGLRes();
        const region = node.boundingVolume.region;
        let { ws, en } = convertRegionToBox(region);
        ws = new maptalks.Coordinate(ws);
        en = new maptalks.Coordinate(en);
        const pointWS = map.coordToPointAtRes(ws, glRes);
        pointWS.z = map.altitudeToPoint(ws.z, glRes);
        const pointEN = map.coordToPointAtRes(en, glRes);
        pointEN.z = map.altitudeToPoint(en.z, glRes);
        const boxPosition = [
            pointEN.x, pointWS.y, pointEN.z,
            pointEN.x, pointEN.y, pointEN.z,
            pointWS.x, pointEN.y, pointEN.z,
            pointWS.x, pointWS.y, pointEN.z,
            pointEN.x, pointWS.y, pointWS.z,
            pointEN.x, pointEN.y, pointWS.z,
            pointWS.x, pointEN.y, pointWS.z,
            pointWS.x, pointWS.y, pointWS.z,
        ];
        const boxCenter = [(boxPosition[0] + boxPosition[18]) / 2, (boxPosition[1] + boxPosition[19]) / 2, (boxPosition[2] + boxPosition[20]) / 2];
        const rootNode = this._getRootNode(node._rootIdx);
        if (node === rootNode && !rootNode._bboxCenter) {
            rootNode._bboxCenter = boxCenter;
        }

        const serviceTransform = this._getServiceTransform([], node);
        const isIdentityMatrix = mat4.exactEquals(IDENTITY_MATRIX, serviceTransform);

        if (!isIdentityMatrix) {
            vec3.transformMat4(boxCenter, boxCenter, serviceTransform);
            const pos = TEMP_VEC3_0;
            for (let i = 0; i < boxPosition.length; i += 3) {
                let point = vec3.set(pos, boxPosition[i], boxPosition[i + 1], boxPosition[i + 2]);
                if (!isIdentityMatrix) {
                    point = vec3.transformMat4(point, point, serviceTransform);
                }
                boxPosition[i] = point[0];
                boxPosition[i + 1] = point[1];
                boxPosition[i + 2] = point[2];
            }
        }

        const center = map.pointAtResToCoord(new maptalks.Point(boxCenter), glRes);
        center.z = (ws.z + en.z) / 2;

        const obbox = this._generateOBBox(boxPosition, boxCenter);
        for (let i = 0; i < boxPosition.length; i++) {
            boxPosition[i] -= boxCenter[i % 3];
        }

        return { obbox, boxPosition, boxCenter, center };
    }

    _createBBox(node) {
        const renderer = this.getRenderer();
        const map = this.getMap();
        const isIdentity = map.getProjection().code.toLowerCase() === 'identity';
        const glRes = map.getGLRes();
        const { boxCenter, boxCoord } = this._calBoxCenter(node);
        const box = node.boundingVolume.box;
        const halfAxes = this._createHalfAxes(box, node.matrix);
        const modelMatrix = fromRotationTranslation([], halfAxes, box);
        const serviceTransform = this._getServiceTransform([], node);
        const isIdentityMatrix = mat4.exactEquals(IDENTITY_MATRIX, serviceTransform);

        if (!isIdentityMatrix) {
            vec3.transformMat4(boxCenter, boxCenter, serviceTransform);
        }

        const boxPosition = [];
        const pos = TEMP_VEC3_0;
        for (let i = 0; i < BOX_POS.length; i += 3) {
            pos[0] = BOX_POS[i];
            pos[1] = BOX_POS[i + 1];
            pos[2] = BOX_POS[i + 2];

            vec3.transformMat4(pos, pos, modelMatrix);
            cartesian3ToDegree(pos, pos)
            if (isIdentity) {
                renderer._lngLatToIdentityCoord(pos, pos);
            }
            const coord = TEMP_COORD.set(...pos);
            let point = map.coordToPointAtRes(coord, glRes, TEMP_POINT);
            point = vec3.set(pos, point.x, point.y, map.altitudeToPoint(coord.z, glRes));
            if (!isIdentityMatrix) {
                point = vec3.transformMat4(point, point, serviceTransform);
            }
            boxPosition[i] = point[0];
            boxPosition[i + 1] = point[1];
            boxPosition[i + 2] = point[2];
        }

        const obbox = this._generateOBBox(boxPosition, boxCenter);
        for (let i = 0; i < boxPosition.length; i++) {
            boxPosition[i] -= boxCenter[i % 3];
        }
        return { obbox, boxPosition, boxCenter, center: boxCoord };
    }

    _createSphere(node) {
        const map = this.getMap();
        const renderer = this.getRenderer();
        const isIdentity = map.getProjection().code.toLowerCase() === 'identity';
        const sphere = node.boundingVolume.sphere
        const nodeCenter = sphere;
        let center = TEMP_VEC3_0;
        if (nodeCenter[0] === 0 && nodeCenter[1] === 0 && nodeCenter[2] === 0) {
            center = [0, 0, -6378137];
        } else {
            cartesian3ToDegree(center, nodeCenter);
        }
        if (isIdentity) {
            renderer._lngLatToIdentityCoord(center, center);
        }
        const coord = new maptalks.Coordinate(center);
        const sphereCenter = this._coordToPoint(coord, TEMP_POINT).toArray();
        sphereCenter[2] = map.altitudeToPoint(coord.z, map.getGLRes());
        const scale = this._getBoxScale(coord);
        return [sphereCenter, sphere[3] * scale[2]];
    }

    _generateOBBox(boxPosition, obbCenter) {
        // let transformedVertices;
        // let transformedCenter;

        // if (mat4.exactEquals(IDENTITY_MATRIX, serviceTransform)) {
        //     transformedVertices = boxPosition;
        //     transformedCenter = obbCenter;
        // } else {
        //     const length = boxPosition.length;
        //     transformedVertices = TEMP_TRANSFORMED_VERTICES;
        //     for (let i = 0; i < length; i += 3) {
        //         vec3.set(TEMP_VEC3_4, boxPosition[i], boxPosition[i + 1], boxPosition[i + 2]);
        //         const transformed = vec3.transformMat4(TEMP_VEC3_4, TEMP_VEC3_4, serviceTransform);
        //         transformedVertices[i] = transformed[0];
        //         transformedVertices[i + 1] = transformed[1];
        //         transformedVertices[i + 2] = transformed[2];
        //     }
        //     transformedCenter = vec3.transformMat4(TEMP_TRANSFORMED_CENTER, obbCenter, serviceTransform);
        // }
        // BOX template
        //    v2----- v1
        //   / |     /|
        //  v3------v0|
        //  |  |v6  | /v5
        //  | /     |/
        //  v7------v4

        const xPlaneCenter = getBoxPlaneCenter(TEMP_VEC3_4, boxPosition, 0, 1, 4, 5);
        const yPlaneCenter = getBoxPlaneCenter(TEMP_VEC3_5, boxPosition, 0, 3, 4, 7);
        const zPlaneCenter = getBoxPlaneCenter(TEMP_VEC3_6, boxPosition, 0, 1, 2, 3);

        // boxPosition.push(...xPlaneCenter);
        // boxPosition.push(...yPlaneCenter);
        // boxPosition.push(...zPlaneCenter);

        return [
            ...obbCenter,
            ...vec3.sub(TEMP_VEC3_0, xPlaneCenter, obbCenter),
            ...vec3.sub(TEMP_VEC3_1, yPlaneCenter, obbCenter),
            ...vec3.sub(TEMP_VEC3_2, zPlaneCenter, obbCenter)
        ];
    }

    _calBoxCenter(node) {
        const map = this.getMap();
        const renderer = this.getRenderer();
        const isIdentity = map.getProjection().code.toLowerCase() === 'identity';
        const glRes = map.getGLRes();
        const nodeBox = node.boundingVolume.box;
        const center = nodeBox.slice(0, 3);
        const box_center = center;
        cartesian3ToDegree(box_center, box_center)
        if (isIdentity) {
            renderer._lngLatToIdentityCoord(box_center, box_center);
        }
        const box_center_coord = new maptalks.Coordinate(box_center);
        const point_center = map.coordToPointAtRes(box_center_coord, glRes);
        const boxCenter = [point_center.x, point_center.y, map.altitudeToPoint(box_center_coord.z, glRes)];
        return { boxCenter, boxCoord: box_center_coord };
    }

    _getServiceTransform(out, node) {
        const rootNode = this._getRootNode(node._rootIdx);
        const service = this._getNodeService(node._rootIdx);
        const rootCenter = rootNode._bboxCenter;
        const originMat4 = mat4.fromTranslation(TEMP_MAT4_0, vec3.set(TEMP_VEC3_0, -rootCenter[0], -rootCenter[1], -rootCenter[2]));
        const originMat4Reverse = mat4.fromTranslation(TEMP_MAT4_1, rootCenter);

        const rotation = service.rotation || DEFAULT_ROTATION;
        const q = quat.fromEuler(TEMP_QUAT_0, ...rotation);
        const serviceScale = service.scale;
        const scale = serviceScale && vec3.set(TEMP_SERVICE_SCALE, serviceScale, serviceScale, serviceScale) || DEFAULT_SCALE;
        const transform = mat4.fromRotationTranslationScale(TEMP_MAT4_2, q, DEFAULT_TRANSLATION, scale);

        out = mat4.multiply(out, transform, originMat4);
        return mat4.multiply(out, originMat4Reverse, out);
    }

    _updateRootCenter(rootNode) {
        const service = this._getNodeService(rootNode._rootIdx);
        if (!rootNode.boundingVolume || this._equalsOffsets(rootNode, service)) {
            return;
        }
        const box = rootNode.boundingVolume.box;
        const region = rootNode.boundingVolume.region;
        const sphere = rootNode.boundingVolume.sphere;

        let pointCenter = null;
        if (box) {
            const center = this._updateRootBBoxCenter(rootNode);
            pointCenter = center.boxCenter;
        } else if (region) {
            const center = this._updateRootRegionCenter(rootNode);
            pointCenter = center.boxCenter;
        } else if (sphere) {
            pointCenter = this._createSphere(rootNode)[0];
        }
        const heightOffset = service.heightOffset || 0;
        const coordOffset = service.coordOffset || [0, 0];
        rootNode._originCoordOffset = [coordOffset[0] || 0, coordOffset[1] || 0];
        rootNode._originHeightOffset = heightOffset;
        rootNode._bboxCenter = pointCenter;
    }

    _equalsOffsets(rootNode, service) {
        if (!rootNode._originCoordOffset) {
            return false;
        }
        const coordOffset = service.coordOffset || EMPTY_COORD_OFFSET;
        return rootNode._originCoordOffset[0] === coordOffset[0] && rootNode._originCoordOffset[1] === coordOffset[1] && rootNode._originHeightOffset === (service.heightOffset || 0);
    }

    _updateRootRegionCenter(rootNode) {
        if (!rootNode.boundingVolume) {
            return null;
        }
        this._offsetBoundingVolume(rootNode);
        return this._createRegionBox(rootNode);
    }

    _updateRootBBoxCenter(rootNode) {
        if (!rootNode.boundingVolume) {
            return null;
        }
        this._offsetBoundingVolume(rootNode);
        return this._calBoxCenter(rootNode);
    }

    _createHalfAxes(box, transform) {
        let halfAxes = box.slice(3, 12);
        const rotationScale = mat3.fromMat4(TEMP_MAT3_0, transform);
        halfAxes = mat3.multiply(halfAxes, rotationScale, halfAxes);
        return halfAxes;
    }

    _getBoxScale(center) {
        const map = this.getMap();
        const scalePoint = map.distanceToPointAtRes(100, 100, map.getGLRes(), center);
        let heightScale;
        if (map.altitudeToPoint) {
            heightScale = map.altitudeToPoint(100, map.getGLRes()) / 100;
        } else {
            heightScale = scalePoint.y / 100;
        }
        vec3.set(TEMP_SCALE, scalePoint.x / 100 * 1.01, scalePoint.y / 100 * 1.01, heightScale);
        return TEMP_SCALE;
    }

    _offsetCenter(center) {
        if (Array.isArray(center)) {
            center = new maptalks.Coordinate(center);
        }
        let offset = this.options['offset'];
        if (isFunction(offset)) {
            offset = offset.call(this, Array.isArray(center) ? new maptalks.Coordinate(center) : center);
        }
        if (offset[0] || offset[1]) {
            const map = this.getMap();
            const res = map.getGLRes();
            const point = map.coordToPointAtRes(center, res);
            point['_sub'](offset);
            return map.pointAtResToCoord(point, res);
        }
        return center;
    }

    _getRootNode(i) {
        return this._roots[i];
    }

    _getRootMaxExtent(i) {
        const extent = this._getNodeService(i).maxExtent;
        if (!extent) {
            return null;
        }
        const root = this._roots[i];
        if (root.maxExtent) {
            return root.maxExtent;
        }
        root.maxExtent = new maptalks.Extent(extent).convertTo(c => this._coordToPoint(c));
        return root.maxExtent;
    }

    /**
     * Compute tile's SSE
     * from Cesium
     * 与cesium不同的是，我们用boundingVolume顶面的四个顶点中的最小值作为distanceToCamera
     */
    _getScreenSpaceError(node) {
        const fovDenominator = this._fovDenominator;
        const geometricError = node.geometricError;
        if (geometricError === 0) {
            node._error = 0;
            return 0;
        }
        const service = this._getNodeService(node._rootIdx);
        const serviceScale = service.scale || 1;
        const map = this.getMap();
        let distanceToCamera;

        if (node.boundingVolume.region) {
            distanceToCamera = computeRegionDistanceToCamera(node, this._cameraCartesian3, this._cameraLocation);
        } else if (node.boundingVolume.sphere) {
            distanceToCamera = computeSphereDistanceToCamera(node.boundingVolume, this._cameraCartesian3);
        } else if (node.boundingVolume.box) {
            distanceToCamera = computeBoxDistanceToCamera(node.boundingVolume, this._cameraCartesian3);
        }
        const distance = Math.max(Math.abs(distanceToCamera), 1E-7);
        const error = (geometricError * serviceScale * map.height) / (distance * fovDenominator);

        node._cameraDistance = distanceToCamera;
        node._error = error;

        return error;
    }

    _setToRedraw() {
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
    }

    _getNodeBox(id) {
        return this._nodeBoxes[id];
    }

    /**
     * Identify the data on the given container point
     * @param  {maptalks.Point} point   - point to identify
     * @param  {Object} [options=null]  - options
     * @param  {Object} [options.tolerance=0] - identify tolerance in pixel
     * @param  {Object} [options.count=null]  - result count
     * @return {Object[]} data identified
     */
    identify(coordinate, options = {}) {
        const map = this.getMap();
        const renderer = this.getRenderer();
        if (!map || !renderer) {
            return [];
        }
        const cp = map.coordToContainerPoint(new maptalks.Coordinate(coordinate));
        return this.identifyAtPoint(cp, options);
    }

    /**
     * Identify the data on the given container point
     * @param  {maptalks.Point} point   - point to identify
     * @param  {Object} [options=null]  - options
     * @param  {Object} [options.tolerance=0] - identify tolerance in pixel
     * @return {Object[]} data identified
     */
    identifyAtPoint(point, options = {}) {
        const results = [];
        if (!options['excludeMasks']) {
            const identifyMasks = this.identifyMask(point, options);
            if (identifyMasks && identifyMasks.length) {
                pushIn(results, identifyMasks);
            }
        }
        const map = this.getMap();
        const renderer = this.getRenderer();
        if (!map || !renderer) {
            return [];
        }
        const dpr = map.getDevicePixelRatio();
        const picked = renderer.pick(point.x * dpr, point.y * dpr, options);
        pushIn(results, picked);
        return results;
    }

    getCurrentBatchIDs() {
        const map = this.getMap();
        const renderer = this.getRenderer();
        if (!map || !renderer) {
            return [];
        }
        return renderer._getCurrentBatchIDs();
    }

    highlight(highlights) {
        const renderer = this.getRenderer();
        if (!renderer) {
            if (!this._highlighted) {
                this._highlighted = [];
            }
            this._highlighted.push(highlights);
            return this;
        }
        renderer.highlight(highlights);
        return this;
    }

    _resumeHighlights() {
        if (!this._highlighted) {
            return;
        }
        for (let i = 0; i < this._highlighted.length; i++) {
            this.highlight(this._highlighted[i]);
        }
        delete this._highlighted;
    }

    cancelHighlight(service, ids) {
        const renderer = this.getRenderer();
        if (!renderer) {
            return this;
        }
        renderer.cancelHighlight(service, ids);
        return this;
    }

    cancelAllHighlight() {
        const renderer = this.getRenderer();
        if (!renderer) {
            return this;
        }
        renderer.cancelAllHighlight();
        return this;
    }

    showOnly(items) {
        const renderer = this.getRenderer();
        if (!renderer) {
            if (!this._showOnlys) {
                this._showOnlys = [];
            }
            this._showOnlys.push(items);
            return this;
        }
        renderer.showOnly(items);
        return this;
    }

    _resumeShowOnly() {
        if (!this._showOnlys) {
            return;
        }
        for (let i = 0; i < this._showOnlys.length; i++) {
            this.showOnly(this._showOnlys[i]);
        }
        delete this._showOnlys;
    }

    cancelShowOnly(service) {
        const renderer = this.getRenderer();
        if (!renderer) {
            return this;
        }
        renderer.cancelShowOnly(service);
        return this;
    }

    setServiceOpacity(idx, opacity) {
        const service = this.options.services[idx];
        if (service) {
            service.opacity = opacity;
        }
        const renderer = this.getRenderer();
        if (!renderer) {
            return this;
        }
        renderer.setToRedraw();
        return this;
    }

    setServiceDebugBoundingVolume(idx, visible) {
        const service = this.options.services[idx];
        if (service) {
            service.debug = visible;
        }
        const renderer = this.getRenderer();
        if (!renderer) {
            return this;
        }
        renderer.setToRedraw();
        return this;
    }

    _getCameraLonLat(cameraPosition) {
        const map = this.getMap();
        const res = map.getGLRes();

        CAMERA_COORD.set(cameraPosition[0], cameraPosition[1]);
        const cameraCoord = map.pointAtResToCoord(CAMERA_COORD, res);
        const isIdentity = map.getProjection().code.toLowerCase() === 'identity';
        if (!isIdentity) {
            return cameraCoord;
        }
        TEMP_VEC3_1[0] = cameraCoord.x;
        TEMP_VEC3_1[1] = cameraCoord.y;
        this.getRenderer()._identityCoordToLngLat(TEMP_VEC3_0, TEMP_VEC3_1);
        cameraCoord.set(TEMP_VEC3_0[0], TEMP_VEC3_0[1]);
        return cameraCoord;
    }

    /**
     * Export the Geo3DTilesLayer's profile json. <br>
     * Layer's profile is a snapshot of the layer in JSON format. <br>
     * It can be used to reproduce the instance by [fromJSON]{@link Layer#fromJSON} method
     * @return {Object} layer's profile JSON
     */
    toJSON() {
        const profile = {
            'type': this.getJSONType(),
            'id': this.getId(),
            'options': this.config()
        };
        return profile;
    }
}

Geo3DTilesLayer.mergeOptions(options);

Geo3DTilesLayer.registerRenderer('gl', Geo3DTilesRenderer);

Geo3DTilesLayer.registerJSONType('Geo3DTilesLayer');

function computeSphereDistanceToCamera(boundingVolume, cameraCartesian3) {
    const center = boundingVolume.sphere;
    const distance = vec3.dist(center, cameraCartesian3);
    const radius = boundingVolume.sphere[3];
    if (distance < radius) {
        return 0;
    } else {
        return distance - radius;
    }
}

function computeBoxDistanceToCamera(boundingVolume, cameraCartesian3) {
    const box = boundingVolume.box;
    const boxCenter = vec3.set(TEMP_VEC3_0, box[0], box[1], box[2]);
    const halfAxes = mat3.set(TEMP_MAT3_0, box[3], box[4], box[5], box[6], box[7], box[8], box[9], box[10], box[11]);
    return distanceToCamera(boxCenter, halfAxes, cameraCartesian3);
}

/**
 * 计算 node 到 cameraCartesian3 的距离，遍历 node 的 topPlane 的四个端点，取最小值
 * @param {Object} node 3d-tiles node
 * @param {Number[3]} cameraCartesian3 camera's cartesian3 position
 * @return {Number}
 */
function computeRegionDistanceToCamera(node, cameraCartesian3, cameraLocation) {
    if (!node._tileRegion) {
        node._tileRegion = new TileBoundingRegion(node.boundingVolume.region);
    }
    return node._tileRegion.distanceToCamera(cameraCartesian3, cameraLocation);
}

function createRootTile(url, idx, service) {
    url = getAbsoluteURL(url);
    const domainKey = url.indexOf('{s}') >= 0 ? '{s}' : url.indexOf('%7Bs%7D') >= 0 ? '%7Bs%7D' : null;
    const root = {
        version: 0,
        service,
        visible: isNil(service.visible) ? 1: service.visible,
        baseUrl: url.substring(0, url.lastIndexOf('/')) + '/',
        content: {
            url
        },
        refine: 'replace',
        matrix: mat4.identity([]),
        _rootIdx: idx,
        _level: 0,
        domainKey
    };
    return root;
}

function inViewerRequestVolume(cameraLocation, cameraCartesian3, volume) {
    if (volume.region) {
        const region = volume.region;
        if (cameraLocation[0] >= region[0] && cameraLocation[0] <= region[2] && // x >= xmin && x <= xmax
            cameraLocation[1] >= region[1] && cameraLocation[1] <= region[3]) { // y >= ymin && y <= ymax
            // return cameraLocation[2] >= region[4] && cameraLocation[2] <= region[5];
            return true;
        }
    } else if (volume.sphere) {
        return computeSphereDistanceToCamera(volume, cameraCartesian3);
    } else if (volume.box) {
        return computeBoxDistanceToCamera(volume, cameraCartesian3) === 0;
    }
    return false;
}

function isI3SNode(node) {
    return node.content && node.content.uri && node.content.uri.indexOf('i3s:') >= 0;
}

function convertRegionToBox(region) {
    const west = region[0], south = region[1], east = region[2], north = region[3], minHeight = region[4], maxHeight = region[5];
    const ws = radianToCartesian3([], west, south, minHeight);
    const en = radianToCartesian3([], east, north, maxHeight);
    const ws_coord = cartesian3ToDegree(ws, ws);
    const en_coord = cartesian3ToDegree(en, en);
    return { ws: ws_coord, en: en_coord };
}
function fromRotationTranslation(out, rotation, translation) {
    return fillColumnMajorMatrix4(
        out,
        rotation[0],
        rotation[3],
        rotation[6],
        translation[0],
        rotation[1],
        rotation[4],
        rotation[7],
        translation[1],
        rotation[2],
        rotation[5],
        rotation[8],
        translation[2],
        0.0,
        0.0,
        0.0,
        1.0
    );
}

function fillColumnMajorMatrix4(out,
    column0Row0,
    column1Row0,
    column2Row0,
    column3Row0,
    column0Row1,
    column1Row1,
    column2Row1,
    column3Row1,
    column0Row2,
    column1Row2,
    column2Row2,
    column3Row2,
    column0Row3,
    column1Row3,
    column2Row3,
    column3Row3
) {
    out[0] = column0Row0 || 0.0;
    out[1] = column0Row1 || 0.0;
    out[2] = column0Row2 || 0.0;
    out[3] = column0Row3 || 0.0;
    out[4] = column1Row0 || 0.0;
    out[5] = column1Row1 || 0.0;
    out[6] = column1Row2 || 0.0;
    out[7] = column1Row3 || 0.0;
    out[8] = column2Row0 || 0.0;
    out[9] = column2Row1 || 0.0;
    out[10] = column2Row2 || 0.0;
    out[11] = column2Row3 || 0.0;
    out[12] = column3Row0 || 0.0;
    out[13] = column3Row1 || 0.0;
    out[14] = column3Row2 || 0.0;
    out[15] = column3Row3 || 0.0;
    return out;
}

function getBoxPlaneCenter(out, box, v0, v1, v2, v3) {
    v0 = vec3.set(TEMP_VEC3_0, box[v0 * 3], box[v0 * 3 + 1], box[v0 * 3 + 2]);
    v1 = vec3.set(TEMP_VEC3_1, box[v1 * 3], box[v1 * 3 + 1], box[v1 * 3 + 2]);
    v2 = vec3.set(TEMP_VEC3_2, box[v2 * 3], box[v2 * 3 + 1], box[v2 * 3 + 2]);
    v3 = vec3.set(TEMP_VEC3_3, box[v3 * 3], box[v3 * 3 + 1], box[v3 * 3 + 2]);

    out[0] = (v0[0] + v1[0] + v2[0] + v3[0]) / 4;
    out[1] = (v0[1] + v1[1] + v2[1] + v3[1]) / 4;
    out[2] = (v0[2] + v1[2] + v2[2] + v3[2]) / 4;

    return out;
}

function isTopTile(node)  {
    if (!node.content || node.hasParentContent) {
        return false;
    }
    let parent = node.parent;
    if (parent.content || parent.hasParentContent) {
        if (!node.hasParentContent) {
            node.hasParentContent = true;
        }
        return false;
    }
    while (parent) {
        if (parent.content || parent.hasParentContent) {
            if (!node.hasParentContent) {
                node.hasParentContent = true;
            }
            return false;
        }
        parent = parent.parent;
    }
    return true;
}

function equals(a, b) {
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length === 2) {
            return vec2.exactEquals(a, b);
        } else {
            return vec3.exactEquals(a, b);
        }
    }
    return a === b;
}
