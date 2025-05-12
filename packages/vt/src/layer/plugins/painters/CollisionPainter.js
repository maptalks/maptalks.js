import * as maptalks from 'maptalks';
import { reshader, vec4 } from '@maptalks/gl';
import collisionVert from './glsl/collision.vert';
import collisionFrag from './glsl/collision.frag';
import BasicPainter from './BasicPainter';
import { clamp, isNil, getUniqueIds } from '../Util';
import CollisionGroup from './CollisionGroup';
import { isFnTypeSymbol } from './util/fn_type_util';
// import { getLabelContent } from './util/get_label_content';


// 设置说明:
// layer.options.collision 用来决定是否生成collision计算所需要的数据结构
// sceneConfig.collision 决定是否开启和关闭collision

const DEFAULT_SCENE_CONFIG = {
    collision: false,
    fading: false,
    fadingDuration: 16 * 14,
    fadeInDelay: 600,
    fadeOutDelay: 100
};
const MESH_ANCHOR_KEY = '__meshAnchorKey';
const UINT8 = new Uint8Array(1);
const COLLISION_OFFSET_THRESHOLD = 3;
const MESH_ANCHORS = [];
const NO_COLLISION = { collides: 0, boxes: [] };

const MESHES = [];
const BOX = [];

export default class CollisionPainter extends BasicPainter {

    createGeometry(...args) {
        const created = super.createGeometry(...args);
        if (!created || !created.geometry) {
            return created;
        }
        const { geometry } = created;
        // collideIds 用于碰撞检测，同一个数据的多symbol会生成多个mesh，不同的mesh中元素的collideId相同时，则认为共享一个检测结果
        // collideIds 优先用 aFeaIds，没有 aFeaIds 时，则用 aPickingId
        // 但 markerPlacement 为 line 时，iconPainter会重新生成 collideIds 和 uniqueCollideIds
        const glData = args[0];
        geometry.properties.collideIds = (glData.featureIds && glData.featureIds.length && glData.isIdUnique) ? glData.featureIds : glData.data.aPickingId;
        // uniqueCollideIds 是 collideIds 去重后的值，碰撞检测时对其遍历，按每个值来计算检测结果
        const isVectorTile = this.layer instanceof maptalks.TileLayer;
        geometry.properties.uniqueCollideIds = getUniqueIds(geometry.properties.collideIds, !isVectorTile);

        return created;
    }

    supportRenderMode(mode) {
        const renderToPointRenderTarget = this.sceneConfig.renderToPointRenderTarget;
        if (renderToPointRenderTarget || renderToPointRenderTarget === undefined) {
            return mode === 'point';
        } else {
            return mode === 'fxaa' || mode === 'fxaaAfterTaa';
        }
    }

    addMesh(meshes, progress, context) {
        if (meshes && !this.isEnableCollision()) {
            let meshesToCheck = meshes;
            if (!Array.isArray(meshesToCheck)) {
                MESHES[0] = meshes;
                meshesToCheck = MESHES;
            }
            for (let i = 0; i < meshesToCheck.length; i++) {
                const defines = meshesToCheck[i].defines;
                delete defines['ENABLE_COLLISION'];
                meshesToCheck[i].setDefines(defines);
                const { elements, visElemts } = meshesToCheck[i].geometry.properties;
                if (visElemts && visElemts.count !== undefined && visElemts.count !== elements.length) {
                    meshesToCheck[i].geometry.setElements(elements);
                    visElemts.count = elements.length;
                }
            }
        }
        return super.addMesh(meshes, progress, context);
    }

    startMeshCollision(mesh) {
        const { meshKey } = mesh.properties;
        const { renderer } = this._cachedInstances;
        const isForeground = renderer.isForeground(mesh instanceof CollisionGroup ? mesh.meshes[0] : mesh);
        mesh.properties.isForeground = isForeground;
        if (mesh instanceof CollisionGroup && mesh.meshes.length) {
            for (let i = 0; i < mesh.meshes.length; i++) {
                mesh.meshes[i].properties.isForeground = isForeground;
            }
        }

        this._startTime = performance.now();
        this._canProceed = this._canProceedCollision();
        this._meshCollisionStale = this._isCachedCollisionStale(meshKey);
    }

    endMeshCollision(meshKey) {
        const meshContext = this._collisionContext.tags[meshKey];
        if (this._canProceed && meshContext && this._meshCollisionStale) {
            const map = this.getMap();
            if (!this._anchorCoord0) {
                this._anchorCoord0 = new maptalks.Coordinate(0, 0);
                this._anchorCoord1 = new maptalks.Coordinate(0, 0);
            }
            meshContext.anchor0 = map.containerPointToCoord(this._containerAnchor0, this._anchorCoord0);
            meshContext.anchor1 = map.containerPointToCoord(this._containerAnchor1, this._anchorCoord1);
            meshContext.anchor0.z = map.getZoom();
            meshContext.anchor0.width = map.width;
            meshContext.anchor0.height = map.height;
            meshContext.anchor0.pitch = map.getPitch();
        }
        this.getMap().collisionFrameTime += performance.now() - this._startTime;
    }

    _isCachedCollisionStale(meshKey) {
        const map = this.getMap();
        const z = map.getZoom();
        const pitch = map.getPitch();
        const [anchor0, anchor1] = this._getMeshAnchor(meshKey);
        //如果没有anchor，或者anchor距离它应该在的点的像素距离超过阈值时，则说明collision已经过期
        if (!anchor0 || !anchor1 || anchor0.z !== z ||
            anchor0.width !== map.width || anchor0.height !== map.height || anchor0.pitch !== pitch ||
            anchor0.distanceTo(this._containerAnchor0) > COLLISION_OFFSET_THRESHOLD ||
            anchor1.distanceTo(this._containerAnchor1) > COLLISION_OFFSET_THRESHOLD) {
            return true;
        }
        return false;
    }

