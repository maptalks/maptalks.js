import * as maptalks from 'maptalks';
import { reshader } from '@maptalks/gl';
import { Ajax } from '@maptalks/gltf-loader';
import { createREGL, MaskRendererMixin } from '@maptalks/gl';
import Geo3DTilesWorkerConnection from '../Geo3DTilesWorkerConnection';
import LRUCache from './LRUCache';
import TileMeshPainter from './TileMeshPainter';
import { readBatchArray } from '../../common/TileHelper';
import { extend, isBase64, base64URLToArrayBuffer, pushIn } from '../../common/Util.js';
import { isRelativeURL, prepareFetchOptions } from '../../common/UrlUtil';
// import { CANDIDATE_MAX_ERROR } from '../../common/Constants.js';
import { parseI3SJSON, isI3STileset, isI3SMesh, getI3SNodeInfo } from '../i3s/I3SHelper';
import { fillNodepagesToCache } from '../i3s/Util';
import I3SNode from '../i3s/I3SNode';

const COORD_IN = new maptalks.Coordinate(0, 0);
const COORD_OUT = new maptalks.Coordinate(0, 0);

const REPORTED_ERRORS = new Set();

const EMPTY_ARRAY = [];

const GlobalTieCache = new LRUCache((maptalks.Browser.mobile ? 32 : 1024) * 1024 * 1024, (tile => {
    const renderer = tile.renderer;
    delete tile.renderer;
    renderer.deleteTile(tile);
}));
let TileCacheRefCount = 0;



export default class Geo3DTilesRenderer extends MaskRendererMixin(maptalks.renderer.CanvasRenderer) {

    constructor(layer) {
        super(layer);
        const max = layer.options['maxGPUMemory'] * 1024 * 1024;
        if (max > GlobalTieCache.max) {
            GlobalTieCache.setMaxSize(max);
        }
        this.tileCache = GlobalTieCache;
        TileCacheRefCount++;
        this.tilesLoading = {};
        this._requests = {};
        this._modelQueue = [];
        this._fnFetchNodepages = (...args) => {
            return this._fetchI3DNodepages.call(this, ...args);
        };
    }

    getAnalysisMeshes() {
        if (!this.painter) {
            return EMPTY_ARRAY;
        }
        const paintedMeshes = this.painter.getPaintedMeshes();
        if (!paintedMeshes) {
            return EMPTY_ARRAY;
        }

        const meshes = [];
        const { b3dmMeshes, pntsMeshes, i3dmMeshes } = paintedMeshes;
        if (b3dmMeshes.length) {
            pushIn(meshes, b3dmMeshes.filter(mesh => !!(mesh && mesh.geometry)));
        }
        if (pntsMeshes.length) {
            pushIn(meshes, pntsMeshes.filter(mesh => !!(mesh && mesh.geometry)));
        }
        if (i3dmMeshes.length) {
            pushIn(meshes, i3dmMeshes.filter(mesh => !!(mesh && mesh.geometry)));
        }
        return meshes;
    }

    needToRedraw() {
        // return true;
        const map = this.getMap();
        if (map.isInteracting()) {
            return true;
        }
        if (this._modelQueue.length) {
            return true;
        }
        return super.needToRedraw();
    }

    getFrameTimestamp() {
        return this._timestamp;
    }

    drawOnInteracting(event, timestamp, parentContext) {
        this.draw(timestamp, parentContext);
    }

