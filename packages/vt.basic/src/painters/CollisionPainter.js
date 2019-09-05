import * as maptalks from 'maptalks';
import { reshader } from '@maptalks/gl';
import collisionVert from './glsl/collision.vert';
import collisionFrag from './glsl/collision.frag';
import BasicPainter from './BasicPainter';
import { clamp } from '../Util';
// import { getLabelContent } from './util/get_label_content';

const DEFAULT_SCENE_CONFIG = {
    collision: true,
    fading: true,
    fadingDuration: 16 * 14,
    fadeInDelay: 600,
    fadeOutDelay: 100
};
const MESH_ANCHOR_KEY = '__meshAnchorKey';
const UINT8 = new Uint8Array(1);
const COLLISION_OFFSET_THRESHOLD = 2;
const MESH_ANCHORS = [];

export default class CollisionPainter extends BasicPainter {
    constructor(regl, layer, sceneConfig, pluginIndex) {
        super(regl, layer, sceneConfig, pluginIndex);
        this.sceneConfig = maptalks.Util.extend({}, DEFAULT_SCENE_CONFIG, this.sceneConfig);
        this._fadingRecords = {};
    }

    startMeshCollision(/* meshKey */) {
        this._canProceed = this._canProceedCollision();
    }

    endMeshCollision(meshKey) {
        const meshContext = this._collisionContext.tags[meshKey];
        if (this._canProceed && meshContext && this._isCachedCollisionStale(meshKey)) {
            const map = this.getMap();
            meshContext.anchor0 = map.containerPointToCoord(this._containerAnchor0);
            meshContext.anchor1 = map.containerPointToCoord(this._containerAnchor1);
        }
    }

    _isCachedCollisionStale(meshKey) {
        const [anchor0, anchor1] = this._getMeshAnchor(meshKey);
        //如果没有anchor，或者anchor距离它应该在的点的像素距离超过阈值时，则说明collision已经过期
        if (!anchor0 || !anchor1 ||
            anchor0.distanceTo(this._containerAnchor0) > COLLISION_OFFSET_THRESHOLD ||
            anchor1.distanceTo(this._containerAnchor1) > COLLISION_OFFSET_THRESHOLD) {
            return true;
        }
        return false;
    }

    _startCollision() {
        const map = this.getMap();
        this._coordCache = {};
        this._containerAnchor0 = new maptalks.Point(map.width / 2, map.height / 3);
        this._containerAnchor1 = new maptalks.Point(map.width / 2, map.height * 2 / 3);
        delete this._canProceed;
        if (!this._collisionContext) {
            this._collisionContext = {
                tags: {}
            };
        }
    }

    _getCachedCollision(meshKey, boxIndex) {
        const context = this._collisionContext;
        return context && context.tags[meshKey] && context.tags[meshKey][boxIndex];
    }

    _setCollisionCache(meshKey, boxIndex, value) {
        const context = this._collisionContext;
        context.tags[meshKey] = context.tags[meshKey] || {};
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
        const meshContext = this._collisionContext.tags[meshKey];
        if (meshContext && meshContext.anchor0) {
            const { anchor0, anchor1 } = meshContext;
            const key0 = anchor0[MESH_ANCHOR_KEY] = anchor0[MESH_ANCHOR_KEY] || anchor0.x + ',' + anchor0.y;
            const key1 = anchor1[MESH_ANCHOR_KEY] = anchor1[MESH_ANCHOR_KEY] || anchor1.x + ',' + anchor1.y;
            let cp0 = this._coordCache[key0];
            let cp1 = this._coordCache[key1];
            if (!cp0 || !cp1) {
                const map = this.getMap();
                cp0 = this._coordCache[key0] = map.coordToContainerPoint(anchor0);
                cp1 = this._coordCache[key1] = map.coordToContainerPoint(anchor1);
            }
            MESH_ANCHORS[0] = cp0;
            MESH_ANCHORS[1] = cp1;
            return MESH_ANCHORS;
        } else {
            MESH_ANCHORS[0] = MESH_ANCHORS[1] = null;
        }
        return MESH_ANCHORS;
    }