    _startCollision() {
        const map = this.getMap();
        this._coordCache = {};
        this._containerAnchor0 = new maptalks.Point(map.width / 3, map.height / 2);
        this._containerAnchor1 = new maptalks.Point(map.width * 2 / 3, map.height / 2);
        delete this._canProceed;
        if (!this._collisionContext) {
            this._collisionContext = {
                tags: {}
            };
        }
        this._cachedInstances = {
            layer: this.layer,
            renderer: this.layer.getRenderer(),
            frameTimestamp: this.layer.getRenderer().getFrameTimestamp(),
            map: this.getMap(),
            zoom: map.getZoom(),
            collisionTags: this._collisionContext.tags,
            isEnableUniquePlacement: this.isEnableUniquePlacement()
        };
    }

    _endCollision() {
    }

    _getCachedCollision(meshKey, boxIndex) {
        const context = this._collisionContext;
        return context.tags[meshKey] && context.tags[meshKey][boxIndex];
    }

    _setCollisionCache(meshKey, boxIndex, value) {
        const context = this._collisionContext;
        context.tags[meshKey] = context.tags[meshKey] || [];
        context.tags[meshKey][boxIndex] = value;
    }

    _canProceedCollision() {
        const map = this.getMap();
        if (!map.isInteracting()) {
            return true;
        }
        const limit = this.layer.options['collisionFrameLimit'];
        return map.collisionFrameTime <= limit;
    }

    _getMeshAnchor(meshKey) {
        const keyName = (MESH_ANCHOR_KEY + '').trim();
        const meshContext = this._collisionContext.tags[meshKey];
        if (meshContext && meshContext.anchor0) {
            const { anchor0, anchor1 } = meshContext;
            const key0 = anchor0[keyName] = anchor0[keyName] || anchor0.x + ',' + anchor0.y;
            const key1 = anchor1[keyName] = anchor1[keyName] || anchor1.x + ',' + anchor1.y;
            let cp0 = this._coordCache[key0];
            let cp1 = this._coordCache[key1];
            if (!cp0 || !cp1) {
                const map = this.getMap();
                cp0 = this._coordCache[key0] = map.coordToContainerPoint(anchor0);
                cp1 = this._coordCache[key1] = map.coordToContainerPoint(anchor1);
            }
            cp0.z = anchor0.z;
            MESH_ANCHORS[0] = cp0;
            MESH_ANCHORS[1] = cp1;
            cp0.width = anchor0.width;
            cp0.height = anchor0.height;
            return MESH_ANCHORS;
        } else {
            MESH_ANCHORS[0] = MESH_ANCHORS[1] = null;
        }
        return MESH_ANCHORS;
    }