    draw(timestamp, parentContext) {
        this._timestamp = timestamp;
        const mask2DExtent = this.prepareCanvas();
        if (mask2DExtent) {
            if (!mask2DExtent.intersects(this.canvasExtent2D)) {
                this.completeRender();
                return;
            }
        }
        const { root, tiles } = this.layer.getTiles();
        const count = tiles.length;
        if (!tiles || !count) {
            this.completeRender();
            return;
        }
        this.painter.prepareRender(parentContext);
        this._consumeI3SQueue();
        this._consumeModelQueue(parentContext);
        const { selectedTiles, leaves, requests} = this._selectTiles(root, tiles);

        if (requests.length) {
            this.loadTiles(requests);
        }
        this._drawTiles(selectedTiles, leaves, parentContext);
        this._abortUnusedTiles();
        if (!requests.length) {
            this.completeRender();
        }
    }
    // 遍历candidate瓦片，检查哪些可以获取到mesh，哪些需要去构造网络请求
    _selectTiles(root, tiles) {
        let requests = [];
        this._markTiles();
        let preLoadingCount = 0;
        const loadingLimit = this._getLoadLimit();

        const checked = {};
        let hit = false, loading = false;
        for (let i = 0; i < tiles.length; i++) {
            const tile = tiles[i];
            const node = tile.node;
            if (checked[node.id]) {
                continue;
            }
            checked[node.id] = 1;
            let tileLoading = false;
            const cached = this.getCachedTile(node.id);
            if (this._isLoadingTile(node.id)) {
                preLoadingCount++;
                tileLoading = loading = true;
                this.tilesLoading[node.id].current = true;
            } else if (cached) {
                if (this.getTileOpacity(cached) < 1) {
                    tileLoading = loading = true;
                }
                // 剔除掉error相差过大的父级瓦片。否则会在有些情况下，覆盖范围很大的父级瓦片会绘制在场景中
                // 是在小丸子公司，由飞渡生成的模型中发现了该问题
                // if (!tile.node._error || rootNode.isS3M || !tile.node.children || tile.node._error <= CANDIDATE_MAX_ERROR) {

                // }
                hit = true;
                tile.selected = true;
                tile.data = cached;
            } else if (!this.painter.has(node)) {
                tileLoading = loading = true;
                requests.push(node);
            }
            if (!tileLoading) {
                continue;
            }
            //background tiles
            const parentTile = this._selectParentTile(tile);
            if (!parentTile) {
                const children = this._selectChildTile(tile);
                if (children.length) hit = true;
            } else {
                hit = true;
            }
        }

        let selectedTiles = [], leaves = {};
        if (hit) {
            ({ selectedTiles, leaves } = this._sortTiles(root));
        }

        if (requests.length > 1) {
            requests.sort(compareRequests);
            if (loadingLimit) {
                const count = loadingLimit - preLoadingCount;
                if (count > 0) {
                    requests = requests.slice(0, count);
                } else {
                    requests = [];
                }
            }
        }

        return {
            loading,
            requests,
            selectedTiles,
            leaves
        };
    }

    //based on Cesium's traverseAndSelect in Cesium3DTilesetTraversal.js
    _sortTiles(root) {
        const selectedTiles = [], leaves = {};
        let lastAncestor;
        const stack = [root],
            parentStack = [];
        while (stack.length > 0 || parentStack.length > 0) {
            if (parentStack.length > 0) {
                const waitingTile = parentStack[parentStack.length - 1];
                if (waitingTile._stackLength === stack.length) {
                    parentStack.pop();
                    if (waitingTile === lastAncestor) {
                        waitingTile.leave = true;
                        leaves[waitingTile.node.id] = 1;
                    }
                    selectedTiles.push(waitingTile);
                    continue;
                }
            }
            const tile = stack.pop();
            const children = tile.children;
            if (tile.selected) {
                if (tile.node.refine === 'add') {
                    leaves[tile.node.id] = 1;
                    tile.selectionDepth = parentStack.length;
                    selectedTiles.push(tile);
                } else {
                    tile.selectionDepth = parentStack.length;

                    lastAncestor = tile;

                    if (children.length === 0) {
                        tile.leave = true;
                        leaves[tile.node.id] = 1;
                        selectedTiles.push(tile);
                        continue;
                    }

                    parentStack.push(tile);
                    tile._stackLength = stack.length;
                }
            }
            // if (children.length > 1) {
            //     children.sort(compareTile);
            // }
            for (let i = 0; i < children.length; i++) {
                stack.push(children[i]);
            }
        }

        return { selectedTiles, leaves };
    }

    _selectParentTile(node) {
        if (!node.parent) {
            return null;
        }
        let treeNode = node.parent;
        while (treeNode && treeNode.level >= 0) {
            const id = treeNode.node.id;
            const cached = this.tileCache.has(id);
            if (cached) {
                treeNode.selected = true;
                treeNode.data = this.tileCache.get(id);
                return treeNode;
            }
            treeNode = treeNode.parent;
        }
        return null;
    }

