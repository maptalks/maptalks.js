// shpere: http://localhost/3dtiles/debug/guangdong.html
// box: http://localhost/3dtiles/debug/xx.html
// region:

import * as maptalks from 'maptalks';
import { vec3, mat3, mat4, MaskLayerMixin } from '@maptalks/gl';
import { intersectsSphere, intersectsBox, intersectsOrientedBox } from 'frustum-intersects';
import { isFunction, extend, isNil, toRadian, toDegree, getAbsoluteURL, isBase64, pushIn } from '../common/Util';
import { DEFAULT_MAXIMUMSCREENSPACEERROR } from '../common/Constants';
import Geo3DTilesRenderer from './renderer/Geo3DTilesRenderer';
import { radianToCartesian3, cartesian3ToDegree } from '../common/Transform';
import { distanceToCamera } from '../common/intersects_oriented_box.js';
import TileBoundingRegion from './renderer/TileBoundingRegion';

const options = {
    // 'maximumScreenSpaceError' : 8,
    'maxGPUMemory' : 512,
    'retireInterval' : 2000,
    'loadingLimitOnInteracting' : 5,
    'loadingLimit' : 0,
    // 'ajaxInMainThread' : false,
    'renderer' : 'gl',
    'forceRenderOnZooming' : true,
    'forceRenderOnRotating' : true,
    'forceRenderOnMoving' : true,
    'debug' : false,
    'debugOutline' : [0, 1, 0],
    'meshLimitPerFrame': 1,
    'i3sNodepageLimitPerFrame': 1,
    'enableI3SCompressedGeometry': true,
    'forceI3SCompressedGeometry': true,
    'picking': true,
    'pickingPoint': true,
    'geometryEvents': false,
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


// const projection = maptalks.projection.EPSG3857;

const TEMP_EXTENT = new maptalks.Extent(0, 0, 0, 0);
const TEMP_EXTENT_1 = new maptalks.Extent(0, 0, 0, 0);
const TEMP_VEC3_0 = [];
const TEMP_VEC3_1 = [];
const TEMP_SCALE = [];

const EMPTY_ARRAY = [];
const TEMP_POINT = new maptalks.Point(0, 0);

const TEMP_MAT3_0 = [];

const CAMERA_COORD = new maptalks.Coordinate(0, 0);
const IDENTITY_MATRIX = mat4.identity([]);
const EMPTY_COORD_OFFSET = [0, 0];
/**
 * A layer to stream AnalyticalGraphicsInc's 3d-tiles geospatial data
 * 3d-tiles 规范：https://github.com/AnalyticalGraphicsInc/3d-tiles/
 */
export default class Geo3DTilesLayer extends MaskLayerMixin(maptalks.Layer) {


    constructor(id, options) {
        super(id, options);
        this._initRoots();
        //tileset.json requests
        this._requests = {};
        this._nodeBoxes = [];
    }

    _initRoots() {
        const urls = this.options.services.map(service => service.url);
        let maxRootId = 0;
        if (this._roots) {
            for (let i = 0; i < this._roots.length; i++) {
                const root = this._roots[i];
                if (root && root._rootIdx > maxRootId) {
                    maxRootId = root._rootIdx;
                }
            }
        }
        this._roots = urls.map((url, idx) => {
            return this._root && this._roots[idx] || createRootTile(url, maxRootId++);
        });
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
        if (services && services[idx]) {
            extend(services[idx], info)
        }
        if (!isNil(info.visible)) {
            if (this._roots && this._roots[idx]) {
                this._roots[idx].visible = info.visible;
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
            services.splice(idx, 1);
        }
        if (this._roots && this._roots[idx]) {
            this._roots.splice(idx, 1);
        }
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
        return this;
    }

    getTileUrl(url/*, baseUrl*/) {
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
        if (node.boundingVolume.region) {
            const region = node.boundingVolume.region;
            return new maptalks.Extent(toDegree(region[0]), toDegree(region[1]), toDegree(region[2]), toDegree(region[3]));
        } else if (node.boundingVolume.sphere) {
            const sphere = node.boundingVolume.sphere;
            // let nodeCenter = sphere.slice(0, 3);
            const nodeCenter = vec3.transformMat4([], sphere, matrix);
            const center = cartesian3ToDegree([], nodeCenter);
            const radius = sphere[3];
            const nw = map.locate(center, -radius, radius);
            const se = map.locate(center, radius, -radius);
            return new maptalks.Extent(nw, se);
        } else if (node.boundingVolume.box) {
            const nodeBox = node.boundingVolume.box;
            // let nodeCenter = nodeBox.slice(0, 3);
            const nodeCenter = vec3.transformMat4([], nodeBox, matrix);
            const center = new maptalks.Coordinate(cartesian3ToDegree([], nodeCenter));
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
        let cameraCoord, distance;
        if (map.getGLZoom) {
            distance = map.pointToDistance(cameraPosition[2], 0, map.getGLZoom());
            CAMERA_COORD.set(cameraPosition[0], cameraPosition[1]);
            cameraCoord = map.pointToCoord(CAMERA_COORD, map.getGLZoom());
        } else {
            const res = map.getGLRes();
            distance = map.pointAtResToDistance(cameraPosition[2], 0, res);
            CAMERA_COORD.set(cameraPosition[0], cameraPosition[1]);
            cameraCoord = map.pointAtResToCoord(CAMERA_COORD, res);
        }
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
            if (!root.visible) {
                continue;
            }
            let firstContentLevel = Infinity;
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
                if (visible < 1) {
                    let parent = currentParent;
                    while (parent && !parent.content) {
                        parent = parent.parent;
                    }
                    if (visible === 0 && parent && parent.content) {
                        // node._contentParent = parent;
                        this._addCandidateNode(tiles, parent);
                        // tiles[parent.node.id] = parent;
                    }
                    const config = this.options.services[node._rootIdx];
                    if (config['alwaysShow'] !== false) {
                        //当tile在frustum中，level处于第一个有content的层级，则永远绘制它
                        if (visible === 0 && node._level <= firstContentLevel) {
                            if (node.content) {
                                firstContentLevel = node._level;
                            }
                        } else {
                            continue;
                        }
                    } else {
                        continue;
                    }
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
                                } else if (url.indexOf('http://') === -1 && (url.indexOf('https://') === -1)) {
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
        node.id = maptalks.Util.GUID();
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
        // boundingVolume上应用heightOffset，解决设置heightOffset后，visible计算不正确的问题

        this._offsetBoundingVolume(node)

    }

    _offsetBoundingVolume(node) {
        const boundingVolume = node.boundingVolume;
        if (!boundingVolume || boundingVolume._centerTransformed) {
            return;
        }
        const service = this.options.services[node._rootIdx];
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
        if (!node.boundingVolume || (!heightOffset && mat4.exactEquals(node.matrix, IDENTITY_MATRIX) && !hasOffset && coordOffset === EMPTY_COORD_OFFSET)) {
            return;
        }
        const { region, box, sphere } = boundingVolume;
        if (region) {
            const westSouth = this._offsetCenter([toDegree(region[0]), toDegree(region[1])]);
            region[0] = toRadian(westSouth.x + coordOffset[0]);
            region[1] = toRadian(westSouth.y + coordOffset[1]);
            const eastNorth = this._offsetCenter([toDegree(region[2]), toDegree(region[3])]);
            region[2] = toRadian(eastNorth.x + coordOffset[0]);
            region[3] = toRadian(eastNorth.y + coordOffset[1]);
            region[4] += heightOffset + (coordOffset[2] || 0);
            region[5] += heightOffset + (coordOffset[2] || 0);
        } else if (box || sphere) {
            // const volume = box || sphere;
            // const cart3 = vec3.transformMat4(TEMP_VEC3_0, volume, node.matrix);
            // const matInvert = mat4.invert(TEMP_MAT, node.matrix);
            // const center = cartesian3ToDegree(TEMP_VEC3_1, cart3);
            // center[2] += heightOffset;
            // radianToCartesian3(cart3, toRadian(center[0]), toRadian(center[1]), center[2]);
            // vec3.transformMat4(volume, cart3, matInvert);

            const volume = box || sphere;
            const cart3 = vec3.transformMat4(TEMP_VEC3_0, volume, node.matrix);
            const center = cartesian3ToDegree(TEMP_VEC3_1, cart3);
            const offsetCenter = this._offsetCenter([center[0] + coordOffset[0], center[1] + coordOffset[1]]);
            center[0] = offsetCenter.x;
            center[1] = offsetCenter.y;
            center[2] += heightOffset + (coordOffset[2] || 0);
            radianToCartesian3(volume, toRadian(center[0]), toRadian(center[1]), center[2]);

            // if (box) {
            //     const boxCenter = new maptalks.Coordinate(center);
            //     const map = this.getMap();
            //     const hScale = 1 / (map.getGLZoom ? map.getResolution(map.getGLZoom()) : map.getGLRes());//
            //     const pcenter = this._coordToPoint(boxCenter);
            //     const centerHeight = center[2];

            //     const halfAxes = box.slice(3);
            //     mat3.multiply(halfAxes, mat3.fromMat4([], node.matrix), halfAxes);

            //     const xAxis = this._convertAxis(box, halfAxes.slice(0, 3), pcenter, centerHeight, hScale);
            //     const yAxis = this._convertAxis(box, halfAxes.slice(3, 6), pcenter, centerHeight, hScale);
            //     const zAxis = this._convertAxis(box, halfAxes.slice(6, 9), pcenter, centerHeight, hScale);

            //     box[3] = xAxis[0];
            //     box[4] = xAxis[1];
            //     box[5] = xAxis[2];

            //     box[6] = yAxis[0];
            //     box[7] = yAxis[1];
            //     box[8] = yAxis[2];

            //     box[9] = zAxis[0];
            //     box[10] = zAxis[1];
            //     box[11] = zAxis[2];
            // }
        }
        boundingVolume._centerTransformed =  true;
    }

    // _convertAxis(cartCenter, axis, pcenter, centerHeight, hScale) {
    //     const xCorner = vec3.add(TEMP_VEC3_0, cartCenter, axis);
    //     const degree = cartesian3ToDegree(TEMP_VEC3_1, xCorner);
    //     const point = this._coordToPoint(new maptalks.Coordinate(degree));
    //     return [point.x - pcenter.x, point.y - pcenter.y, (degree[2] - centerHeight) * hScale];

    //     // return [axis[0] * hScale, axis[1] * hScale, axis[2] * hScale]
    // }

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
        const service = this.options.services[parent._rootIdx];
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
            this._offsetBoundingVolume(parent);
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
            if (!isI3S && url && !isBase64(url) && url.indexOf('http://') === -1 && url.indexOf('https://') === -1) {
                parent.content.url = parent.baseUrl + url;
            }
        }
        this._setToRedraw();
        this.fire('loadtileset', { tileset, index: parent && parent._rootIdx, url });
    }

    _isVisible(node, maxExtent, projectionView) {
        node._cameraDistance = Infinity;
        if (node._level === 0 || node._empty) {
            return 1;
        }
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
        let maximumScreenSpaceError = this.options.services[node._rootIdx]['maximumScreenSpaceError'];
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
        const sphere = boundingVolume.sphere;
        let region = boundingVolume.region;
        const box = boundingVolume.box;
        if (!nodeBox) {
            let extent, top, bottom;
            if (box) {
                region = convertBoxToRegion(box, node.matrix);
                boundingVolume.region = region;
            }
            if (region) {
                extent = TEMP_EXTENT.set(toDegree(region[0]), toDegree(region[1]), toDegree(region[2]), toDegree(region[3]));
                const center = extent.getCenter();

                const scale = this._getBoxScale(center);

                extent = extent.convertTo(c => this._coordToPoint(c, TEMP_POINT), TEMP_EXTENT_1);
                bottom = region[4];
                top = region[5];
                //[[xmin, ymin, bottom], [xmax, ymax, top]]
                nodeBox = this._nodeBoxes[id] = [[extent.xmin, extent.ymin, bottom * scale[2]], [extent.xmax, extent.ymax, top * scale[2]]];
                nodeBox.center = center;
            } else if (sphere) {
                // let nodeCenter = sphere.slice(0, 3);
                // const nodeCenter = vec3.transformMat4(sphere, sphere, node.matrix);
                const nodeCenter = sphere;
                const center = cartesian3ToDegree(TEMP_VEC3_0, nodeCenter);
                const coord = new maptalks.Coordinate(center);
                const pcenter = this._coordToPoint(coord, TEMP_POINT).toArray();

                const scale = this._getBoxScale(coord);

                pcenter.push(center[2] * scale[2]);
                //[xcenter, ycenter, radius]
                nodeBox = this._nodeBoxes[id] = [pcenter, sphere[3] * scale[2]];
                nodeBox.center = coord;
            } /*else if (box) {
                // let nodeCenter = nodeBox.slice(0, 3);
                // const nodeCenter = vec3.transformMat4(nodeBox, nodeBox, node.matrix);
                const nodeCenter = box;
                const center = cartesian3ToDegree(TEMP_VEC3_0, nodeCenter);
                const coord = new maptalks.Coordinate(center);
                const scale = this._getBoxScale(coord);
                const pointBox = convertBoxToPointSpace(this.getMap(), box, node.matrix, scale[2]);
                // const pcenter = pointBox.slice(0, 3);
                // const center = cartesian3ToDegree(TEMP_VEC3_0, nodeCenter);
                // const coord = new maptalks.Coordinate(center);
                // const pcenter = this._coordToPoint(coord, TEMP_POINT).toArray();



                // pcenter.push(center[2] * scale[2]);
                // const halfAxes = box.slice(3);
                // if (!mat4.exactEquals(node.matrix, IDENTITY_MATRIX)) {
                //     mat3.multiply(halfAxes, mat3.fromMat4(TEMP_MAT3_0, node.matrix), halfAxes);
                // }
                // for (let i = 0; i < halfAxes.length; i++) {
                //     halfAxes[i] *= scale[i % 3];
                //     box[3 + i] = halfAxes[i];
                // }
                //[[xcenter, ycenter, z], half-x, half-y, half-z]
                nodeBox = this._nodeBoxes[id] = pointBox;
                nodeBox.center = coord;
            }*/
        }


        if (maxExtent) {
            //比较简单的extent比较，
            if (region) {
                TEMP_EXTENT.xmin = nodeBox[0][0];
                TEMP_EXTENT.ymin = nodeBox[0][1];
                TEMP_EXTENT.xmax = nodeBox[1][0];
                TEMP_EXTENT.ymax = nodeBox[1][1];
            } else if (sphere) {
                const radius = nodeBox[2];
                TEMP_EXTENT.xmin = nodeBox[0][0] - radius;
                TEMP_EXTENT.ymin = nodeBox[0][1] - radius;
                TEMP_EXTENT.xmax = nodeBox[0][0] + radius;
                TEMP_EXTENT.ymax = nodeBox[0][1] + radius;
            } else if (box) {
                const hx = nodeBox[1];
                const hy = nodeBox[2];
                TEMP_EXTENT.xmin = nodeBox[0][0] - hx;
                TEMP_EXTENT.ymin = nodeBox[0][1] - hy;
                TEMP_EXTENT.xmax = nodeBox[0][0] + hx;
                TEMP_EXTENT.ymax = nodeBox[0][1] + hy;
            }
            if (!maxExtent.intersects(TEMP_EXTENT)) {
                return false;
            }
        }

        if (region) {
            return intersectsBox(projectionView, nodeBox);
        } else if (sphere) {
            return intersectsSphere(projectionView, nodeBox);
        } else if (box) {
            return intersectsOrientedBox(projectionView, nodeBox);
        }
        return false;
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
            offset = offset(Array.isArray(center) ? new maptalks.Coordinate(center) : center);
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

    _getRootMaxExtent(i) {
        const extent = this.options.services[i].maxExtent;
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
        const error = (geometricError * map.height) / (distance * fovDenominator);

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

// function computeSphereCenterToCamera(node, cameraCartesian3) {
//     const center = node.boundingVolume.sphere;
//     const distance = vec3.dist(center, cameraCartesian3);
//     return distance;
// }

// function computeBoxCenterToCamera(node, cameraCartesian3) {
//     const center = node.boundingVolume.box;
//     const distance = vec3.dist(center, cameraCartesian3);
//     return distance;
// }

function computeBoxDistanceToCamera(boundingVolume, cameraCartesian3) {
    const box = boundingVolume.box;
    const boxCenter = vec3.set(TEMP_VEC3_0, box[0], box[1], box[2]);
    const halfAxes = mat3.set(TEMP_MAT3_0, box[3], box[4], box[5], box[6], box[7], box[8], box[9], box[10], box[11]);
    return distanceToCamera(boxCenter, halfAxes, cameraCartesian3);
}

// const REGION_MIN = [];
// const REGION_MAX = [];
// function computeRegionCenterToCamera(node, cameraCartesian3) {
//     const region = node.boundingVolume.region;
//     const min = radianToCartesian3(REGION_MIN, region[0], region[1], region[4]),
//         max  = radianToCartesian3(REGION_MAX, region[2], region[3], region[5]);
//     const center = vec3.scale(min, vec3.add(min, min, max), 1 / 2);
//     return vec3.dist(center, cameraCartesian3);
// }

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

function createRootTile(url, idx) {
    url = getAbsoluteURL(url);
    const root = {
        visible: 1,
        baseUrl : url.substring(0, url.lastIndexOf('/')) + '/',
        content: {
            url
        },
        refine: 'replace',
        matrix : mat4.identity([]),
        _rootIdx : idx,
        _level : 0
    };
    return root;
}


// function distanceScale(center) {
//     const target = projection.locate(center, 100, 0);
//     const p0 = projection.project(center),
//         p1 = projection.project(target);
//     p1['_sub'](p0)['_abs']();
//     return p1.x / 100;
// }

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

// function toSphere(box) {
//     const sphere = [box[0], box[1], box[2], 0];
//     const u = [box[3], box[4], box[5]];
//     const v = [box[6], box[7], box[8]];
//     const w = [box[9], box[10], box[11]];

//     vec3.add(u, u, v);
//     vec3.add(u, u, w);

//     sphere[3] = vec3.length(u);
//     return sphere;
// }

function isI3SNode(node) {
    return node.content && node.content.uri && node.content.uri.indexOf('i3s:') >= 0;
}

const BOX_CENTER = [];
const X_AXIS = [];
const Y_AXIS = [];
const Z_AXIS = [];
const CORNERS = [];
const CORNERCOORDS = [];
const CORNER_Xs = [];
const CORNER_Ys = [];
const CORNER_Zs = [];
const HALF_AXES = [];
const RADIUS = 6378137;
function convertBoxToRegion(box, matrix) {
    for (let i = 0; i < 9; i++) {
        if (box[i + 3] === Infinity || box[i + 3] === -Infinity) {
            box[i + 3] = Math.sign(box[i + 3]) * RADIUS * 3;
        }
        HALF_AXES[i] = box[i + 3];
    }
    const halfAxes = HALF_AXES;
    if (!mat4.exactEquals(matrix, IDENTITY_MATRIX)) {
        mat3.multiply(halfAxes, mat3.fromMat4(TEMP_MAT3_0, matrix), halfAxes);
    }
    const center = vec3.copy(BOX_CENTER, box);
    // const coordCenter = cartesian3ToDegree(COORD_CENTER, center);
    // COORD.set(coordCenter[0], coordCenter[1]);
    // const pointCenter = map.coordToPointAtRes(COORD, glRes, POINT_CENTER);
    // const centerZ = coordCenter[2] * scaleZ;

    const xAxis = vec3.set(X_AXIS, halfAxes[0], halfAxes[1], halfAxes[2]);
    const yAxis = vec3.set(Y_AXIS, halfAxes[3], halfAxes[4], halfAxes[5]);
    const zAxis = vec3.set(Z_AXIS, halfAxes[6], halfAxes[7], halfAxes[8]);

    CORNERS[0] = CORNERS[0] || [];
    const corner0 = vec3.copy(CORNERS[0], center);
    vec3.sub(corner0, corner0, xAxis);
    vec3.sub(corner0, corner0, yAxis);
    vec3.sub(corner0, corner0, zAxis);

    CORNERS[1] = CORNERS[1] || [];
    const corner1 = vec3.copy(CORNERS[1], center);
    vec3.sub(corner1, corner1, xAxis);
    vec3.sub(corner1, corner1, yAxis);
    vec3.add(corner1, corner1, zAxis);


    CORNERS[2] = CORNERS[2] || [];
    const corner2 = vec3.copy(CORNERS[2], center);
    vec3.sub(corner2, corner2, xAxis);
    vec3.add(corner2, corner2, yAxis);
    vec3.sub(corner2, corner2, zAxis);


    CORNERS[3] = CORNERS[3] || [];
    const corner3 = vec3.copy(CORNERS[3], center);
    vec3.sub(corner3, corner3, xAxis);
    vec3.add(corner3, corner3, yAxis);
    vec3.add(corner3, corner3, zAxis);


    CORNERS[4] = CORNERS[4] || [];
    const corner4 = vec3.copy(CORNERS[4], center);
    vec3.add(corner4, corner4, xAxis);
    vec3.sub(corner4, corner4, yAxis);
    vec3.sub(corner4, corner4, zAxis);


    CORNERS[5] = CORNERS[5] || [];
    const corner5 = vec3.copy(CORNERS[5], center);
    vec3.add(corner5, corner5, xAxis);
    vec3.sub(corner5, corner5, yAxis);
    vec3.add(corner5, corner5, zAxis);


    CORNERS[6] = CORNERS[6] || [];
    const corner6 = vec3.copy(CORNERS[6], center);
    vec3.add(corner6, corner6, xAxis);
    vec3.add(corner6, corner6, yAxis);
    vec3.sub(corner6, corner6, zAxis);

    CORNERS[7] = CORNERS[7] || [];
    const corner7 = vec3.copy(CORNERS[7], center);
    vec3.add(corner7, corner7, xAxis);
    vec3.add(corner7, corner7, yAxis);
    vec3.add(corner7, corner7, zAxis);

    for (let i = 0; i < CORNERS.length; i++) {
        CORNERCOORDS[i] = CORNERCOORDS[i] || [];
        cartesian3ToDegree(CORNERCOORDS[i], CORNERS[i]);
        CORNER_Xs[i] = CORNERCOORDS[i][0];
        CORNER_Ys[i] = CORNERCOORDS[i][1];
        CORNER_Zs[i] = CORNERCOORDS[i][2];
    }



    return [
        toRadian(Math.min(...CORNER_Xs)),
        toRadian(Math.min(...CORNER_Ys)),
        toRadian(Math.max(...CORNER_Xs)),
        toRadian(Math.max(...CORNER_Ys)),
        Math.min(...CORNER_Zs),
        Math.max(...CORNER_Zs)
    ];
}