    updateBoxCollisionFading(boxVisible, mesh, meshBoxes, mvpMatrix, boxIndex) {
        const { layer, renderer, zoom, collisionTags, isEnableUniquePlacement } = this._cachedInstances;
        const { meshKey, isForeground } = mesh.properties;
        if (isEnableUniquePlacement && this._isReplacedPlacement(meshKey, boxIndex)) {
            return false;
        }
        const l = meshBoxes.length;
        // if (this.shouldIgnoreBackground() && !isForeground) {
        //     return INVISIBLE_BOX;
        // }
        //地图缩小时限制绘制的box数量，以及fading时，父级瓦片中的box数量，避免大量的box绘制，提升缩放的性能
        // if (this.shouldLimitBox(isForeground) && boxIndex > layer.options['boxLimitOnZoomout']) {
        //     return INVISIBLE_BOX;
        // }

        //为了解决缩小地图时，大量文字会突然挤在一起
        //尽量重用缓存的collision，能提升碰撞检测的性能，但在必要的时候需要刷新缓存的collision
        //这里逻辑如下：
        //## zooming时
        //* zooming时已经collided，则不刷新，仍都按照collided处理
        //* zooming时是uncollided，则重新计算collision
        //## 非zooming时
        //* canProceed且collision stale时刷新collision
        let collision = collisionTags[meshKey] && collisionTags[meshKey][boxIndex];
        const cachedCollision = collision;
        const zoomColliding = this._zooming && collision;
        const isCollidedOnZooming = zoomColliding && collision.collides !== 0;

        if (!isCollidedOnZooming && boxVisible) {
            const uncollidedOnZooming = zoomColliding && collision.collides === 0;
            if (this._canProceed || uncollidedOnZooming) {
                if (this._meshCollisionStale || collision && collision.z !== zoom) {
                    collision = null;
                }
                if (!collision) {
                    collision = cachedCollision || { collides: 0, boxes: [] };
                    collision.boxes.length = 0;
                    collision.z = zoom;
                    let collides = 0;
                    for (let i = 0; i < l; i++) {
                        const { mesh, allElements, boxCount, start, end } = meshBoxes[i];
                        const childCollision = this._isBoxVisible(mesh, allElements, boxCount, start, end, mvpMatrix, boxIndex);
                        if (childCollision.isAllowOverlap) {
                            collision.isAllowOverlap = 1;
                        }
                        if (collides === 0) {
                            collides = childCollision.collides;
                        }
                        if (childCollision.boxes) {
                            collision.boxes.push(...childCollision.boxes);
                        }
                    }
                    collision.collides = collides;
                    this._setCollisionCache(meshKey, boxIndex, collision);
                } else if (collision.boxes && collision.boxes.length) {
                    //因为可能有新的boxes加入场景，所以要重新检查缓存中的box是否有collides
                    //但zooming时不检查，有collides的仍继续隐藏
                    const { boxes, isAllowOverlap } = collision;
                    let collides = 0;
                    if (!isAllowOverlap) {
                        let offscreenCount = 0;
                        for (let i = 0; i < boxes.length; i++) {
                            if (!collides) {
                                const boxCollides = this.isCollides(boxes[i]);
                                if (boxCollides === -1) {
                                    offscreenCount++;
                                } else if (boxCollides === 1) {
                                    collides = 1;
                                    break;
                                }
                            }
                        }
                        if (offscreenCount === boxes.length) {
                            collides = -1;
                        }
                    }
                    collision.collides = collides;
                }
            }
        }
        let visible = boxVisible && collision && collision.collides === 0;


        let fadingOpacity = 1;
        let isFading = false;
        if (this.sceneConfig.fading) {
            const stamps = this._getBoxTimestamps(mesh);
            // const current = stamps[boxIndex];
            // if (getLabelContent(mesh, allElements[start]) === '汉阳大道') {
            //     // console.log('湖北', isForeground, collision && collision.collides, stamps[boxIndex]);
            //     console.log('汉阳大道', tile.z, collision && collision.collides, stamps[boxIndex]);
            // }

            // if (debugging && visible && this._zoomingOut) {
            //     debugger
            // }
            //zoomingOut过程中，直接根据collides结果显示或隐藏，不fading，避免fading造成的聚团现象
            //不能用this._zooming判断，因为zooming没有延迟
            if (!this._zoomingOut) {
                if (isForeground) {
                    delete mesh._fadeOutStartTime;
                }
                // const stamps = this._getBoxTimestamps(meshKey);
                fadingOpacity = this._getBoxFading(isForeground, visible, stamps, boxIndex);
                //如果是当前tile，执行fading逻辑
                if (isForeground) {
                    if (fadingOpacity > 0) {
                        visible = true;
                    }
                    isFading = this.isBoxFading(mesh, boxIndex);
                    if (isFading) {
                        this.setToRedraw();
                    }
                } else if (!visible) {
                    //为解决zoom in 过程中，大量box挤在一起，造成的用户体验不佳的问题
                    //当瓦片不是当前tile，则跳过fading，立即隐藏有collision的box
                    this._markFadingCollided(stamps, boxIndex);
                    fadingOpacity = 0;
                }
                if (visible) {
                    const fadeOutStart = mesh._fadeOutStartTime;
                    if (fadeOutStart && fadingOpacity === 1 && stamps[boxIndex] > 0) {
                        let { fadeOutDelay, fadingDuration } = this.sceneConfig;
                        if (isNil(fadingDuration)) { fadingDuration = DEFAULT_SCENE_CONFIG.fadingDuration; }
                        if (isNil(fadeOutDelay)) { fadeOutDelay = DEFAULT_SCENE_CONFIG.fadeOutDelay; }
                        const timestamp = renderer.getFrameTimestamp();
                        const zoomEndFading = clamp(1 - (timestamp - fadeOutStart - fadeOutDelay) / fadingDuration, 0, 1);
                        fadingOpacity *= zoomEndFading;
                        if (zoomEndFading > 0) {
                            this.setToRedraw();
                        }
                        // if (getLabelContent(mesh, allElements[start]) === '湖北') {
                        //     console.log('湖北', visible, mesh.uniforms.level, fadingOpacity, zoomEndFading);
                        // }
                    }
                }

            } else {
                stamps[boxIndex] = visible ? 1 : -1;
            }
        }

        if (collision && layer.options['debugCollision']) {
            this.addCollisionDebugBox(collision.boxes, collision.collides ? 0 : 1);
        }

        if (visible || isFading) {
            const { mesh, start } = meshBoxes[0];
            const symbol = this.getSymbol(mesh.properties.symbolIndex);
            if (!this._isIgnorePlacement(symbol, mesh, start) && collision && collision.boxes) {
                // if (getLabelContent(mesh, allElements[start]) === 'Indonesia') {
                //     console.log(renderer.getFrameTimestamp(), meshKey, JSON.stringify(collision.boxes));
                // }
                this._fillCollisionIndex(collision.boxes, mesh);
            }
        }
        if (visible) {
            const opacity = UINT8[0] = fadingOpacity * 255;
            for (let i = 0; i < l; i++) {
                const { mesh, allElements, start, boxStart, end, boxIndex } = meshBoxes[i];
                // boxStart 中是box的start，因为icon plugin数据中，text前面有halo，text的开始用来计算collide，而halo的开始用来显示
                // 但text plugin数据中，则不存在boxStart
                const startIndex = boxStart === undefined ? start : boxStart;
                this.setCollisionOpacity(mesh, allElements, opacity, startIndex, end, boxIndex);
            }
        }
        // if (getLabelContent(mesh, allElements[start]) === '会稽山') {
        //     // console.log(renderer.getFrameTimestamp(), meshKey, visible, 'level:' + mesh.uniforms.level, 'fading:' + isFading, 'opacity:' + fadingOpacity, 'timestart:' + current, 'timeend:' + stamps[boxIndex]);
        //     console.log(visible, 'level:' + mesh.uniforms.level, boxIndex, fadingOpacity, meshKey);
        // }

        return visible && fadingOpacity > 0;
    }

    isMeshIterable() {
        return true;
    }