    _selectChildTile(tile) {
        const result = [];
        if (!tile.node.children || !tile.node.children.length) {
            return result;
        }
        const maxLevel = tile._level + 1;
        const queue = [tile.node];
        while (queue.length > 0) {
            const node = queue.pop();
            const children = node.children;
            for (let i = 0, l = children.length; i < l; i++) {
                if ((!children[i].content || !children[i].content.url) &&
                    children[i].children && children[i].children.length) {
                    queue.push(children[i]);
                    continue;
                }
                const id = children[i].id;
                const cached = this.tileCache.has(id);
                if (cached) {
                    const child = this.layer._createCandidate(children[i], tile);
                    child.selected = true;
                    child.data = this.tileCache.get(id);
                    tile.children.push(child);
                    result.push(child);
                } else if (children[i]._level <= maxLevel) {
                    queue.push(children[i]);
                }
            }

        }
        return result;
    }

    _drawTiles(tiles, leaves, parentContext) {

        this.tileCache.markAll(this, false);
        const boxMeshes = [];
        for (let i = 0, l = tiles.length; i < l; i++) {
            const tileData = tiles[i].data;
            tileData.current = true;
            tileData.renderer = this;
            this.tileCache.add(tiles[i].node.id, tileData);
            const node = tileData.node;
            const service = this.layer._getNodeService(node._rootIdx);
            if (node._boxMesh && service['debug'] && !Array.isArray(service['debug'])) {
                boxMeshes.push(node._boxMesh);
            }
        }

        const services = this.layer.options.services;
        for (let i = 0; i < services.length; i++) {
            const service = services[i];
            const debugNodes = Array.isArray(service['debug']) && service['debug'];
            if (debugNodes) {
                for (const nodeId of debugNodes) {
                    const nodeBox = this.layer._getNodeBox(nodeId);
                    const node = nodeBox && nodeBox.node;
                    if (!node || !node._boxMesh) {
                        continue;
                    }
                    boxMeshes.push(node._boxMesh);
                }
            }
        }

        const context = { tiles, leaves };
        this.onDrawTileStart(context);
        const count = this.painter.paint(tiles, leaves, boxMeshes, parentContext);
        this.layer.fire('drawtiles', { count });

        this.onDrawTileEnd(context);
        if (count) {
            this.layer.fire('canvasisdirty', { renderCount: count });
        }
        // 改为绘制结束后，再 shrink cache，以免当前帧需要绘制的瓦片被delete掉, maptalks/issues#766
        this.tileCache.shrink();
    }

    onDrawTileStart() {}
    onDrawTileEnd() {}

    loadTiles(queue) {
        for (let i = 0, l = queue.length; i < l; i++) {
            const node = queue[i];
            // tile image's loading may not be async
            this.tilesLoading[node.id] = {
                current : true,
                node
            };
            this.loadTile(node);
        }
    }

    loadTile(node) {
        let url = node.content.url;
        if (isBase64(url)) {
            const binary = base64URLToArrayBuffer(url);
            this._loadTileContent(url, binary, node);
            return null;

        }

        if (isI3STileset(url)) {
            const rootIdx = node._rootIdx;
            const nodeCache = this._i3sNodeCache[rootIdx];
            const i3sNode = new I3SNode(url, rootIdx, nodeCache, this.layer, this._fnFetchNodepages);
            return i3sNode.load().then(tileset => {
                this.onTilesetLoad(tileset, node, url);
            });
        }

        if (node && isRelativeURL(url) && !isI3SMesh(url)) {
            url = node.baseUrl + url;
        }
        this._loadTileContent(url, null, node);
        return null;
    }

