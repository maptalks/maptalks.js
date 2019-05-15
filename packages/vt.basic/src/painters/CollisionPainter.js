import * as maptalks from 'maptalks';
import { reshader } from '@maptalks/gl';
import collisionVert from './glsl/collision.vert';
import collisionFrag from './glsl/collision.frag';
import BasicPainter from './BasicPainter';
import { clamp } from '../Util';

const DEFAULT_SCENE_CONFIG = {
    collision: true,
    fading: true,
    fadingDuration: 400,
    fadingDelay: 200
};

const UINT8 = new Uint8Array(1);
const COLLISION_OFFSET_THRESHOLD = 2;

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
        if (!anchor0 || anchor0.distanceTo(this._containerAnchor0) > COLLISION_OFFSET_THRESHOLD ||
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
        const limit = this.layer.options['collisionFrameLimit'];
        return map.collisionFrameTime <= limit;
    }

    _getMeshAnchor(meshKey) {
        const meshContext = this._collisionContext.tags[meshKey];
        if (meshContext && meshContext.anchor0) {
            const key0 = meshContext.anchor0.toArray().join();
            const key1 = meshContext.anchor1.toArray().join();
            let anchor0 = this._coordCache[key0];
            let anchor1 = this._coordCache[key1];
            if (!anchor0) {
                const map = this.getMap();
                anchor0 = this._coordCache[key0] = map.coordToContainerPoint(meshContext.anchor0);
                anchor1 = this._coordCache[key1] = map.coordToContainerPoint(meshContext.anchor1);
            }
            return [anchor0, anchor1];
        }
        return [];
    }

    updateBoxCollisionFading(mesh, allElements, boxCount, start, end, mvpMatrix, boxIndex) {
        const { level, meshKey } = mesh.properties;
        //没有缩放，且没在fading时，禁止父级瓦片的绘制，避免不正常的闪烁现象
        if (this.shouldIgnoreBgTiles() && level > 0) {
            return false;
        }
        //地图缩小时限制绘制的box数量，以及fading时，父级瓦片中的box数量，避免大量的box绘制，提升缩放的性能
        if (this.shouldLimitBox(level) && boxIndex > this.layer.options['boxLimitOnZoomout']) {
            return false;
        }
        const map = this.getMap();
        const { symbol, aOpacity } = mesh.geometry.properties;


        let collision = this._getCachedCollision(meshKey, boxIndex);
        let visible = false;
        let isUpdate = false;
        if (!collision || this._isCachedCollisionStale(meshKey)) {
            //没有collision，或collision已经过期
            isUpdate = true;
        }
        if (isUpdate && this._canProceed) {
            const now = performance.now();
            collision = this._isBoxVisible(mesh, allElements, boxCount, start, end, mvpMatrix, boxIndex);
            map.collisionFrameTime += performance.now() - now;

            this._setCollisionCache(meshKey, boxIndex, collision);
        }
        visible = collision && collision.collides === false;

        let fadingOpacity = 1;
        let isFading = false;
        if (this.sceneConfig.fading) {
            fadingOpacity = this._getBoxFading(visible, this._getBoxTimestamps(meshKey), boxIndex, level);
            if (fadingOpacity > 0) {
                visible = true;
            }
            isFading = this.isBoxFading(meshKey, boxIndex);
            if (isFading) {
                this.setToRedraw();
            }
        }

        if (this._canProceed && collision && this.layer.options['debugCollision']) {
            this.addCollisionDebugBox(collision.boxes, collision.collides ? 0 : 1);
        }

        if (visible || isFading) {
            if (this._canProceed && !symbol[this.propIgnorePlacement] && collision.boxes) {
                this._fillCollisionIndex(collision.boxes, mesh);
            }
        }
        if (visible) {
            const opacity = UINT8[0] = fadingOpacity * 255;
            this.setCollisionOpacity(mesh, allElements, aOpacity, opacity, start, end, boxIndex);
        }
        return visible;
    }

    setCollisionOpacity(mesh, allElements, aOpacity, value, start, end) {
        const vertexIndexStart = allElements[start];
        if (aOpacity[vertexIndexStart] !== value) {
            const vertexIndexEnd = allElements[end - 1];
            for (let i = vertexIndexStart; i <= vertexIndexEnd; i++) {
                aOpacity[i] = value;
            }
            aOpacity._dirty = true;
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
            collision.collides = false;
        }
        return collision;
    }

    _fillCollisionIndex(boxes, mesh) {
        if (Array.isArray(boxes[0])) {
            for (let i = 0; i < boxes.length; i++) {
                this.insertCollisionBox(boxes[i], mesh.geometry.properties.z);
            }
        } else {
            this.insertCollisionBox(boxes, mesh.geometry.properties.z);
        }
    }

    _getBoxFading(visible, stamps, index, level) {
        //level大于0，不fading
        const { fadingDuration, fadingDelay } = this.sceneConfig;
        const timestamp = this.layer.getRenderer().getFrameTimestamp();
        let boxTimestamp = stamps[index];
        let fadingOpacity = visible ? 1 : 0;
        if (!boxTimestamp) {
            const zooming = this.getMap().isZooming();
            // if (visible && level === 0 && this._zoomFading === undefined) {
            if (visible && level === 0 && !zooming) {
                //第一次显示
                stamps[index] = timestamp + fadingDelay;
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
                stamps[index] = boxTimestamp = timestamp + fadingDelay;
            }
            fadingOpacity = (timestamp - boxTimestamp) / fadingDuration;
        } else {
            //消失fading开始
            if (boxTimestamp > 0) {
                //消失fading起点，记录时间戳
                stamps[index] = boxTimestamp = -(timestamp + fadingDelay);
            }
            fadingOpacity = 1 - (timestamp + boxTimestamp) / fadingDuration;
        }

        if (fadingOpacity < 0 || fadingOpacity > 1) {
            fadingOpacity = clamp(fadingOpacity, 0, 1);
        }
        if (level > 0 && this._zoomFading >= 0) {
            fadingOpacity *= this._zoomFading;
        }
        return fadingOpacity;
    }

    _getBoxTimestamps(key) {
        if (!this._fadingRecords[key]) {
            this._fadingRecords[key] = {};
        }
        return this._fadingRecords[key];
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
    isCollides(box, meshTileZoom) {
        const layer = this.layer,
            map = layer.getMap();
        if (map.isOffscreen(box)) {
            return -1;
        }
        const isBackground = layer.getRenderer().getCurrentTileZoom() !== meshTileZoom;
        const collisionIndex = isBackground ? layer.getBackgroundCollisionIndex() : layer.getCollisionIndex();
        return +collisionIndex.collides(box);
    }

    insertCollisionBox(box, meshTileZoom) {
        const layer = this.layer;
        const isBackground = layer.getRenderer().getCurrentTileZoom() !== meshTileZoom;
        const collisionIndex = isBackground ? layer.getBackgroundCollisionIndex() : layer.getCollisionIndex();
        collisionIndex.insertBox(box.slice(0));
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
        if (this._zoomFading >= 0 && this._zoomMeshes) {
            this._updateZoomMeshesLevel();
            this.scene.addMesh(this._zoomMeshes);
        }
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
        if (this._zoomFading >= 0) {
            this.setToRedraw();
        }
    }

    shouldIgnoreBgTiles() {
        const map = this.getMap();
        return !map.isZooming() && this._zoomFading === undefined;
    }

    shouldLimitBox(level, ignoreZoomOut) {
        const map = this.getMap();
        return this.layer.options['boxLimitOnZoomout'] &&
            (ignoreZoomOut || this._zoomingOut) &&
            (map.isZooming() || this._zoomEndTimestamp !== undefined && level > 0);
    }

    startFrame({ timestamp }) {
        const map = this.getMap();
        const { fadingDuration } = this.sceneConfig;
        const zooming = map.isZooming();
        if (!zooming && this._zooming) {
            //记录zoom结束的时间戳
            this._zoomEndTimestamp = timestamp;
            // console.log('zoom end frame');
        } else if (zooming && !this._zooming) {
            // debugger
            this._preRes = map.getResolution();
        }
        this._zooming = zooming;
        const timeElapsed = timestamp - (this._zoomEndTimestamp || 0);
        if (timeElapsed < fadingDuration) {
            //处于zoom结束后的fading中
            this._zoomFading = 1 - timeElapsed / fadingDuration;
            // console.log('fading');
        } else if (this._zoomEndTimestamp) {
            delete this._zoomFading;
            delete this._zoomMeshes;
            delete this._zoomEndTimestamp;
            delete this._preRes;
            delete this._zoomingOut;
            // console.log('fading ended');
        }
        if (zooming) {
            //记录zooming过程中的meshes
            this._zoomMeshes = this.scene.getMeshes();

            this._zoomingOut = this._preRes && map.getResolution() > this._preRes;
        }
        super.startFrame();
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
                }
            }
        });

    }

    _updateZoomMeshesLevel() {
        const tileZoom = this.layer.getRenderer().getCurrentTileZoom();
        for (let i = 0; i < this._zoomMeshes.length; i++) {
            const mesh = this._zoomMeshes[i];
            const tileInfo = mesh.properties.tile;
            //需要更新zoom meshes 的level，让他们改为在background阶段绘制
            const level = (tileInfo.z - tileZoom) > 0 ? 2 * (tileInfo.z - tileZoom) - 1 : 2 * (tileZoom - tileInfo.z);
            mesh.properties.level = level;
            mesh.setUniform('level', level);
        }
    }
}