    setCollisionOpacity(mesh, allElements, value, start, end) {
        const vertexIndexStart = allElements[start];
        const vertexIndexEnd = allElements[end - 1];
        this._updateOpacityData(mesh, value, vertexIndexStart, vertexIndexEnd);
    }

    _updateOpacityData(mesh, value, start, end) {
        const { aOpacity } = mesh.geometry.properties;
        if (!aOpacity) {
            return;
        }
        const vertexIndexStart = start;
        if (aOpacity[vertexIndexStart] !== value) {
            const vertexIndexEnd = end;
            for (let i = vertexIndexStart; i <= vertexIndexEnd; i++) {
                aOpacity[i] = value;
            }
            aOpacity.dirty = true;
        }
    }

    isBoxFading(mesh, boxIndex) {
        const { frameTimestamp } = this._cachedInstances;
        let fadingDuration = this.sceneConfig.fadingDuration;
        if (isNil(fadingDuration)) {
            fadingDuration = DEFAULT_SCENE_CONFIG.fadingDuration;
        }
        const boxTimestamp = Math.abs(this._getBoxTimestamps(mesh)[boxIndex]);
        return frameTimestamp - boxTimestamp < fadingDuration;
    }


    _isBoxVisible(mesh, elements, boxCount, start, end, mvpMatrix, boxIndex) {
        const symbol = this.getSymbol(mesh.properties.symbolIndex);
        const isIgnorePlacement = this._isIgnorePlacement(symbol, mesh, elements[start]);
        const isAllowOverlap = this._isAllowOverlap(symbol, mesh, elements[start]);
        if (!this.isEnableCollision() || isIgnorePlacement && isAllowOverlap) {
            return NO_COLLISION;
        }
        const collision = this.isBoxCollides(mesh, elements, boxCount, start, end, mvpMatrix, boxIndex);
        if (isAllowOverlap) {
            collision.collides = 0;
            collision.isAllowOverlap = 1;
        }
        return collision;
    }

    _isIgnorePlacement(symbol, mesh, index) {
        if (!this.isEnableCollision()) {
            return true;
        }
        const aOverlap = mesh.geometry.properties['aOverlap'];
        if (!aOverlap) {
            return +symbol[this.propIgnorePlacement] === 1;
        }
        const v = aOverlap[index];
        const placement = v % 8;
        // aOverlap中，最后四位的含义: [allowOverlap是否动态][allowOverlap的值][ignorePlacement是否动态][ignorePlacement的值]
        if (v < 2) {
            // 不是动态的 placement，直接读取symbol上的定义
            return +symbol[this.propIgnorePlacement] === 1;
        } else {
            return placement % 2;
        }
    }

    _isAllowOverlap(symbol, mesh, index) {
        if (!this.isEnableCollision()) {
            return true;
        }
        const aOverlap = mesh.geometry.properties['aOverlap'];
        if (!aOverlap) {
            return +symbol[this.propAllowOverlap] === 1;
        }
        const v = aOverlap[index];
        const overlap = v >> 2;
        if (v < 2) {
            // 不是动态的 allowOverlap，直接读取symbol上的定义
            return +symbol[this.propAllowOverlap] === 1;
        } else {
            return overlap % 2;
        }
    }

    _fillCollisionIndex(boxes) {
        if (Array.isArray(boxes[0])) {
            for (let i = 0; i < boxes.length; i++) {
                this.insertCollisionBox(boxes[i]);
            }
        } else {
            this.insertCollisionBox(boxes);
        }
    }

    _getBoxFading(isForeground, visible, stamps, index) {
        //level大于0，不fading
        let { fadingDuration, fadeInDelay, fadeOutDelay } = this.sceneConfig;
        if (isNil(fadingDuration)) { fadingDuration = DEFAULT_SCENE_CONFIG.fadingDuration; }
        if (isNil(fadeInDelay)) { fadeInDelay = DEFAULT_SCENE_CONFIG.fadeInDelay; }
        if (isNil(fadeOutDelay)) { fadeOutDelay = DEFAULT_SCENE_CONFIG.fadeOutDelay; }
        const { frameTimestamp: timestamp } = this._cachedInstances;
        let boxTimestamp = stamps[index];
        let fadingOpacity = visible ? 1 : 0;
        if (!boxTimestamp) {
            // const zooming = this.getMap().isZooming();
            // if (visible && level === 0 && this._zoomFading === undefined) {
            if (visible && isForeground/* && !zooming*/) {
                //第一次显示
                stamps[index] = timestamp + fadeInDelay;
            }
            return 0;
        }

        const delaying = timestamp < Math.abs(boxTimestamp);

        if (delaying) {
            //如果在delay期间，又改回原有的状态，则重置时间戳以退出fading
            if (!visible && boxTimestamp > 0 || visible && boxTimestamp < 0) {
                const newStamp = timestamp - fadingDuration;
                stamps[index] = boxTimestamp = visible ? newStamp : -newStamp;
            }
        }

        const fading = timestamp - Math.abs(boxTimestamp) < fadingDuration;

        if (fading) {
            //fading过程中，不管visible是否改变，继续计算原有的fadingOpacity，消除flicker现象
            if (boxTimestamp > 0) {
                //显示fading
                fadingOpacity = (timestamp - boxTimestamp) / fadingDuration;
            } else {
                //消失fading
                fadingOpacity = 1 - (timestamp + boxTimestamp) / fadingDuration;
            }
        } else if (visible) {
            //显示fading开始
            if (boxTimestamp < 0) {
                //显示fading起点，记录时间戳
                stamps[index] = boxTimestamp = timestamp + fadeInDelay;
            }
            fadingOpacity = (timestamp - boxTimestamp) / fadingDuration;
        } else {
            //消失fading开始
            if (boxTimestamp > 0) {
                //消失fading起点，记录时间戳
                stamps[index] = boxTimestamp = -(timestamp + fadeOutDelay);
            }
            fadingOpacity = 1 - (timestamp + boxTimestamp) / fadingDuration;
        }

        if (fadingOpacity < 0 || fadingOpacity > 1) {
            fadingOpacity = clamp(fadingOpacity, 0, 1);
        }
        // if (level > 0 && this._zoomFading >= 0) {
        //     fadingOpacity *= this._zoomFading;
        // }
        return fadingOpacity;
    }