    _loadTileContent(url, arraybuffer, tile) {
        let supportedFormats = this._supportedFormats;
        if (!supportedFormats) {
            supportedFormats = reshader.Util.getSupportedFormats(this.gl.gl || this.gl);
            this._supportedFormats = supportedFormats;
        }

        const service = this.layer._getNodeService(tile._rootIdx);
        if (service.isSuperMapiServer) {
            url = encodeSuperMapURI(url, tile.baseUrl);
        }
        const requestUrl = this.layer.getTileUrl(url, this.layer._roots[tile._rootIdx]);
        const params = { url: requestUrl, arraybuffer, rootIdx : tile._rootIdx, upAxis : tile._upAxis, transform: tile.matrix, supportedFormats };

        if (isI3SMesh(url)) {
            const nodeCache = this._i3sNodeCache[tile._rootIdx];
            params.projection = nodeCache.projection;
            params.i3sInfo = getI3SNodeInfo(url, nodeCache, this.regl, this.layer.options['enableI3SCompressedGeometry'], this.layer.options['forceI3SCompressedGeometry']);
            if (!params.i3sInfo) {
                this.onTileError({ status: 404 }, tile, url);
                return;
            }
        }

        // if (url.substring(url.length - 4, url.length) === 'b3dm') {
        //     url = 'http://localhost/3dtiles/debug/xx/tile0/3/2/6.b3dm';
        // }
        params.service = extend({}, service);
        if (service.offset) {
            delete params.service.offset;
        }
        // fetchOptions定义在service中
        params.referrer = window && window.location.href;
        this.workerConn.loadTile(this.layer.getId(), params, (err, data) => {
            if (err) {
                this.onTileError(err, tile, url);
                return;
            }
            const { magic } = data;
            if (magic === 'b3dm' || magic === 'pnts' || magic === 'i3dm' || magic === 'cmpt' || magic === 'gltf') {
                this._modelQueue.push({ data, tile });
            } else {
                this.onTilesetLoad(data, tile, url);
            }

            // if (magic === 'b3dm') {
            //     // this.painter.createB3DMMesh(data, tile.id, tile, (err, { mesh }) => {
            //     //     this._onMeshCreated(data, tile, err, mesh);
            //     // });
            // } else if (magic === 'pnts') {
            //     this.painter.createPntsMesh(data, tile.id, tile, (err, { mesh }) => {
            //         this._onMeshCreated(data, tile, err, mesh);
            //     });
            // } else if (magic === 'i3dm') {
            //     this.painter.createI3DMMesh(data, tile.id, tile, (err, { mesh }) => {
            //         this._onMeshCreated(data, tile, err, mesh);
            //     });
            // } else if (magic === 'cmpt') {
            //     this.painter.createCMPTMesh(data, tile.id, tile, (err, { mesh }) => {
            //         this._onMeshCreated(data, tile, err, mesh);
            //     });
            // }else {
            //     this.onTilesetLoad(data, tile, url);
            // }
        });
    }

    _createBoxMesh(node) {
        if (!this.painter) {
            return;
        }
        this.painter._createBoxMesh(node);
    }

    _deleteBoxMesh(node) {
        if (!this.painter) {
            return;
        }
        this.painter._deleteBoxMesh(node);
    }

    _consumeModelQueue() {
        const map = this.getMap();
        const limit = this.layer.options['meshLimitPerFrame'];
        let count = 0;
        while (this._modelQueue.length && (count < limit || !map.isInteracting())) {
            const { data, tile } = this._modelQueue.shift();
            const { magic } = data;
            if (magic === 'b3dm' || magic === 'gltf') {
                this.painter.createB3DMMesh(data, tile.id, tile, (err, { mesh }) => {
                    this._onMeshCreated(data, tile, err, mesh);
                });
            } else if (magic === 'pnts') {
                this.painter.createPntsMesh(data, tile.id, tile, (err, { mesh }) => {
                    this._onMeshCreated(data, tile, err, mesh);
                });
            } else if (magic === 'i3dm') {
                this.painter.createI3DMMesh(data, tile.id, tile, (err, { mesh }) => {
                    this._onMeshCreated(data, tile, err, mesh);
                });
            } else if (magic === 'cmpt') {
                this.painter.createCMPTMesh(data, tile.id, tile, (err, { mesh }) => {
                    this._onMeshCreated(data, tile, err, mesh);
                });
            }
            count++;
        }
    }

    _onMeshCreated(data, tile, err, mesh) {
        if (err) {
            this.onTileError(err, tile);
        } else {
            const size = this._getMeshSize(mesh);
            tile.memorySize = size;
            this.onTileLoad(data, tile);
        }
    }

    _getMeshSize(mesh) {
        let size = 0;
        if (Array.isArray(mesh)) {
            for (let i = 0; i < mesh.length; i++) {
                if (mesh[i]) {
                    size += this._getMeshSize(mesh[i]);
                }
            }
        } else if (mesh) {
            size += mesh.getMemorySize();
        }
        return size;
    }