    updateBoxCollisionFading(boxVisible, mesh, allElements, boxCount, start, end, mvpMatrix, boxIndex) {
        const { level, meshKey, tile } = mesh.properties;
        const layer = this.layer;
        const renderer = layer.getRenderer();
        if (this.shouldIgnoreBgTiles() && !renderer.isCurrentTile(tile.id)) {
            return false;
        }
        //地图缩小时限制绘制的box数量，以及fading时，父级瓦片中的box数量，避免大量的box绘制，提升缩放的性能
        if (this.shouldLimitBox(tile.id) && boxIndex > layer.options['boxLimitOnZoomout']) {
            return false;
        }
        if (this.isEnableUniquePlacement() && this._isReplacedPlacement(meshKey, boxIndex)) {
            return false;
        }
        const { symbol } = mesh.geometry.properties;
        //为了解决缩小地图时，大量文字会突然挤在一起

        const canProceed = (this._zoomingOut && !renderer.isCurrentTile(tile.id) || this._canProceed);

        let visible = false;
        let collision = this._getCachedCollision(meshKey, boxIndex);
        //如果不允许proceed，则沿用缓存的 collision
        if (boxVisible && canProceed) {
            if (!this._isCachedCollisionStale(meshKey)) {
                collision = null;
            }

            if (!collision) {
                const map = this.getMap();
                const now = performance.now();
                collision = this._isBoxVisible(mesh, allElements, boxCount, start, end, mvpMatrix, boxIndex);
                map.collisionFrameTime += performance.now() - now;

                this._setCollisionCache(meshKey, boxIndex, collision);
            } else if (collision.boxes) {
                //因为可能有新的boxes加入场景，所以要重新检查缓存中的box是否有collides
                const { boxes } = collision;
                let collides = 0;
                let offscreenCount = 0;
                for (let i = 0; i < boxes.length; i++) {
                    if (!collides) {
                        const boxCollides = this.isCollides(boxes[i], tile);
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
                collision.collides = collides;
            }
        }

        const stamps = this._getBoxTimestamps(meshKey);
        // const current = stamps[boxIndex];
        // if (getLabelContent(mesh, allElements[start]) === '汉阳大道') {
        //     // console.log('湖北', renderer.isCurrentTile(tile.id), collision && collision.collides, stamps[boxIndex]);
        //     console.log('汉阳大道', tile.z, collision && collision.collides, stamps[boxIndex]);
        // }
        visible = boxVisible && collision && collision.collides === 0;

        let fadingOpacity = 1;
        let isFading = false;
        if (this.sceneConfig.fading) {
            if (renderer.isCurrentTile(tile.id)) {
                delete mesh._fadeOutStartTime;
            }
            // const stamps = this._getBoxTimestamps(meshKey);
            fadingOpacity = this._getBoxFading(tile.id, visible, stamps, boxIndex);
            //level <= 2，或者level较大，但存在unique placement时，就不直接隐藏
            if (level <= 2) {
                if (fadingOpacity > 0) {
                    visible = true;
                }
                isFading = this.isBoxFading(meshKey, boxIndex);
                if (isFading) {
                    this.setToRedraw();
                }
            } else if (!visible) {
                //未解决zoom in 过程中，大量box挤在一起，造成的用户体验不佳的问题
                //当瓦片层级与当前层级相差较大，则跳过fading阶段，立即隐藏有collision的box
                this._markFadingCollided(stamps, boxIndex);
                fadingOpacity = 0;
            }
            if (visible) {
                const fadeOutStart = mesh._fadeOutStartTime;
                if (fadeOutStart && fadingOpacity === 1 && stamps[boxIndex] > 0) {
                    // console.log(fadingOpacity);
                    const { fadeOutDelay, fadingDuration } = this.sceneConfig;
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
        if (/*renderer.isCurrentTile(tile.id) && */collision && layer.options['debugCollision']) {
            this.addCollisionDebugBox(collision.boxes, collision.collides ? 0 : 1);
        }

        if (visible || isFading) {
            if (canProceed && !symbol[this.propIgnorePlacement] && collision && collision.boxes) {
                // if (getLabelContent(mesh, allElements[start]) === 'Indonesia') {
                //     console.log(renderer.getFrameTimestamp(), meshKey, JSON.stringify(collision.boxes));
                // }
                this._fillCollisionIndex(collision.boxes, mesh);
            }
        }
        if (visible) {
            const opacity = UINT8[0] = fadingOpacity * 255;
            this.setCollisionOpacity(mesh, allElements, opacity, start, end, boxIndex);
        }
        // if (getLabelContent(mesh, allElements[start]) === '太字湖路') {
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

    isBoxFading(key, boxIndex) {
        const timestamp = this.layer.getRenderer().getFrameTimestamp(),
            fadingDuration = this.sceneConfig.fadingDuration;
        const boxTimestamp = Math.abs(this._getBoxTimestamps(key)[boxIndex]);
        return timestamp - boxTimestamp < fadingDuration;
    }


    _isBoxVisible(mesh, elements, boxCount, start, end, mvpMatrix, boxIndex) {
        const symbol = mesh.geometry.properties.symbol;
        if (symbol[this.propIgnorePlacement] && symbol[this.propAllowOverlap]) {
            return true;
        }
        const collision = this.isBoxCollides(mesh, elements, boxCount, start, end, mvpMatrix, boxIndex);
        if (symbol[this.propAllowOverlap]) {
            collision.collides = 0;
        }
        return collision;
    }

    _fillCollisionIndex(boxes, mesh) {
        if (Array.isArray(boxes[0])) {
            for (let i = 0; i < boxes.length; i++) {
                this.insertCollisionBox(boxes[i], mesh.properties.tile);
            }
        } else {
            this.insertCollisionBox(boxes, mesh.properties.tile);
        }
    }

    _getBoxFading(tileId, visible, stamps, index) {
        //level大于0，不fading
        const { fadingDuration, fadeInDelay, fadeOutDelay } = this.sceneConfig;
        const renderer = this.layer.getRenderer();
        const timestamp = renderer.getFrameTimestamp();
        let boxTimestamp = stamps[index];
        let fadingOpacity = visible ? 1 : 0;
        if (!boxTimestamp) {
            // const zooming = this.getMap().isZooming();
            // if (visible && level === 0 && this._zoomFading === undefined) {
            if (visible && renderer.isCurrentTile(tileId)/* && !zooming*/) {
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

    _getBoxTimestamps(key) {
        if (!this._fadingRecords[key]) {
            this._fadingRecords[key] = {};
        }
        return this._fadingRecords[key];
    }

    _markFadingCollided(stamps, index) {
        if (!stamps) {
            return;
        }
        const framestamp = this.layer.getRenderer().getFrameTimestamp();
        const { fadingDuration } = this.sceneConfig;
        stamps[index] = -(framestamp - fadingDuration - 1);
    }


    deleteMesh(meshes, keepGeometry) {
        if (!meshes) {
            return;
        }
        if (Array.isArray(meshes)) {
            for (let i = 0; i < meshes.length; i++) {
                const key = meshes[i].properties.meshKey;
                if (this._fadingRecords) delete this._fadingRecords[key];
                if (this._collisionContext) delete this._collisionContext.tags[key];
            }
        } else {
            const key = meshes.properties.meshKey;
            if (this._fadingRecords) delete this._fadingRecords[key];
            if (this._collisionContext) delete this._collisionContext.tags[key];
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
     * @returns {Number} 1: 存在; 0: 不存在; 0: 在屏幕之外
     */
    isCollides(box/*, tileInfo*/) {
        const layer = this.layer,
            map = layer.getMap();
        if (map.isOffscreen(box)) {
            return -1;
        }
        // const isBackground = layer.getRenderer().isCurrentTile(tileInfo.id);
        // const collisionIndex = isBackground ? layer.getBackgroundCollisionIndex() : layer.getCollisionIndex();
        const collisionIndex = layer.getCollisionIndex();
        return +collisionIndex.collides(box);
    }

    insertCollisionBox(box/*, tileInfo*/) {
        const layer = this.layer;
        // const isBackground = layer.getRenderer().isCurrentTile(tileInfo.id);
        // const collisionIndex = isBackground ? layer.getBackgroundCollisionIndex() : layer.getCollisionIndex();
        const collisionIndex = layer.getCollisionIndex();
        collisionIndex.insertBox(box);
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
        const map = this.getMap();
        if (map.isOffscreen(box)) {
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

    preparePaint(context) {
        this._prepareZoomEndMeshes();
        if (this._zoomEndMeshes) {
            this._updateZoomMeshesLevel();
            if (this._zoomEndMeshes) {
                this.scene.addMesh(this._zoomEndMeshes);
            }
        }
        this._updateUniquePlacements();
        this._mergeUniquePlacements(this.scene.getMeshes());
        super.preparePaint(context);
        this._startCollision();
    }

    paint(context) {
        const status = super.paint(context);

        this._renderCollisionBox();
        if (this._canProceed === false) {
            this.setToRedraw();
        }
        return status;
    }

    callShader(uniforms) {
        this.callCurrentTileShader(uniforms);

        if (this.shouldIgnoreBgTiles()) {
            //移动或旋转地图时，不绘制背景瓦片，消除背景瓦片引起的闪烁现象
            //但有zoomFading时
            return;
        }
        this.callBackgroundTileShader(uniforms);
    }

    shouldIgnoreBgTiles() {
        // return false;
        const map = this.getMap();
        return !map.isZooming() && !this._zoomEndMeshes;
    }

    shouldLimitBox(tileKey, ignoreZoomOut) {
        const map = this.getMap();
        const renderer = this.layer.getRenderer();
        return !map.options['seamlessZoom'] &&
            this.layer.options['boxLimitOnZoomout'] &&
            (ignoreZoomOut || this._zoomingOut) &&
            (map.isZooming() || this._zoomEndTimestamp !== undefined && !renderer.isCurrentTile(tileKey));
    }

    _prepareZoomEndMeshes() {
        delete this._zoomingOut;
        const map = this.getMap();
        const zooming = map.isZooming();
        if (!zooming && this._zooming) {
            //记录zoom结束的时间戳
            const renderer = this.layer.getRenderer();
            this._zoomEndMeshes = this.scene.getMeshes().filter(m => !renderer.isCurrentTile(m.properties.tile.id));
        } else if (zooming && !this._zooming) {
            this._preRes = map.getResolution();
        }
        this._zooming = zooming;
        if (zooming) {
            this._zoomingOut = this._preRes && map.getResolution() > this._preRes;
        }
    }

    _renderCollisionBox() {
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
            this._collisionScene
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
        const { fadeOutDelay, fadingDuration } = this.sceneConfig;
        const renderer = this.layer.getRenderer();
        const tileZoom = renderer.getCurrentTileZoom();
        const timestamp = renderer.getFrameTimestamp();
        const meshes = [];
        for (let i = 0; i < this._zoomEndMeshes.length; i++) {
            const mesh = this._zoomEndMeshes[i];
            const tileInfo = mesh.properties.tile;
            if (!mesh._fadeOutStartTime && !renderer.isBackTile(tileInfo.id)) {
                mesh._fadeOutStartTime = timestamp;
            }
            //需要更新zoom meshes 的level，让他们改为在background阶段绘制
            const level = (tileInfo.z - tileZoom) > 0 ? 2 * (tileInfo.z - tileZoom) - 1 : 2 * (tileZoom - tileInfo.z);
            mesh.properties.level = level;
            mesh.setUniform('level', level);
            if (renderer.isCurrentTile(tileInfo.id) ||
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
        return this.layer.options['collision'] && this.sceneConfig['collision'] !== false;
    }

    isEnableUniquePlacement() {
        return this.sceneConfig['uniquePlacement'] !== false;
    }

    isMeshUniquePlaced(mesh) {
        return this.isMeshIterable(mesh);
    }

    _updateUniquePlacements() {
        if (!this.isEnableUniquePlacement()) {
            return;
        }
        const meshes = this.scene.getMeshes();
        const fn = (mesh, start, end, matrix, boxIndex) => {
            //初始化label，
            const elements = mesh.geometry.properties.elements;
            let placements = mesh.geometry.properties.uniquePlacements;
            if (!placements) {
                placements = mesh.geometry.properties.uniquePlacements = [];
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
            this.forEachBox(mesh, mesh.geometry.properties.elements, fn);
        }
    }

    _mergeUniquePlacements(meshes) {
        if (!this.isEnableUniquePlacement()) {
            return;
        }
        this._replacedPlacements = {};
        meshes = meshes.sort(sortByLevel);
        const scale = this.getMap().getGLScale();
        const allPlacements = {};
        // let hubeiKey;
        // const keys = [];
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            const { uniquePlacements } = mesh.geometry.properties;
            if (!uniquePlacements) {
                continue;
            }

            for (let j = 0; j < uniquePlacements.length; j++) {
                if (!uniquePlacements[j]) {
                    continue;
                }
                const meshKey = mesh.properties.meshKey;
                const { key, index/*, start*/ } = uniquePlacements[j];
                const stamps = this._getBoxTimestamps(meshKey);

                const uKey = getUniqueKey(key, scale);

                // console.log(uKey, mesh.uniforms.level);
                // if (getLabelContent(mesh, start) === 'Indonesia') {
                //     keys.push(uKey);
                //     if (!hubeiKey) {
                //         hubeiKey = uKey;
                //     } else if (hubeiKey !== uKey) {
                //         console.log('Indonesia miss', hubeiKey, uKey);
                //     }
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
}

const UNIQUE_TOLERANCE = 8;
function getUniqueKey(key, scale) {
    return Math.round(key[0] / scale / UNIQUE_TOLERANCE) * Math.round(key[1] / scale / UNIQUE_TOLERANCE) *
        (key[2] ? Math.round(key[2] / UNIQUE_TOLERANCE) : 1) + '-' + key[3];
}

function sortByLevel(m0, m1) {
    const r = m1.uniforms['level'] - m0.uniforms['level'];
    if (r === 0) {
        return m0.properties.meshKey.localeCompare(m1.properties.meshKey);
    } else {
        return r;
    }
}