    _getBoxTimestamps(mesh) {
        if (!this._boxTimestamps) {
            this._boxTimestamps = {};
        }
        const { meshKey } = mesh.properties;
        if (!this._boxTimestamps[meshKey]) {
            const { frameTimestamp } = this._cachedInstances;
            this._boxTimestamps[meshKey] = {
                'timestamp': frameTimestamp
            };
        }
        return this._boxTimestamps[meshKey];
    }

    _refreshTimeStamps(timestamp) {
        if (!this._prevTimestamp) {
            this._prevTimestamp = timestamp;
            return;
        }
        const meshes = this.scene.getMeshes();
        if (!meshes || !meshes.length) {
            return;
        }
        for (let i = 0; i < meshes.length; i++) {
            const stamps = this._getBoxTimestamps(meshes[i]);
            if (stamps['timestamp'] < this._prevTimestamp) {
                delete meshes[i]['_fading_timestamps'];
            } else {
                stamps['timestamp'] = timestamp;
            }
        }
        this._prevTimestamp = timestamp;
    }

    _markFadingCollided(stamps, index) {
        if (!stamps) {
            return;
        }
        const { frameTimestamp } = this._cachedInstances;
        let { fadingDuration } = this.sceneConfig;
        if (isNil(fadingDuration)) { fadingDuration = DEFAULT_SCENE_CONFIG.fadingDuration; }
        stamps[index] = -(frameTimestamp - fadingDuration - 1);
    }


    deleteMesh(meshes, keepGeometry) {
        if (!meshes) {
            return;
        }
        if (Array.isArray(meshes)) {
            for (let i = 0; i < meshes.length; i++) {
                const key = meshes[i].properties.meshKey;
                if (this._collisionContext) delete this._collisionContext.tags[key];
                if (this._boxTimestamps) delete this._boxTimestamps[key];
            }
        } else {
            const key = meshes.properties.meshKey;
            if (this._collisionContext) delete this._collisionContext.tags[key];
            if (this._boxTimestamps) delete this._boxTimestamps[key];
        }
        super.deleteMesh(meshes, keepGeometry);
    }

    delete(context) {
        if (this._collisionMesh) {
            this._collisionMesh.geometry.dispose();
            this._collisionShader.dispose();
            this._collisionMesh.dispose();
            delete this._collisionMesh;
            delete this._collisionShader;
            delete this._collisionRenderer;
        }
        delete this._collisionContext;
        super.delete(context);
    }

    /**
     * 判断tile是否存在碰撞
     * @param {Number[]} box - box
     * @param {Number} meshTileZoom - mesh's tile zoom
     * @returns {Number} 1: 存在; 0: 不存在; -1: 在屏幕之外
     */
    isCollides(box/*, tileInfo*/) {
        const layer = this.layer,
            map = layer.getMap();
        const dpr = map.getDevicePixelRatio();
        vec4.scale(BOX, box, 1 / dpr);
        if (map.isOffscreen(BOX)) {
            return -1;
        }
        // const isBackground = layer.getRenderer().isCurrentTile(tileInfo.id);
        // const collisionIndex = isBackground ? layer.getBackgroundCollisionIndex() : layer.getCollisionIndex();
        const collisionIndex = layer.getCollisionIndex();
        const bufferSize = this.sceneConfig.collisionBufferSize || layer.options['collisionBufferSize'] || 0;
        if (bufferSize) {
            box = bufferBox(BOX, box, bufferSize);
        }
        return +collisionIndex.collides(box);
    }

    insertCollisionBox(box/*, tileInfo*/) {
        const layer = this.layer;
        // const isBackground = layer.getRenderer().isCurrentTile(tileInfo.id);
        // const collisionIndex = isBackground ? layer.getBackgroundCollisionIndex() : layer.getCollisionIndex();
        const collisionIndex = layer.getCollisionIndex();
        const bufferSize = this.sceneConfig.collisionBufferSize || layer.options['collisionBufferSize'] || 0;
        let out = box;
        if (bufferSize) {
            out = box._buffered = box._buffered || [];
            box = bufferBox(out, box, bufferSize);
        }
        collisionIndex.insertBox(out);
    }

    /**
     *
     * @param {Number[] || Number[][]} boxes - boxes to add
     * @param {Number} visible - 1 or 0
     */
    addCollisionDebugBox(boxes, visible) {
        if (!boxes || !boxes.length) {
            return;
        }
        if (Array.isArray(boxes[0])) {
            for (let i = 0; i < boxes.length; i++) {
                const box = boxes[i];
                this._addCollisionBox(box, visible);
            }
        } else {
            this._addCollisionBox(boxes, visible);
        }
    }