    onTileLoad(b3dm, node) {
        if (!this.layer) {
            return;
        }
        delete this.tilesLoading[node.id];
        this.layer.onTileLoad(b3dm, node);
        this._addTileToCache(node);
        this.setToRedraw();
        /**
         * tileload event, fired when tile is loaded.
         *
         * @event Geo3DTilesLayer#tileload
         * @type {Object}
         * @property {String} type - tileload
         * @property {Geo3DTilesLayer} target - tile layer
         * @property {Object} node - 3d tile node
         */
        this.layer.fire('tileload', { node });
    }

    onTilesetLoad(tileset, parent, url) {
        if (!this.layer) {
            return;
        }
        this.layer._vertexCompressionType = tileset.extensions && tileset.extensions['s3m:VertexCompressionType'];
        if (tileset.capabilities || tileset.layers && tileset.layers[0] && tileset.layers[0].capabilities) {
            //如果是i3s scene layer，还要再次请求root node信息
            this._parseI3SSceneLayer(tileset, parent, url);
            return;
        }
        delete this.tilesLoading[parent.id];
        this.layer.onTilesetLoad(tileset, parent, url);
    }

    onTileError(err, node, errorUrl) {
        if (!this.layer) {
            return;
        }
        // debugger
        const url = errorUrl || node.content.url;

        const info = err && err.message || err;
        if ((!err || err.status !== 404 && err.status !== 204) && !REPORTED_ERRORS.has(info)) {
            console.warn('failed to load 3d tile: ' + url);
            console.warn(err);
            REPORTED_ERRORS.add(info);
        }


        // const emptyB3DM = gltf.B3DMLoader.createEmptyB3DM();
        // emptyB3DM.loadTime = 0;
        delete this.tilesLoading[node.id];
        if (!this.layer.options['onlyCacheNoContentTileWhenError'] || err && !maptalks.Util.isNoContentHttpCode(err.status)) {
            this._addErrorToCache(node, err);
        }
        this.setToRedraw();
        /**
         * tileerror event, fired when tile loading has error.
         *
         * @event Geo3DTilesLayer#tileerror
         * @type {Object}
         * @property {String} type - tileerror
         * @property {Geo3DTilesLayer} target - tile layer
         * @property {Object} node - 3d tile node
         * @property {Error} error - error message
         */
        this.layer.fire('tileerror', { node, error: err });
    }

    getCachedTile(id) {
        return this.tileCache.get(id);
    }

    getShadowMeshes() {
        if (!this.painter) {
            return;
        }
        const meshes = [];
        const b3dmMeshes = this.painter.getCurrentB3DMMeshes();

        for (const p in b3dmMeshes) {
            if (b3dmMeshes[p] && b3dmMeshes[p].isValid && b3dmMeshes[p].isValid()) {
                meshes.push(b3dmMeshes[p]);
            }
        }
        const i3dmMeshes = this.painter.getCurrentI3DMMeshes();
        for (const p in i3dmMeshes) {
            if (i3dmMeshes[p] && i3dmMeshes[p].isValid && i3dmMeshes[p].isValid()) {
                meshes.push(i3dmMeshes[p]);
            }
        }
        return meshes;
    }

    _addErrorToCache(node, err) {
        const tileData = {
            // image : data,
            loadTime : maptalks.Util.now(),
            current : true,
            error: err,
            node
        };
        tileData.renderer = this;
        this.tileCache.add(node.id, tileData);
    }

    _addTileToCache(node) {
        const tileData = {
            // image : data,
            loadTime : maptalks.Util.now(),
            current : true,
            node
        };
        tileData.renderer = this;
        this.tileCache.add(node.id, tileData);
    }

    abortTileLoading(tile) {
        if (!tile || !this.workerConn) return;
        const url = tile.node.content.url;
        this.workerConn.abortTileLoading(this.layer.getId(), url);
        delete this._requests[url];
    }

    _markTiles() {
        if (this.tilesLoading) {
            for (const p in this.tilesLoading) {
                this.tilesLoading[p].current = false;
            }
        }
    }

    deleteTile(tile) {
        this.painter.deleteTile(tile);
    }

