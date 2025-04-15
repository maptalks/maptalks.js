/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    isNil,
    loadImage,
    emptyImageUrl,
    now,
    isFunction,
    getImageBitMap,
    isString,
    getAbsoluteURL,
    pushIn,
    mergeArray
} from '../../../core/util';
import Browser from '../../../core/Browser';
import { default as TileLayer } from '../../../layer/tile/TileLayer';
import WMSTileLayer from '../../../layer/tile/WMSTileLayer';
import LayerAbstractRenderer from '../LayerAbstractRenderer';
import Point from '../../../geo/Point';
import Extent from '../../../geo/Extent';
import LRUCache from '../../../core/util/LRUCache';
import Canvas from '../../../core/Canvas';
import Actor from '../../../core/worker/Actor';
import { imageFetchWorkerKey } from '../../../core/worker/CoreWorkers';
import { TileImageBuffer, TileImageTexture } from '../../types';
import type { WithUndef } from '../../../types/typings';
import { MixinConstructor } from '../../../core/Mixin';


const TEMP_POINT1 = new Point(0, 0);
const TEMP_POINT2 = new Point(0, 0);

const EMPTY_ARRAY = [];
class TileWorkerConnection extends Actor {
    constructor() {
        super(imageFetchWorkerKey);
    }

    checkUrl(url: string) {
        if (!url || !isString(url)) {
            return url;
        }
        //The URL is processed. Here, only the relative protocol is processed
        return getAbsoluteURL(url);

    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    fetchImage(url: string, workerId: number, cb: Function, fetchOptions: any) {
        url = this.checkUrl(url);
        const data = {
            url,
            fetchOptions
        };
        this.send(data, EMPTY_ARRAY, cb, workerId);
    }
}

/**
 * 瓦片图层的渲染器抽象类，实现瓦片的遍历功能，可以继承并实现 drawTile 等方法来实现瓦片图层渲染
 *
 * @english
 * Abstract renderer class for TileLayers in maptalks-gl
 * @class
 * @protected
 * @group renderer
 * @extends {renderer.LayerAbstractRenderer}
 */
const TileLayerRenderable = function <T extends MixinConstructor>(Base: T) {
    const renderable = class extends Base {
        [x: string]: any;
        tilesInView: TilesInViewType;
        tilesLoading: { [key: string]: any };
        //@internal
        _parentTiles: any[];
        //@internal
        _childTiles: any[];
        //@internal
        _tileZoom: number;
        //@internal
        _tileQueue: {
            tileInfo: any;
            tileData: any;
        }[];
        //@internal
        _tileQueueIds: Set<LayerId>;
        tileCache: LRUCache;
        //@internal
        _compareTiles: any;
        //@internal
        _tileImageWorkerConn: TileWorkerConnection;
        //@internal
        _renderTimestamp: number;
        //@internal
        _frameTiles: {
            empty: boolean;
            timestamp: number;
        };

        //@internal
        _terrainHelper: TerrainHelper;
        //@internal
        _tilePlaceHolder: any;
        //@internal
        _frameTileGrids: TileGrids;

        drawingCurrentTiles: WithUndef<boolean>;
        drawingChildTiles: WithUndef<boolean>;
        drawingParentTiles: WithUndef<boolean>;
        avgMinAltitude: number;
        avgMaxAltitude: number;

        init() {
            this.tilesInView = {};
            this.tilesLoading = {};
            this._parentTiles = [];
            this._childTiles = [];
            this._tileQueue = [];
            this._tileQueueIds = new Set();
            const tileSize = this.layer.getTileSize().width;
            this.tileCache = new LRUCache(this.layer.options['maxCacheSize'] * tileSize / 512 * tileSize / 512, (tile: Tile) => {
                this.deleteTile(tile);
            });
            if (Browser.decodeImageInWorker && this.layer.options['decodeImageInWorker'] && (this.layer.options['renderer'] === 'gl' || !Browser.safari && !Browser.iosWeixin)) {
                this._tileImageWorkerConn = new TileWorkerConnection();
            }
            this._compareTiles = compareTiles.bind(this);
        }


        getCurrentTileZoom(): number {
            return this._tileZoom;
        }

        draw(timestamp: number, context): number {
            const map = this.getMap();
            if ((this as any).isDrawable && !(this as any).isDrawable()) {
                return;
            }
            const mask2DExtent = this.prepareCanvas();
            if (mask2DExtent) {
                if (!mask2DExtent.intersects(this.canvasExtent2D)) {
                    this.completeRender();
                    return;
                }
            }

            if (this._renderTimestamp !== timestamp) {
                // maptalks/issues#10
                // 如果consumeTileQueue方法在每个renderMode都会调用，但多边形只在fxaa mode下才会绘制。
                // 导致可能出现consumeTileQueue在fxaa阶段后调用，之后的阶段就不再绘制。
                // 改为consumeTileQueue只在finalRender时调用即解决问题
                this._consumeTileQueue();
                this._computeAvgTileAltitude();
                this._renderTimestamp = timestamp;
            }


            let currentTiles;
            let hasFreshTiles = false;
            const frameTiles = this._frameTiles;
            if (frameTiles && timestamp === frameTiles.timestamp) {
                if (frameTiles.empty) {
                    return;
                }
                currentTiles = frameTiles;
            } else {
                currentTiles = this._getTilesInCurrentFrame();
                if (!currentTiles) {
                    this._frameTiles = { empty: true, timestamp };
                    this.completeRender();
                    return;
                }
                hasFreshTiles = true;
                this._frameTiles = currentTiles;
                this._frameTiles.timestamp = timestamp;
                if (currentTiles.loadingCount) {
                    this.loadTileQueue(currentTiles.tileQueue);
                }
            }
            const { tiles, childTiles, parentTiles, placeholders, loading, loadingCount, missedTiles, incompleteTiles } = currentTiles;

            this._drawTiles(tiles, parentTiles, childTiles, placeholders, context, missedTiles, incompleteTiles);
            if (!loadingCount) {
                if (!loading) {
                    //redraw to remove parent tiles if any left in last paint
                    if (!map.isAnimating() && (this._parentTiles.length || this._childTiles.length)) {
                        this._parentTiles = [];
                        this._childTiles = [];
                        this.setToRedraw();
                    }
                    this.completeRender();
                }
            }
            if (hasFreshTiles) {
                this.retireTiles();
            }
        }

        getTileGridsInCurrentFrame(): TileGrids {
            return this._frameTileGrids;
        }

        getCurrentTimestamp(): number {
            return this._renderTimestamp || 0;
        }

        //@internal
        _getTilesInCurrentFrame() {
            const map = this.getMap();
            this.map = map;
            const layer = this.layer;
            /**
             * record spatial reference of current frame to avoid A large number of function(getSpatialReference) calls
             * 瓦片计算里会用到大量的 getSpatialReference 调用，这里记录当前帧的空间参考，避免重复调用
             * 其他的大量的重复函数调用,也可以采用类似的策略来提高性能
             */
            layer._spatialRef = layer.getSpatialReference();
            const terrainTileMode = layer._isPyramidMode() && layer.options['terrainTileMode'];
            let tileGrids = layer.getTiles();
            this._frameTileGrids = tileGrids;
            tileGrids = tileGrids.tileGrids;
            if (!tileGrids || !tileGrids.length) {
                layer._spatialRef = null;
                this.map = null;
                return null;
            }
            const count = tileGrids.reduce((acc, curr) => acc + (curr && curr.tiles && curr.tiles.length || 0), 0);
            if (count >= (this.tileCache.max / 2)) {
                this.tileCache.setMaxSize(count * 2 + 1);
            }
            let loadingCount = 0;
            let loading = false;
            const checkedTiles = {};
            const tiles = [],
                parentTiles = [], parentKeys = {},
                childTiles = [], childKeys = {},
                placeholders = [], placeholderKeys = {};
            //visit all the tiles
            const tileQueue = {};
            const preLoadingCount = this.markTiles();
            const loadingLimit = this._getLoadLimit();

            const l = tileGrids.length;
            // !this._terrainHelper can't be deleted as parent tiles are part of terrain skin, maptalks/issues#608
            const isFirstRender = this._tileZoom === undefined && layer.options['currentTilesFirst'] && !this._terrainHelper;
            // main tile grid is the last one (draws on top)
            this._tileZoom = tileGrids[0]['zoom'];

            // let dirtyParentTiles = null;
            let missingTiles = null;
            let incompleteTiles = null;
            if (terrainTileMode) {
                // dirtyParentTiles = new Set();
                missingTiles = [];
                incompleteTiles = new Map();
            }

            for (let i = 0; i < l; i++) {
                const tileGrid = tileGrids[i];
                const gridTiles = tileGrid['tiles'];
                const parents = tileGrid['parents'] || EMPTY_ARRAY;
                const parentCount = parents.length;
                // const allTiles = isFirstRender ? gridTiles : parents.concat(gridTiles);
                const allTiles = isFirstRender ? gridTiles : mergeArray(parents, gridTiles);

                let placeholder;
                if (allTiles.length) {
                    placeholder = this._generatePlaceHolder(allTiles[0].res);
                }

                for (let j = 0, l = allTiles.length; j < l; j++) {
                    const tile = allTiles[j];
                    const tileId = tile.id;
                    const isParentTile = !isFirstRender && j < parentCount;
                    //load tile in cache at first if it has.
                    let tileLoading = false;
                    const tilesCount = tiles.length;
                    if (this._isLoadingTile(tileId)) {
                        tileLoading = loading = true;
                        this.markCurrent(this.tilesLoading[tileId], true);
                    } else {
                        const cached = this.getCachedTile(tile, isParentTile);
                        if (cached) {
                            if (!isParentTile) {
                                if (cached.image && this.isTileFadingIn(cached.image)) {
                                    tileLoading = loading = true;
                                    this.setToRedraw();
                                }

                                if (this.isTileComplete(cached)) {
                                    tiles.push(cached);
                                } else {
                                    tileLoading = true;
                                    if (terrainTileMode) {
                                        incompleteTiles.set(tileId, cached);
                                    }
                                }
                            }
                        } else {
                            tileLoading = loading = true;
                            const hitLimit = loadingLimit && (loadingCount + preLoadingCount[0]) > loadingLimit;
                            if (!this._tileQueueIds.has(tile.id) && !hitLimit && (!map.isInteracting() || (map.isMoving() || map.isRotating()))) {
                                loadingCount++;
                                const key = tileId;
                                tileQueue[key] = tile;
                            }
                        }
                    }

                    if (terrainTileMode && !isParentTile) {
                        if (tiles.length === tilesCount) {
                            missingTiles.push(tile);
                        } else {
                            checkedTiles[tile.id] = 1;
                            // if (tile.parent) {
                            //     dirtyParentTiles.add(tile.parent);
                            // }
                        }
                    }

                    if (terrainTileMode) continue;
                    if (isParentTile) continue;
                    if (!tileLoading) continue;
                    if (checkedTiles[tileId]) continue;

                    checkedTiles[tileId] = 1;
                    if (placeholder && !placeholderKeys[tileId]) {
                        //tell gl renderer not to bind gl buffer with image
                        tile.cache = false;
                        placeholders.push({
                            image: placeholder,
                            info: tile
                        });

                        placeholderKeys[tileId] = 1;
                    }

                    const children = this._findChildTiles(tile);
                    if (children.length) {
                        children.forEach(c => {
                            if (!childKeys[c.info.id]) {
                                childTiles.push(c);
                                childKeys[c.info.id] = 1;
                            }
                        });
                    }
                    // (children.length !== 4) means it's not complete, we still need a parent tile
                    if (!children.length || children.length !== 4) {
                        const parentTile = this._findParentTile(tile);
                        if (parentTile) {
                            const parentId = parentTile.info.id;
                            if (parentKeys[parentId] === undefined) {
                                parentKeys[parentId] = parentTiles.length;
                                parentTiles.push(parentTile);
                            }/* else {
                                //replace with parentTile of above tiles
                                parentTiles[parentKeys[parentId]] = parentTile;
                            } */
                        }
                    }
                }
            }

            // 遍历 missingTiles ，
            const missedTiles = [];
            if (terrainTileMode) {
                for (let i = 0; i < missingTiles.length; i++) {
                    const tile = missingTiles[i].info ? missingTiles[i].info : missingTiles[i];
                    if (!tile.parent || checkedTiles[tile.id]) {
                        continue;
                    }

                    const { tiles: children, missedTiles: childMissedTiles } = this._findChildTiles(tile);
                    if (children.length) {
                        pushIn(tiles, children);
                        pushIn(missedTiles, childMissedTiles);
                        continue;
                    } else if (incompleteTiles.has(tile.id)) {
                        tiles.push(incompleteTiles.get(tile.id));
                        incompleteTiles.delete(tile.id);
                        continue;
                    }

                    checkedTiles[tile.id] = 1;
                    missedTiles.push(tile);
                    // continue;

                    // // 以下是瓦片合并的优化，但一方面优化效果并不明显，且让渲染逻辑变得复杂，故暂时放弃
                    // if (dirtyParentTiles.has(tile.parent) || tile.z < this._tileZoom) {
                    //     // 如果sibling tile已经被加载过，或者是远处的上级瓦片，则直接加入missedTiles
                    //     checkedTiles[tile.id] = 1;
                    //     missedTiles.push(tile);
                    // } else {
                    //     // 遍历当前级别瓦片，如果四个sibling tile都没有加载，则把parentTile加入到missedTiles，减少要处理的瓦片数量
                    //     let parentTile = parentKeys[tile.parent];
                    //     if (parentTile || parentTile === null) {
                    //         // parentTile已被处理过
                    //         // 1. parentTile存在，则parentTile已经被加入到missedTile，作为parentTile的儿子瓦片的tile可以忽略
                    //         // 2. parentTile不存在，则把当前瓦片加入到missedTile
                    //         if (parentTile === null) {
                    //             checkedTiles[tile.id] = 1;
                    //             missedTiles.push(tile);
                    //         }
                    //         continue;
                    //     }
                    //     // 只查询上一级的parentTile
                    //     parentTile = this._findParentTile(tile, 1) || undefined;
                    //     if (parentTile && parentTile.image) {
                    //         // 父级瓦片存在，则把parentTile放入到tiles列表直接绘制
                    //         tiles.push(parentTile);
                    //         parentKeys[tile.parent] = parentTile;
                    //     } else {
                    //         const parentTileInfo = layer.tileInfoCache.get(tile.parent);
                    //         // 根据parentTileInfo是否存在，选择把parentTileInfo或者tile加入到missedTiles
                    //         if (parentTileInfo) {
                    //             if (!checkedTiles[parentTileInfo.id]) {
                    //                 checkedTiles[parentTileInfo.id] = 1;
                    //                 missedTiles.push(parentTileInfo);
                    //             }
                    //             parentKeys[tile.parent] = parentTileInfo;
                    //         } else {
                    //             checkedTiles[tile.id] = 1;
                    //             missedTiles.push(tile);
                    //             parentKeys[tile.parent] = null;
                    //         }
                    //     }
                    // }
                }
            }

            this.tileCache.shrink();

            // if (parentTiles.length) {
            //     childTiles.length = 0;
            //     this._childTiles.length = 0;
            // }
            layer._spatialRef = null;
            this.map = null;
            return {
                childTiles, missedTiles, parentTiles, tiles, incompleteTiles: incompleteTiles && Array.from(incompleteTiles.values()), placeholders, loading, loadingCount, tileQueue
            };
        }

        removeTileCache(tileId: TileId) {
            delete this.tilesInView[tileId];
            this.tileCache.remove(tileId);
        }

        isTileCachedOrLoading(tileId: TileId) {
            return this.tileCache.get(tileId) || this.tilesInView[tileId] || this.tilesLoading[tileId];
        }

        isTileCached(tileId: TileId) {
            return !!(this.tileCache.get(tileId) || this.tilesInView[tileId]);
        }

        isTileFadingIn(tileImage: Tile['image']) {
            return this.getTileFadingOpacity(tileImage) < 1;
        }

        //@internal
        _drawTiles(tiles, parentTiles, childTiles, placeholders, parentContext, missedTiles, incompleteTiles) {
            if (parentTiles.length) {
                //closer the latter (to draw on top)
                // parentTiles.sort((t1, t2) => Math.abs(t2.info.z - this._tileZoom) - Math.abs(t1.info.z - this._tileZoom));
                parentTiles.sort(this._compareTiles);
                this._parentTiles = parentTiles;
            }
            if (childTiles.length) {
                this._childTiles = childTiles;
                this._childTiles.sort(this._compareTiles);
            }

            let drawBackground = true;
            const backgroundTimestamp = this.canvas._parentTileTimestamp;
            if (this.layer.constructor === TileLayer || this.layer.constructor === WMSTileLayer) {
                // background tiles are only painted once for TileLayer and WMSTileLayer per frame.
                if (this._renderTimestamp === backgroundTimestamp) {
                    drawBackground = false;
                } else {
                    this.canvas._parentTileTimestamp = this._renderTimestamp;
                }
            }

            const context = { tiles, parentTiles: this._parentTiles, childTiles: this._childTiles, parentContext };
            this.onDrawTileStart(context, parentContext);

            if (drawBackground && this.layer.options['opacity'] === 1) {
                this.layer._silentConfig = true;
                const fadingAnimation = this.layer.options['fadeAnimation'];
                this.layer.options['fadeAnimation'] = false;

                this._drawChildTiles(childTiles, parentContext);
                this._drawParentTiles(this._parentTiles, parentContext);

                this.layer.options['fadeAnimation'] = fadingAnimation;
                this.layer._silentConfig = false;
            }

            this.drawingCurrentTiles = true;
            tiles.sort(this._compareTiles);
            for (let i = 0, l = tiles.length; i < l; i++) {
                this._drawTileAndCache(tiles[i], parentContext);
            }
            delete this.drawingCurrentTiles;

            if (drawBackground && this.layer.options['opacity'] < 1) {
                this.layer._silentConfig = true;
                const fadingAnimation = this.layer.options['fadeAnimation'];
                this.layer.options['fadeAnimation'] = false;

                this._drawChildTiles(childTiles, parentContext);
                this._drawParentTiles(this._parentTiles, parentContext);

                this.layer.options['fadeAnimation'] = fadingAnimation;
                this.layer._silentConfig = false;
            }

            // placeholders.forEach(t => this._drawTile(t.info, t.image, parentContext));

            this.onDrawTileEnd(context, parentContext);

        }

        //@internal
        _drawChildTiles(childTiles, parentContext) {
            // _hasOwnSR 时，瓦片之间会有重叠，会产生z-fighting，所以背景瓦片要后绘制
            this.drawingChildTiles = true;
            childTiles.forEach(t => this._drawTile(t.info, t.image, parentContext));
            delete this.drawingChildTiles;
        }

        //@internal
        _drawParentTiles(parentTiles, parentContext) {
            this.drawingParentTiles = true;
            parentTiles.forEach(t => this._drawTile(t.info, t.image, parentContext));
            delete this.drawingParentTiles;
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onDrawTileStart(context: RenderContext, parentContext: RenderContext) { }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onDrawTileEnd(context: RenderContext, parentContext: RenderContext) { }

        //@internal
        _drawTile(info, image, parentContext) {
            if (image) {
                this.drawTile(info, image, parentContext);
            }
        }

        drawTile(tileInfo: Tile['info'], tileImage: Tile['image'], parentContext?: RenderContext) {
        }

        //@internal
        _drawTileAndCache(tile: Tile, parentContext) {
            if (this.isValidCachedTile(tile)) {
                this.tilesInView[tile.info.id] = tile;
            }
            this._drawTile(tile.info, tile.image, parentContext);
        }

        drawOnInteracting(event: any, timestamp: number, context) {
            this.draw(timestamp, context);
        }

        checkIfNeedRedraw(): boolean {
            return !!this._tileQueue.length;
        }

        hitDetect(): boolean {
            return false;
        }

        /**
         * @private
         * limit tile number to load when map is interacting
         */
        //@internal
        _getLoadLimit(): number {
            const map = this.map || this.getMap();
            if (map.isInteracting()) {
                return this.layer.options['loadingLimitOnInteracting'];
            }
            return this.layer.options['loadingLimit'] || 0;
        }

        //@internal
        _isLoadingTile(tileId: TileId): boolean {
            return !!this.tilesLoading[tileId];
        }

        loadTileQueue(tileQueue): void {
            for (const p in tileQueue) {
                if (tileQueue.hasOwnProperty(p)) {
                    const tile = tileQueue[p];
                    const tileImage = this.loadTile(tile);
                    if (tileImage.loadTime === undefined) {
                        // tile image's loading may not be async
                        this.tilesLoading[tile['id']] = {
                            image: tileImage,
                            current: true,
                            info: tile
                        };
                    }
                }
            }
        }

        loadTile(tile: Tile['info']): Tile['image'] {
            let tileImage = {} as Tile['image'];
            // fixme: 无相关定义，是否实现？
            if (this.loadTileBitmap) {
                const onLoad = (bitmap) => {
                    this.onTileLoad(bitmap, tile);
                };
                const onError = (error, image) => {
                    this.onTileError(image, tile, error);
                };
                this.loadTileBitmap(tile['url'], tile, onLoad, onError);
            } else if (this._tileImageWorkerConn && this.loadTileImage === this.constructor.prototype.loadTileImage) {
                this._fetchImage(tileImage, tile);
            } else {
                const tileSize = this.layer.getTileSize(tile.layer);
                tileImage = new Image() as Tile['image'];

                // @ts-expect-error todo
                tileImage.width = tileSize['width'];
                // @ts-expect-error todo
                tileImage.height = tileSize['height'];

                (tileImage as any).onload = this.onTileLoad.bind(this, tileImage, tile);
                (tileImage as any).onerror = this.onTileError.bind(this, tileImage, tile);

                this.loadTileImage(tileImage, tile['url'], tile);
            }
            return tileImage;
        }

        //@internal
        _fetchImage(image: any, tile: Tile['info']) {
            if (image instanceof Image) {
                image.src = tile.url;
            } else {
                const { x, y } = tile;
                const workerId = Math.abs(x + y) % this._tileImageWorkerConn.workers.length;
                this._tileImageWorkerConn.fetchImage(tile.url, workerId, (err, data) => {
                    if (err) {
                        this.onTileError(image, tile, err);
                    } else {
                        getImageBitMap(data, (bitmap: Tile['image']) => {
                            this.onTileLoad(bitmap, tile);
                        });
                    }
                }, this.layer.options['fetchOptions'] || {
                    referrer: document.location.href,
                    headers: { accept: 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8' }
                });
            }
        }

        loadTileImage(tileImage, url: string, tile: Tile['info']) {
            const crossOrigin = this.layer.options['crossOrigin'];
            if (!isNil(crossOrigin)) {
                tileImage.crossOrigin = crossOrigin;
            }
            return loadImage(tileImage, [url]);
        }

        abortTileLoading(tileImage: Tile['image'], tileInfo: Tile['info']): void {
            if (tileInfo && tileInfo.id !== undefined) {
                this.removeTileLoading(tileInfo);
            }
            if (!tileImage) return;
            if (tileImage instanceof Image) {
                tileImage.onload = falseFn;
                tileImage.onerror = falseFn;
                tileImage.src = emptyImageUrl;
            }
        }

        onTileLoad(tileImage: Tile['image'], tileInfo: Tile['info']): void {
            this.removeTileLoading(tileInfo);
            this._tileQueue.push({ tileInfo: tileInfo, tileData: tileImage });
            this._tileQueueIds.add(tileInfo.id);
            this.setToRedraw();
        }

        removeTileLoading(tileInfo: Tile['info']): void {
            delete this.tilesLoading[tileInfo.id];
            // need to setToRedraw to let tiles blocked by loadingLimit continue to load
            this.setToRedraw();
        }

        //@internal
        _consumeTileQueue(): void {
            let count = 0;
            const limit = this.layer.options['tileLimitPerFrame'];
            const queue = this._tileQueue;
            /* eslint-disable no-unmodified-loop-condition */
            while (queue.length && (limit <= 0 || count < limit)) {
                const { tileData, tileInfo } = queue.shift();
                if (!this._tileQueueIds.has(tileInfo.id)) {
                    continue;
                }
                this._tileQueueIds.delete(tileInfo.id);
                if (!this.checkTileInQueue(tileData, tileInfo)) {
                    continue;
                }
                this.consumeTile(tileData, tileInfo);
                count++;
            }
            /* eslint-enable no-unmodified-loop-condition */
        }

        //@internal
        _computeAvgTileAltitude() {
            let sumMin = 0;
            let sumMax = 0;
            let count = 0;
            for (const p in this.tilesInView) {
                const info = this.tilesInView[p] && this.tilesInView[p].info;
                if (info) {
                    sumMin += info.minAltitude || 0;
                    sumMax += info.maxAltitude || 0;
                    count++;
                }
            }
            this.avgMinAltitude = sumMin / count;
            this.avgMaxAltitude = sumMax / count;
        }

        // Parameters tileImage and tileInfo are required in VectorTileLayerRenderer
        checkTileInQueue(tileImage: Tile['image'], tileInfo: Tile['info']): boolean {
            return true;
        }

        consumeTile(tileImage: Tile['image'], tileInfo: Tile['info']): void {
            if (!this.layer) {
                return;
            }
            if (!this.tilesInView) {
                // removed
                return;
            }
            const e = { tile: tileInfo, tileImage: tileImage };
            // let user update tileImage in listener if needed
            tileImage = e.tileImage;
            this.resetTileLoadTime(tileImage);
            this.removeTileLoading(tileInfo);
            this._addTileToCache(tileInfo, tileImage);
            /**
             * tileload event, fired when tile is loaded.
             *
             * @event TileLayer#tileload
             * @type {Object}
             * @property {String} type - tileload
             * @property {TileLayer} target - tile layer
             * @property {Object} tileInfo - tile info
             * @property {Image} tileImage - tile image
             */
            this.layer.fire('tileload', e);
            this.setToRedraw();
        }

        resetTileLoadTime(tileImage: Tile['image']): void {
            // loadTime = 0 means a tile from onTileError
            if (tileImage.loadTime !== 0) {
                tileImage.loadTime = now();
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onTileError(tileImage: Tile['image'], tileInfo: Tile['info'], error?: any) {
            if (!this.layer) {
                return;
            }
            // example:
            /* reloadErrorTileFunction: (layer, renderer, tileInfo, tileImage) => {
                const url = tileInfo.url;
                // check if need to reload, e.g. server return 500 status code temporarily
                if (needReload) {
                renderer.loadTile(tileInfo, tileImage);
                }
            } */
            const reloadErrorTileFunction = this.layer.options['reloadErrorTileFunction'];
            if (reloadErrorTileFunction) {
                reloadErrorTileFunction.call(this, this.layer, this, tileInfo, tileImage);
                return;
            }
            // tileImage.onerrorTick = tileImage.onerrorTick || 0;
            // const tileRetryCount = this.layer.options['tileRetryCount'];
            // if (tileRetryCount > tileImage.onerrorTick) {
            //     tileImage.onerrorTick++;
            //     this._fetchImage(tileImage, tileInfo);
            //     this.removeTileLoading(tileInfo);
            //     return;
            // }
            const errorUrl = this.layer.options['errorUrl'];
            if (errorUrl) {
                if ((tileImage instanceof Image) && tileImage.src !== errorUrl) {
                    tileImage.src = errorUrl;
                    this.removeTileLoading(tileInfo);
                    return;
                } else {
                    tileImage = new Image() as any;
                    (tileImage as HTMLImageElement).src = errorUrl;
                }
            }
            this.abortTileLoading(tileImage, tileInfo);

            tileImage.loadTime = 0;
            this.removeTileLoading(tileInfo);
            this._addTileToCache(tileInfo, tileImage);
            this.setToRedraw();
            /**
             * tileerror event, fired when tile loading has error.
             *
             * @event TileLayer#tileerror
             * @type {Object}
             * @property {String} type - tileerror
             * @property {TileLayer} target - tile layer
             * @property {Object} tileInfo - tile info
             */
            this.layer.fire('tileerror', { tile: tileInfo });
        }

        getDebugInfo(tileId: TileId): string {
            const xyz = tileId.split('_');
            const length = xyz.length;
            return xyz[length - 3] + '/' + xyz[length - 2] + '/' + xyz[length - 1];
        }

        findChildTiles(info: Tile['info']) {
            return this._findChildTiles(info);
        }

        //@internal
        _findChildTiles(info: Tile['info']): Tile[] | any {
            const layer = this._getLayerOfTile(info.layer);
            const isPyramidMode = layer._isPyramidMode();
            const terrainTileMode = layer && layer.options['terrainTileMode'] && isPyramidMode;
            if (!layer || !layer.options['background'] && !terrainTileMode || info.z > this.layer.getMaxZoom()) {
                return EMPTY_ARRAY;
            }
            const map = this.map || this.getMap();
            const children = [];
            if (isPyramidMode) {
                if (!terrainTileMode) {
                    // a faster one
                    // const layer = this._getLayerOfTile(info.layer);
                    const zoomDiff = 2;
                    const cx = info.x * 2;
                    const cy = info.y * 2;
                    const cz = info.z + 1;
                    const queue = [];
                    for (let j = 0; j < 2; j++) {
                        for (let jj = 0; jj < 2; jj++) {
                            queue.push(cx + j, cy + jj, cz);
                        }
                    }
                    while (queue.length) {
                        const z = queue.pop();
                        const y = queue.pop();
                        const x = queue.pop();
                        const id = layer._getTileId(x, y, z, info.layer);
                        const canVisit = z + 1 <= info.z + zoomDiff;
                        const tile = this.tileCache.getAndRemove(id);
                        if (tile) {
                            if (this.isValidCachedTile(tile)) {
                                children.push(tile);
                                this.tileCache.add(id, tile);
                            } else if (canVisit) {
                                for (let j = 0; j < 2; j++) {
                                    for (let jj = 0; jj < 2; jj++) {
                                        queue.push(x * 2 + j, y * 2 + jj, z + 1);
                                    }
                                }
                            }
                        } else if (canVisit) {
                            for (let j = 0; j < 2; j++) {
                                for (let jj = 0; jj < 2; jj++) {
                                    queue.push(x * 2 + j, y * 2 + jj, z + 1);
                                }
                            }
                        }
                    }
                    return children;
                }
                let missedTiles;
                if (terrainTileMode) {
                    missedTiles = [];
                }
                // const zoomDiff = 2;
                const cx = info.x * 2;
                const cy = info.y * 2;
                const cz = info.z + 1;
                // const queue = [];
                // for the sake of performance, we only traverse next 2 levels of children tiles
                const candidates = [];
                for (let i = 0; i < 2; i++) {
                    for (let ii = 0; ii < 2; ii++) {
                        const x = cx + i;
                        const y = cy + ii;
                        const z = cz;
                        const id = layer._getTileId(x, y, z, info.layer);
                        const tile = this.tileCache.getAndRemove(id);
                        if (tile && this.isValidCachedTile(tile)) {
                            children.push(tile);
                            this.tileCache.add(id, tile);
                            candidates.push(null);
                        } else {
                            // 缺少offset
                            candidates.push(id);
                        }
                    }
                }

                // children.length等于4时，说明4个一级子瓦片都放入了children中
                if (children.length < 4) {
                    let index = 0;
                    for (let i = 0; i < 2; i++) {
                        for (let ii = 0; ii < 2; ii++) {
                            const id = candidates[index++];
                            if (!id) {
                                continue;
                            }
                            const x = cx + i;
                            const y = cy + ii;
                            const z = cz;
                            const childrenCount = children.length;
                            const childCandidates = [];
                            for (let j = 0; j < 2; j++) {
                                for (let jj = 0; jj < 2; jj++) {
                                    const xx = x * 2 + j;
                                    const yy = y * 2 + jj;
                                    const zz = z + 1;
                                    const id = layer._getTileId(xx, yy, zz, info.layer);
                                    const childTile = this.tileCache.getAndRemove(id);
                                    if (childTile && this.isValidCachedTile(childTile)) {
                                        children.push(childTile);
                                        this.tileCache.add(id, childTile);
                                        childCandidates.push(null);
                                    } else {
                                        childCandidates.push(id);
                                    }
                                }
                            }
                            if (!terrainTileMode) {
                                continue;
                            }
                            if (children.length - childrenCount < 4) {
                                const childTileInfo = layer.tileInfoCache.get(id) || layer._createChildNode(info, i, ii, [0, 0], id);
                                if (children.length - childrenCount === 0) {
                                    // 四个二级子瓦片都没有被缓存，直接将当前的一级子瓦片tileInfo放入missedTiles
                                    missedTiles.push(childTileInfo);
                                } else {
                                    // 四个二级子瓦片有被缓存的，将没有被缓存的tileInfo加入missedTiles
                                    let index = 0;
                                    for (let j = 0; j < 2; j++) {
                                        for (let jj = 0; jj < 2; jj++) {
                                            const id = childCandidates[index++];
                                            if (!id) {
                                                // 这个二级子瓦片已经被加入到了children
                                                continue;
                                            }
                                            const grandsonTileInfo = this.layer.tileInfoCache.get(id) || layer._createChildNode(childTileInfo, j, jj, [0, 0], id);
                                            missedTiles.push(grandsonTileInfo);
                                        }
                                    }
                                }
                            }

                        }
                    }
                }
                return terrainTileMode ? { tiles: children, missedTiles } : children;
            }
            const zoomDiff = 1;
            const res = info.res;
            const min = info.extent2d.getMin(),
                max = info.extent2d.getMax(),
                pmin = layer._project(map._pointToPrjAtRes(min, res, TEMP_POINT1), TEMP_POINT1),
                pmax = layer._project(map._pointToPrjAtRes(max, res, TEMP_POINT2), TEMP_POINT2);

            for (let i = 1; i < zoomDiff; i++) {
                this._findChildTilesAt(children, pmin, pmax, layer, info.z + i);
            }

            return children;
        }

        //@internal
        _findChildTilesAt(children: Tile[], pmin: number, pmax: number, layer: any, childZoom: number) {
            const sr = layer._spatialRef || layer.getSpatialReference();
            const layerId = layer.getId(),
                res = sr.getResolution(childZoom);
            if (!res) {
                return;
            }
            const getTileConfig = layer._getTileConfig();
            const dmin = getTileConfig.getTileIndex(pmin, res),
                dmax = getTileConfig.getTileIndex(pmax, res);
            const sx = Math.min(dmin.idx, dmax.idx), ex = Math.max(dmin.idx, dmax.idx);
            const sy = Math.min(dmin.idy, dmax.idy), ey = Math.max(dmin.idy, dmax.idy);
            let id, tile;
            for (let i = sx; i < ex; i++) {
                for (let ii = sy; ii < ey; ii++) {
                    id = layer._getTileId(i, ii, childZoom, layerId);
                    tile = this.tileCache.getAndRemove(id);
                    if (tile) {
                        if (this.isValidCachedTile(tile)) {
                            children.push(tile);
                            this.tileCache.add(id, tile);
                        }
                    }
                }
            }
        }

        findParentTile(info: Tile['info'], targetDiff?: number): Tile {
            return this._findParentTile(info, targetDiff);
        }

        //@internal
        _findParentTile(info: Tile['info'], targetDiff?: number): Tile {
            const map = this.map || this.getMap(),
                layer = this._getLayerOfTile(info.layer);
            if (!layer || !layer.options['background'] && !layer.options['terrainTileMode']) {
                return null;
            }
            const minZoom = layer.getMinZoom();
            const zoomDiff: number = targetDiff || info.z - minZoom;
            if (layer._isPyramidMode()) {
                const endZoom = info.z - zoomDiff;
                for (let z = info.z - 1; z >= endZoom; z--) {
                    const diff = info.z - z;
                    const scale = Math.pow(2, diff);
                    const x = Math.floor(info.x / scale);
                    const y = Math.floor(info.y / scale);
                    let id;
                    if (z === info.z - 1) {
                        id = info.parent;
                    } else {
                        id = layer._getTileId(x, y, z, info.layer);
                    }
                    const tile = this.tileCache.getAndRemove(id);
                    if (tile) {
                        if (this.isValidCachedTile(tile)) {
                            this.tileCache.add(id, tile);
                            return tile;
                        }
                    }
                }
                return null;
            }
            const sr = layer.getSpatialReference();
            // const zoomOffset = layer.options['zoomOffset'];
            const d = sr.getZoomDirection();
            const res = info.res;
            const center = info.extent2d.getCenter(),
                prj = layer._project(map._pointToPrjAtRes(center, res));
            for (let diff = 1; diff <= zoomDiff; diff++) {
                const z = info.z - d * diff;
                const res = sr.getResolution(z);
                if (!res) continue;
                const tileIndex = layer._getTileConfig().getTileIndex(prj, res);
                const id = layer._getTileId(tileIndex.x, tileIndex.y, z, info.layer);
                const tile = this.tileCache.getAndRemove(id);
                if (tile) {
                    this.tileCache.add(id, tile);
                    return tile;
                }
            }
            return null;
        }

        isValidCachedTile(tile: Tile): boolean {
            return !!tile.image;
        }

        isTileComplete(tile: Tile) {
            return true;
        }

        //@internal
        _getLayerOfTile(layerId: LayerId) {
            return this.layer.getChildLayer ? this.layer.getChildLayer(layerId) : this.layer;
        }

        getCachedTile(tile: Tile, isParent: boolean) {
            const tileId = tile.id;
            const tilesInView = this.tilesInView;
            let cached = this.tileCache.getAndRemove(tileId);
            if (cached) {
                if (!isParent) {
                    tilesInView[tileId] = cached;
                }
                const tilesLoading = this.tilesLoading;
                if (tilesLoading && tilesLoading[tileId]) {
                    this.markCurrent(tilesLoading[tileId], false);
                    const { image, info } = tilesLoading[tileId];
                    this.abortTileLoading(image, info);
                    delete tilesLoading[tileId];
                }
            } else {
                cached = tilesInView[tileId];
            }
            if (cached) {
                cached.current = true;
                if (this.isValidCachedTile(cached)) {
                    this.tileCache.add(tileId, cached);
                }
            }
            return cached;
        }

        //@internal
        _addTileToCache(tileInfo: Tile['info'], tileImage: Tile['image']) {
            if (this.isValidCachedTile({ info: tileInfo, image: tileImage } as Tile)) {
                const cached = {
                    image: tileImage,
                    info: tileInfo
                } as Tile;
                this.tileCache.add(tileInfo.id, cached);
            }
        }

        getTileOpacity(tileImage: Tile['image'], tileInfo: Tile['info']): number {
            let opacity = this.getTileFadingOpacity(tileImage);
            if (this.layer.getChildLayer) {
                // in GroupTileLayer
                const childLayer = this.layer.getLayer(tileInfo.layer);
                if (childLayer) {
                    opacity *= childLayer.options['opacity'];
                }
            }
            return opacity;
        }

        getTileFadingOpacity(tileImage: Tile['image']): number {
            if (!this.layer.options['fadeAnimation'] || !tileImage.loadTime) {
                return 1;
            }
            return Math.min(1, (now() - tileImage.loadTime) / this.layer.options['fadeDuration']);
        }

        clearTileCaches(): void {
            this.retireTiles(true);
            this.tileCache.reset();
            this.tilesInView = {};
            this.tilesLoading = {};
            this._tileQueue = [];
            this._tileQueueIds.clear();
            this._parentTiles = [];
            this._childTiles = [];
        }

        removeTileCaches() {
            delete this.tileCache;
            delete this._tilePlaceHolder;
            delete this._tileZoom;
        }

        markCurrent(tile: Tile, isCurrent?: boolean): void {
            tile.current = isCurrent;
        }

        markTiles(): number[] {
            let a = 0, b = 0;
            if (this.tilesLoading) {
                for (const p in this.tilesLoading) {
                    this.markCurrent(this.tilesLoading[p], false);
                    a++;
                }
            }
            if (this.tilesInView) {
                for (const p in this.tilesInView) {
                    this.markCurrent(this.tilesInView[p], false);
                    b++;
                }
            }
            return [a, b];
        }

        retireTiles(force?: boolean): void {
            for (const i in this.tilesLoading) {
                const tile = this.tilesLoading[i];
                if (force || !tile.current) {
                    // abort loading tiles
                    if (tile.image) {
                        this.abortTileLoading(tile.image, tile.info);
                    }
                    this.deleteTile(tile);
                    this.removeTileLoading(tile.info);
                }
            }
            for (const i in this.tilesInView) {
                const tile = this.tilesInView[i];
                if (!tile.current) {
                    delete this.tilesInView[i];
                    if (!this.tileCache.has(i)) {
                        this.deleteTile(tile);
                    }
                }
            }
        }

        deleteTile(tile: Tile): void {
            if (!tile || !tile.image) {
                return;
            }
            const tileId = tile.info.id;
            if (this._tileQueueIds.has(tileId)) {
                this._tileQueueIds.delete(tileId);
            }
            if ((tile.image as any).close) {
                (tile.image as any).close();
            }
            if (tile.image instanceof Image) {
                tile.image.onload = null;
                tile.image.onerror = null;
            }
            const layer = this.layer;
            if (layer) {
                /**
                 * tiledelete event, fired when tile is delete.
                 *
                 * @event TileLayer#tiledelete
                 * @type {Object}
                 * @property {String} type - tiledelete
                 * @property {TileLayer} target - tile layer
                 * @property {Object} tileInfo - tile info
                 * @property {Image} tileImage - tile image
                 */
                layer.fire('tiledelete', { tile: tile.info, tileImage: tile.image });
            }
        }

        //@internal
        _generatePlaceHolder(res: number): HTMLCanvasElement {
            const map = this.map || this.getMap();
            const placeholder = this.layer.options['placeholder'];
            if (!placeholder || map.getPitch()) {
                return null;
            }
            const tileSize = this.layer.getTileSize();
            const scale = res / map._getResolution();
            const canvas = this._tilePlaceHolder = this._tilePlaceHolder || Canvas.createCanvas(1, 1, map.CanvasClass);
            canvas.width = tileSize.width * scale;
            canvas.height = tileSize.height * scale;
            if (isFunction(placeholder)) {
                placeholder(canvas);
            } else {
                defaultPlaceholder(canvas);
            }
            return canvas;
        }

        setTerrainHelper(helper: TerrainHelper) {
            this._terrainHelper = helper;
        }
    }
    return renderable;
}

export default TileLayerRenderable;

function falseFn(): boolean { return false; }

function defaultPlaceholder(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d'),
        cw = canvas.width, ch = canvas.height,
        w = cw / 16, h = ch / 16;
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
        ctx.moveTo(0, i * h);
        ctx.lineTo(cw, i * h);
        ctx.moveTo(i * w, 0);
        ctx.lineTo(i * w, ch);
    }
    ctx.strokeStyle = 'rgba(180, 180, 180, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    const path = [
        [0, 0], [cw, 0], [0, ch], [cw, ch], [0, 0], [0, ch], [cw, 0], [cw, ch], [0, ch / 2], [cw, ch / 2], [cw / 2, 0], [cw / 2, ch]
    ];
    for (let i = 1; i < path.length; i += 2) {
        ctx.moveTo(path[i - 1][0], path[i - 1][1]);
        ctx.lineTo(path[i][0], path[i][1]);
    }
    ctx.lineWidth = 1 * 4;
    ctx.stroke();
}

function compareTiles(a: Tile, b: Tile): number {
    return Math.abs(this._tileZoom - a.info.z) - Math.abs(this._tileZoom - b.info.z);
}

export type TileId = string;
export type LayerId = string | number;
export type TerrainHelper = any;
export type TileImage = (HTMLImageElement | HTMLCanvasElement | ImageBitmap) & {
    loadTime: number;
    glBuffer?: TileImageBuffer;
    texture?: TileImageTexture;
    // onerrorTick?: number;
}

export interface Tile {
    id: TileId;
    info: {
        x: number;
        y: number;
        z: number;
        idx: number;
        idy: number;
        id: TileId;
        layer: number | string;
        children: [];
        error: number;
        offset: [number, number];
        extent2d: Extent;
        res: number;
        url: string;
        parent: any;
        cache?: boolean;
        // todo：检查是否存在定义
        minAltitude?: number;
        maxAltitude?: number;
        //@internal
        _glScale: number;
    };

    image: TileImage;
    current?: boolean;
}

export type RenderContext = any;

export type TilesInViewType = {
    [key: string]: Tile;
}

export interface TileGrid {
    extent: Extent;
    count: number;
    tiles: Tile[];
    parents: any[];
    offset: number[];
    zoom: number;
}

export interface TileGrids {
    count: number;
    tileGrids: TileGrid[];
}