    _addCollisionBox(box, visible) {
        if (!box) {
            return;
        }
        const allBoxes = this._collisionBoxes = this._collisionBoxes || {
            aPosition: [],
            aVisible: [],
            indices: []
        };
        const bufferSize = this.sceneConfig.collisionBufferSize || this.layer.options['collisionBufferSize'] || 0;
        if (bufferSize) {
            box = bufferBox(BOX, box, bufferSize);
        }
        const map = this.getMap();
        const dpr = map.getDevicePixelRatio();
        vec4.scale(BOX, box, 1 / dpr);
        if (map.isOffscreen(BOX)) {
            return;
        }
        const count = allBoxes.aPosition.length / 2;
        allBoxes.aPosition.push(
            box[0], box[1], box[2], box[1],
            box[2], box[3], box[0], box[3]
        );
        allBoxes.aVisible.push(visible, visible, visible, visible);
        allBoxes.indices.push(
            count, count + 1,
            count + 1, count + 2,
            count + 2,
            count + 3,
            count + 3, count
        );
    }

    updateCollision(context) {
        super.updateCollision(context);
        this._startCollision();
        this._prepareZoomEndMeshes();
        if (this._zoomEndMeshes && this._zoomEndMeshes.length) {
            this._updateZoomMeshesLevel();
            if (this._zoomEndMeshes) {
                this.setToRedraw();
                this.scene.addMesh(this._zoomEndMeshes);
            }
        }
        //text/icon在同一个位置如果内容相同，只显示一个
        const map = this.getMap();
        if (map.isZooming() || this._zoomEndMeshes && this._zoomEndMeshes.length) {
            this._updateUniquePlacements();
            this._mergeUniquePlacements(this.scene.getMeshes());
        }
    }

    paint(context) {
        const status = super.paint(context);
        this._renderCollisionBox(context);
        if (this._canProceed === false) {
            this.setToRedraw();
        }
        return status;
    }

    // 2022-09-21 为了能绘制background瓦片，提升地图体验，注释掉了该方法
    // 验证url: http://localhost/bugs/designer-942/debug.html
    // 注释掉之后似乎不会出现背景瓦片导致的闪烁现象
    // callShader(uniforms, context) {
    //     this.callCurrentTileShader(uniforms, context);

    //     // if (this.shouldIgnoreBackground()) {
    //     //     //移动或旋转地图时，不绘制背景瓦片，消除背景瓦片引起的闪烁现象
    //     //     //但有zoomFading时
    //     //     return;
    //     // }
    //     this.callBackgroundTileShader(uniforms, context);
    // }

    shouldIgnoreBackground() {
        // return false;
        const map = this.getMap();
        return !map.isZooming() && !this._zoomEndMeshes;
    }

    // shouldLimitBox(isForeground, ignoreZoomOut) {
    //     const map = this.getMap();
    //     return !map.options['seamlessZoom'] &&
    //         this.layer.options['boxLimitOnZoomout'] &&
    //         (ignoreZoomOut || this._zoomingOut) &&
    //         (map.isZooming() || this._zoomEndTimestamp !== undefined && !isForeground);
    // }

    _prepareZoomEndMeshes() {
        const map = this.getMap();
        const zooming = map.isZooming();
        if (!zooming && this._zooming) {
            //记录zoom结束的时间戳
            const renderer = this.layer.getRenderer();
            // linePlacement的mesh不放到zoomEndMeshes中
            this._zoomEndMeshes = this.scene.getMeshes().filter(m => !renderer.isForeground(m) && !m.properties.isLinePlacement);
        } else if (zooming && !this._zooming) {
            this._preRes = map.getResolution();
        }
        if (zooming) {
            if (this._clearTimeout) {
                clearTimeout(this._clearTimeout);
                delete this._zoomingOut;
                delete this._clearTimeout;
            }
            this._zoomingOut = this._preRes && map.getResolution() > this._preRes;
        } else if (this._zooming && !this._clearTimeout) {
            let { fadeOutDelay, fadingDuration } = this.sceneConfig;
            if (isNil(fadeOutDelay)) { fadeOutDelay = DEFAULT_SCENE_CONFIG.fadeOutDelay; }
            if (isNil(fadingDuration)) { fadingDuration = DEFAULT_SCENE_CONFIG.fadingDuration; }
            this._clearTimeout = setTimeout(() => {
                delete this._zoomingOut;
                delete this._clearTimeout;
            }, fadeOutDelay + fadingDuration + 1);
        }
        this._zooming = zooming;
    }

    _renderCollisionBox(context) {
        if (!this._collisionBoxes || !this.layer.options['debugCollision']) {
            return;
        }
        if (!this._collisionRenderer) {
            this._initCollisionShader();
        }
        const { aPosition, aVisible, indices } = this._collisionBoxes;
        if (!this._collisionMesh) {
            const geometry = new reshader.Geometry(
                {
                    aPosition: [],
                    aVisible: []
                },
                [],
                0,
                {
                    positionSize: 2,
                    primitive: 'lines'
                }
            );
            this._collisionMesh = new reshader.Mesh(geometry);
            this._collisionScene = new reshader.Scene();
            this._collisionScene.addMesh(this._collisionMesh);
        }
        const geometry = this._collisionMesh.geometry;
        geometry.updateData('aPosition', new Float32Array(aPosition));
        geometry.updateData('aVisible', new Uint8Array(aVisible));
        geometry.setElements(indices);

        this._collisionRenderer.render(
            this._collisionShader,
            {
                size: [this.canvas.width, this.canvas.height]
            },
            this._collisionScene,
            this.getRenderFBO(context)
        );
        delete this._collisionBoxes;
    }