    createContext() {
        const layer = this.layer;
        const attributes = layer.options.glOptions || {
            alpha: true,
            depth: true,
            stencil : true,
            preserveDrawingBuffer : true,
            antialias: layer.options.antialias,
        };
        const inGroup = this.canvas.gl && this.canvas.gl.wrap;
        if (inGroup) {
            this.gl = this.canvas.gl.wrap();
            this.regl = this.canvas.gl.regl;
        } else {
            this.glOptions = attributes;
            this.gl = this._createGLContext(this.canvas, attributes);
        }
        this.regl = this.regl || createREGL({
            gl : this.gl,
            attributes,
            extensions : [
                'OES_element_index_uint'
            ],
            optionalExtensions : layer.options['optionalExtensions'] || []
        });
        this.prepareWorker();
        if (inGroup) {
            this.canvas.pickingFBO = this.canvas.pickingFBO || this.regl.framebuffer(this.canvas.width, this.canvas.height);
        }
        this.pickingFBO = this.canvas.pickingFBO || this.regl.framebuffer(this.canvas.width, this.canvas.height);
        this.painter = new TileMeshPainter(this.regl, layer);

        this.layer._resumeHighlights();
        this.layer.fire('contextcreate', { regl: this.regl });
    }

    prepareWorker() {
        const map = this.getMap();
        if (!this.workerConn) {
            this.workerConn = new Geo3DTilesWorkerConnection('@maptalks/3dtiles', map.id, reshader.Util.supportNPOT(this.regl));
        }
        const workerConn = this.workerConn;
        //setTimeout in case layer's style is set to layer after layer's creating.
        if (!workerConn.isActive()) {
            return;
        }
        let options = this.layer.options || {};
        options = extend({}, options);
        delete options['offset'];
        const spatialReference = map.options.spatialReference;
        options.projection = spatialReference && spatialReference.coordType || spatialReference && spatialReference.projection || map.getSpatialReference().getProjection().code;
        const id = this.layer.getId();
        workerConn.addLayer(id, options, err => {
            if (err) throw err;
            if (!this.layer) return;
            this.ready = true;
            this.layer.fire('workerready');
        });
    }

    onRemove() {
        if (this.painter) {
            this.painter.remove();
        }
        if (this.pickingFBO) {
            if (!this.canvas.pickingFBO) {
                this.pickingFBO.destroy();
            }
            delete this.pickingFBO;
        }
        if (this.workerConn) {
            this.workerConn.removeLayer(this.layer.getId(), err => {
                if (err) throw err;
            });
            this.workerConn.remove();
            delete this.workerConn;
        }
        TileCacheRefCount--;
        if (!TileCacheRefCount) {
            GlobalTieCache.reset();
        }
        this.clear();
        delete this.tileCache;
        super.onRemove();
    }

    clear() {
        this._abortUnusedTiles(true);
        this.tileCache.reset(this);
        this.tilesLoading = {};
        super.clear();
    }

    clearCanvas() {
        if (this.regl) {
            this.regl.clear({
                color: [0, 0, 0, 0],
                depth: 1,
                stencil : 0
            });
        }

        super.clearCanvas();
    }

    getTileOpacity(/* tileData */) {
        return 1;
        // if (!this.layer.options['fadeAnimation'] || !tileData.loadTime) {
        //     return 1;
        // }
        // return Math.min(1, (maptalks.Util.now() - tileData.loadTime) / (1000 / 60 * 10));
    }

    getStencilValue() {
        return 0;
    }

    _abortUnusedTiles(force) {
        if (!this._preRetireTime) {
            this._preRetireTime = Date.now();
        }
        const now = Date.now();
        if (!force && now - this._preRetireTime < this.layer.options['retireInterval']) {
            return;
        }
        this._preRetireTime = now;
        const aborted = [];
        for (const i in this.tilesLoading) {
            const node = this.tilesLoading[i];
            if (force || !node.current) {
                aborted.push(i);
                // abort loading tiles
                this.abortTileLoading(node);
                // if (this.painter.has(node)) {
                //     this.painter.deleteTile(node);
                // }
            }
        }

        for (let i = 0; i < aborted.length; i++) {
            delete this.tilesLoading[aborted[i]];
        }
    }

    // limit tile number to load when map is interacting
    _getLoadLimit() {
        if (this.getMap().isInteracting()) {
            return this.layer.options['loadingLimitOnInteracting'];
        }
        return this.layer.options['loadingLimit'];
    }