    _initCollisionShader() {
        const regl = this.regl;

        this._collisionRenderer = new reshader.Renderer(regl);

        const canvas = this.canvas;
        const viewport = {
            x: 0,
            y: 0,
            width: () => {
                return canvas ? canvas.width : 1;
            },
            height: () => {
                return canvas ? canvas.height : 1;
            }
        };
        this._collisionShader = new reshader.MeshShader({
            vert: collisionVert, frag: collisionFrag,
            uniforms: [
                'size'
            ],
            extraCommandProps: {
                viewport,
                depth: {
                    enable: false,
                },
                blend: {
                    enable: true,
                    func: {
                        src: 'src alpha',
                        dst: 'one minus src alpha'
                    },
                    equation: 'add'
                }
            }
        });

    }

    _updateZoomMeshesLevel() {
        let { fadeOutDelay, fadingDuration } = this.sceneConfig;
        if (isNil(fadeOutDelay)) { fadeOutDelay = DEFAULT_SCENE_CONFIG.fadeOutDelay; }
        if (isNil(fadingDuration)) { fadingDuration = DEFAULT_SCENE_CONFIG.fadingDuration; }
        const renderer = this.layer.getRenderer();
        const tileZoom = renderer.getCurrentTileZoom();
        const timestamp = renderer.getFrameTimestamp();
        const meshes = [];
        for (let i = 0; i < this._zoomEndMeshes.length; i++) {
            const mesh = this._zoomEndMeshes[i];
            const tileInfo = mesh.properties.tile;
            if (!mesh._fadeOutStartTime && renderer.isBackTile(tileInfo.id)) {
                mesh._fadeOutStartTime = timestamp;
            }
            //需要更新zoom meshes 的level，让他们改为在background阶段绘制
            const level = (tileInfo.z - tileZoom) > 0 ? 2 * (tileInfo.z - tileZoom) - 1 : 2 * (tileZoom - tileInfo.z);
            mesh.properties.level = level;
            if (renderer.isForeground(mesh) ||
                mesh._fadeOutStartTime && (timestamp - mesh._fadeOutStartTime > fadeOutDelay + fadingDuration)) {
                delete mesh._fadeOutStartTime;
                // console.log(timestamp, 'removed');
                continue;
            }
            meshes.push(mesh);
        }
        delete this._zoomEndMeshes;
        if (meshes.length) {
            this._zoomEndMeshes = meshes;
        }/* else {
            console.log(context.timestamp, 'zoomEndMeshes are removed');
        }*/
    }

    isEnableCollision() {
        return this.layer.options['collision'] && !!this.sceneConfig['collision'];
    }

    isEnableUniquePlacement() {
        return this.isEnableCollision() && this.sceneConfig['uniquePlacement'];
    }

    isMeshUniquePlaced(mesh) {
        return this.isMeshIterable(mesh);
    }