    _createGLContext(canvas, options) {
        const names = ['webgl', 'experimental-webgl'];
        let context = null;
        /* eslint-disable no-empty */
        for (let i = 0; i < names.length; ++i) {
            try {
                context = canvas.getContext(names[i], options);
            } catch (e) {}
            if (context) {
                break;
            }
        }
        return context;
        /* eslint-enable no-empty */
    }

    _isLoadingTile(tileId) {
        return !!this.tilesLoading[tileId];
    }

    getI3DMMeshes() {
        return this.painter.getI3DMMeshes();
    }

    getPNTSMeshes() {
        return this.painter.getPNTSMeshes();
    }

    getB3DMMeshes() {
        return this.painter.getB3DMMeshes();
    }

    readBatchData(batch, bin, count) {
        return readBatchArray(batch, bin, 0, count);
    }

    _consumeI3SQueue() {
        if (!this._i3sRequests) {
            return;
        }
        const limit = this.layer.options['i3sNodepageLimitPerFrame'] || Number.MAX_VALUE;
        let count = 0;
        const promises = [];
        for (const url in this._i3sRequests) {
            const callbacks = this._i3sRequests[url];
            if (callbacks.status === 'pending') {
                continue;
            }
            callbacks.status = 'pending';
            const rootIdx = callbacks.rootIdx;
            const service = this.layer._getNodeService(rootIdx);
            const fetchOptions = prepareFetchOptions(service.fetchOptions);
            promises.push(Ajax.getJSON(url, fetchOptions).then(json => {
                delete this._i3sRequests[url];
                const nodeCache = this._i3sNodeCache[rootIdx];
                if (!nodeCache)  {
                    this.setToRedraw();
                    return;
                }
                if (json.nodes) {
                    // 1.7, 1.8
                    fillNodepagesToCache(nodeCache, json.nodes);
                } else {
                    // 1.6
                    nodeCache[json.id] = json;
                    fillNodepagesToCache(nodeCache, json.children);
                }

                for (let i = 0; i < callbacks.length; i++) {
                    callbacks[i]();
                }
                this.setToRedraw();
            }));
            count++;
            if (count >= limit) {
                break;
            }
        }
        if (promises.length) {
            Promise.all(promises);
        }
    }

    _fetchI3DNodepages(rootIdx, url, cb) {
        if (!this._i3sRequests) {
            this._i3sRequests = {};
        }
        this._i3sRequests[url] = this._i3sRequests[url] || [];
        this._i3sRequests[url].rootIdx = rootIdx;
        this._i3sRequests[url].push(cb);
        this.setToRedraw();
    }

    _parseI3SSceneLayer(tileset, parent, url) {
        if (!this._i3sNodeCache) {
            this._i3sNodeCache = [];
        }
        const rootIdx = parent._rootIdx;
        if (!this._i3sNodeCache[rootIdx]) {
            this._i3sNodeCache[rootIdx] = {};
        }
        const nodeCache = this._i3sNodeCache[rootIdx];
        const service = this.layer._getNodeService(rootIdx);
        if (tileset.layers) {
            tileset = tileset.layers[0];
            if (url[url.length - 1] !== '/') {
                url += '/';
            }
            url = url + 'layers/0'
        }
        nodeCache.version = +(service.i3sVersion || tileset.store.version);
        if (tileset.spatialReference && (!tileset.spatialReference.wkid || tileset.spatialReference.wkid !== 4326)) {
            console.warn('i3s has a spatialReference other than 4326.', tileset.spatialReference);
        }
        nodeCache.projection = tileset.spatialReference;
        parseI3SJSON(this.layer, tileset, rootIdx, service, url, nodeCache, this._fnFetchNodepages).then(json => {
            this.onTilesetLoad(json, parent, url);
        });
    }

    pick(x, y, options) {
        if (!this.painter) {
            return [];
        }
        const pickingFBO = this.pickingFBO;
        const { width, height } = this.canvas;
        if (this.pickingFBO && (pickingFBO.width !== width || pickingFBO.height !== height)) {
            pickingFBO.resize(width, height);
        }
        return this.painter.pick(x, y, options && options.tolerance);
    }

    highlight(highlights) {
        if (!this._highlighted) {
            this._highlighted = [];
        }
        if (Array.isArray(highlights)) {
            for (let i = 0; i < highlights.length; i++) {
                const service = highlights[i].service || 0;
                let serviceHighs = this._highlighted[service];
                if (!serviceHighs) {
                    serviceHighs = this._highlighted[service] = new Map();
                }
                serviceHighs.set(highlights[i].id, highlights[i]);
            }
        } else {
            const service = highlights.service || 0;
            let serviceHighs = this._highlighted[service];
            if (!serviceHighs) {
                serviceHighs = this._highlighted[service] = new Map();
            }
            serviceHighs.set(highlights.id, highlights);
        }

        this.painter.highlight(this._highlighted);
    }

    cancelHighlight(service, ids) {
        if (!this._highlighted) {
            return;
        }
        const serviceHighs = this._highlighted[service];
        if (!serviceHighs) {
            return;
        }
        if (Array.isArray(ids)) {
            for (let i = 0; i < ids.length; i++) {
                serviceHighs.delete(ids[i]);
            }
        } else {
            serviceHighs.delete(ids);
        }
        if (!serviceHighs.size) {
            this._highlighted[service] = null;
        }
        this.painter.highlight(this._highlighted);
    }

    cancelAllHighlight() {
        delete this._highlighted;
        this.painter.cancelAllHighlight();
    }

    showOnly(items) {
        if (!this._showOnlys) {
            this._showOnlys = [];
        }
        if (Array.isArray(items)) {
            for (let i = 0; i < items.length; i++) {
                const service = items[i].service || 0;
                let serviceShowOnlys = this._showOnlys[service];
                if (!serviceShowOnlys) {
                    serviceShowOnlys = this._showOnlys[service] = new Map();
                }
                serviceShowOnlys.set(items[i].id, items[i]);
            }
        } else {
            const service = items.service || 0;
            let serviceShowOnlys = this._showOnlys[service];
            if (!serviceShowOnlys) {
                serviceShowOnlys = this._showOnlys[service] = new Map();
            }
            serviceShowOnlys.set(items.id, items);
        }

        this.painter.showOnly(this._showOnlys);
    }

    cancelShowOnly() {
        delete this._showOnlys;
        this.painter.cancelShowOnly();
    }

    _getCurrentBatchIDs() {
        if (!this.painter) {
            return [];
        }
        return this.painter._getCurrentBatchIDs();
    }

    _tileCoordToLngLat(out, position) {
        const map = this.getMap();
        const code = map.getProjection().code.toLowerCase();
        if (code === 'identity') {
            const projection = this._getCoordProjection();
            COORD_IN.set(position[0], position[1]);
            projection.unproject(COORD_IN, COORD_OUT);
            out[0] = COORD_OUT.x;
            out[1] = COORD_OUT.y;
            return out;
        } else {
            COORD_IN.set(position[0], position[1]);
            map.getProjection().unproject(COORD_IN, COORD_OUT);
            out[0] = COORD_OUT.x;
            out[1] = COORD_OUT.y;
            return out;
        }
    }

    _lngLatToIdentityCoord(out, position) {
        const projection = this._getCoordProjection();
        COORD_IN.set(position[0], position[1]);
        projection.project(COORD_IN, COORD_OUT);
        out[0] = COORD_OUT.x;
        out[1] = COORD_OUT.y;
        return out;
    }

    _identityCoordToLngLat(out, coord) {
        const projection = this._getCoordProjection();
        COORD_IN.set(coord[0], coord[1]);
        projection.unproject(COORD_IN, COORD_OUT);
        out[0] = COORD_OUT.x;
        out[1] = COORD_OUT.y;
        return out;
    }

    _getCoordProjection() {
        const map = this.getMap();
        const coordType = map.options.spatialReference.coordType;
        if (!coordType) {
            throw new Error('Missing coordType in map spatialReference.');
        }
        if (!this._centerProjection) {
            this._centerProjection = maptalks.SpatialReference.getProjectionInstance(coordType);
        }
        return this._centerProjection;
    }
}

// function compareTile(a, b) {
//     return b.node._cameraDistance - a.node._cameraDistance;
// }

function compareRequests(a, b) {
    return a._cameraDistance - b._cameraDistance;
}


function encodeSuperMapURI(url, baseUrl) {
    const uriComponent = url.substring(baseUrl.length);
    const parts = uriComponent.split('/');
    const encoded = [];
    for (let i = 0; i < parts.length; i++) {
        encoded.push(encodeURIComponent(parts[i]));
    }
    return baseUrl + encoded.join('/');
}