    _updateUniquePlacements() {
        if (!this.isEnableUniquePlacement()) {
            return;
        }
        const meshes = this.scene.getMeshes();
        const fn = (mesh, meshBoxes, matrix, boxIndex) => {
            // 目前支持 unique placement 的都是单symbol的情况。
            const { start, end } = meshBoxes[0];
            //初始化label，
            const geoProps = mesh.geometry.properties;
            const elements = geoProps.elements;
            let placements = geoProps.uniquePlacements;
            if (!placements) {
                placements = geoProps.uniquePlacements = [];
            }
            if (placements[boxIndex] === undefined) {
                const key = this.getUniqueEntryKey(mesh, elements[start], boxIndex);
                // console.log(key, mesh.uniforms.level);
                if (!key) {
                    placements[boxIndex] = null;
                } else {
                    placements[boxIndex] = {
                        key,
                        index: boxIndex,
                        start: elements[start],
                        end: elements[end - 1]
                    };
                }
            }
        };
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            if (!this.isMeshUniquePlaced(mesh)) {
                continue;
            }
            this.forEachBox(mesh, fn);
        }
    }

    _mergeUniquePlacements(meshes) {
        if (!this.isEnableUniquePlacement()) {
            return;
        }
        const zoom = this.getMap().getZoom();
        let changed = !this._mergedMeshes || this._mergedMehesZoom !== zoom;
        if (!changed) {
            for (let i = 0; i < meshes.length; i++) {
                if (!this._mergedMeshes[meshes[i].properties.meshKey]) {
                    changed = true;
                    break;
                }
            }
        }
        if (!changed) {
            return;
        }
        this._mergedMehesZoom = zoom;
        this._replacedPlacements = {};
        this._mergedMeshes = {};
        meshes = meshes.sort(sortByLevel);
        const scale = this.getMap().getGLScale();
        const allPlacements = {};
        // let hubeiKey;
        // const keys = [];
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            if (!mesh.geometry) {
                //disposed
                continue;
            }
            const { meshKey } = mesh.properties;
            this._mergedMeshes[meshKey] = 1;
            const { uniquePlacements } = mesh.geometry.properties;
            if (!uniquePlacements) {
                continue;
            }
            for (let j = 0; j < uniquePlacements.length; j++) {
                if (!uniquePlacements[j]) {
                    continue;
                }
                const { key, index/*, start*/ } = uniquePlacements[j];
                const stamps = this._getBoxTimestamps(mesh);

                const uKey = getUniqueKey(key, scale);

                // if (getLabelContent(mesh, start) === '慎') {
                //     console.log('placement_key', mesh.properties.meshKey, uKey, key);
                // }

                // console.log(uKey, mesh.uniforms.level);
                // let debugging = false
                // if (getLabelContent(mesh, start) === '慎') {
                //     // keys.push(uKey);
                //     // if (!hubeiKey) {
                //     //     hubeiKey = uKey;
                //     // } else if (hubeiKey !== uKey) {
                //     //     console.log('Indonesia miss', hubeiKey, uKey);
                //     // }
                //     debugging = true;
                // }
                const placements = allPlacements[uKey];
                if (!placements) {
                    //用纯数组比对象性能更好
                    allPlacements[uKey] = [
                        mesh,
                        stamps,
                        index
                    ];
                } else {
                    const len = placements.length;
                    const parentMesh = placements[len - 3];
                    const parentKey = parentMesh.properties.meshKey;
                    const parentStamps = placements[len - 2];
                    const parentIndex = placements[len - 1];
                    this._replacedPlacements[parentKey] = this._replacedPlacements[parentKey] || {};
                    this._replacedPlacements[parentKey][parentIndex] = 1;
                    // if (debugging) {
                    //     console.log('placement', `${parentStamps[parentIndex]}`,  `${stamps[index]}`);
                    // }
                    this._updatePlacementStamps(stamps, index, parentStamps, parentIndex);
                    placements.push(mesh, stamps, index);
                }
            }
        }

        for (const key in allPlacements) {
            const placements = allPlacements[key];
            if (placements.length <= 2 * 3) {
                continue;
            }
            const len = placements.length;
            const lastStamps = placements[len - 2];
            const lastIndex = placements[len - 1];
            const lastTimestamp = lastStamps[lastIndex];
            // if (lastTimestamp === undefined) {
            //     continue;
            // }
            const firstStamps = placements[1];
            const firstIndex = placements[2];
            if (firstStamps[firstIndex] !== lastTimestamp) {
                for (let i = 0; i < len - 2 * 3; i += 3) {
                    const stamps = placements[i + 1];
                    const index = placements[i + 2];
                    stamps[index] = lastTimestamp;
                }
            }
        }
        // console.log('end-----------');
        // if (keys.length >= 3) {
        //     console.log(`湖北的keys:[${keys.join()}]`);
        // }
    }

    _updatePlacementStamps(stamps, index, parentStamps, parentIndex) {
        if (parentStamps[parentIndex] !== undefined) {
            if (stamps[index] === undefined) {
                stamps[index] = parentStamps[parentIndex];
            } else {
                let max = stamps[index];
                if (Math.abs(parentStamps[parentIndex]) > Math.abs(max)) {
                    stamps[index] = parentStamps[parentIndex];
                } else {
                    parentStamps[parentIndex] = stamps[index];
                }
            }
        } else if (stamps[index] !== undefined) {
            parentStamps[parentIndex] = stamps[index];
        }
    }

    _isReplacedPlacement(meshKey, index) {
        return this._replacedPlacements && this._replacedPlacements[meshKey] && this._replacedPlacements[meshKey][index];
    }

    _getCollideBoxes(mesh, start) {
        const { symbolIndex } = mesh.properties;
        const type = symbolIndex.type || 0;
        let allBoxes = mesh.properties['_collidesBoxes'];
        if (!allBoxes) {
            allBoxes = mesh.properties['_collidesBoxes'] = [];
        }
        let iconBoxes = allBoxes[symbolIndex.index];
        if (!iconBoxes) {
            iconBoxes = mesh.properties['_collidesBoxes'] = [];
        }
        if (!iconBoxes[type]) {
            iconBoxes[type] = [];
        }
        iconBoxes = iconBoxes[type];
        const index = start / 6;
        if (!iconBoxes[index]) {
            const boxes = [];
            iconBoxes[index] = {
                boxes,
                collision: { boxes }
            };
        }
        return iconBoxes[index];
    }

    _getMeshBoxes(count) {
        let meshBoxes = this._MeshBoxes;
        if (!meshBoxes) {
            meshBoxes = this._MeshBoxes = [];
        }
        if (!meshBoxes[count]) {
            meshBoxes[count] = [];
            for (let i = 0; i < count; i++) {
                meshBoxes[count][i] = {};
            }
        }
        return meshBoxes[count];
    }

    _isHalo0(mesh) {
        if (!mesh || !mesh.geometry) {
            return true;
        }
        const symbolDef = this.getSymbolDef(mesh.geometry.properties.symbolIndex);
        const hasHaloRadius = isFnTypeSymbol(symbolDef.textHaloRadius);
        if (!mesh.geometry.properties.glyphAtlas || !mesh.material.get('isHalo') || hasHaloRadius && mesh.geometry.properties.hasHalo) {
            return false;
        }
        if (hasHaloRadius && !mesh.geometry.properties.hasHalo) {
            return true;
        }
        const symbol = this.getSymbol(mesh.geometry.properties.symbolIndex);
        return !symbol.textHaloRadius;
    }
}

const UNIQUE_TOLERANCE = 10;
function getUniqueKey(key, scale) {
    return Math.round(key[0] / scale / UNIQUE_TOLERANCE) * Math.round(key[1] / scale / UNIQUE_TOLERANCE) *
        (key[2] ? Math.round(key[2] / UNIQUE_TOLERANCE) : 1) + '-' + key[3];
}

function sortByLevel(m0, m1) {
    const r = m1.properties['level'] - m0.properties['level'];
    if (r === 0) {
        return m0.properties.meshKey - m1.properties.meshKey;
    } else {
        return r;
    }
}

function bufferBox(out, box, buffer) {
    //minx, miny, maxx, maxy
    out[0] = box[0] - buffer;
    out[1] = box[1] - buffer;
    out[2] = box[2] + buffer;
    out[3] = box[3] + buffer;
    return out;

}
