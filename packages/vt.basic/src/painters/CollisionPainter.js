import * as maptalks from 'maptalks';
import { reshader } from '@maptalks/gl';
import collisionVert from './glsl/collision.vert';
import collisionFrag from './glsl/collision.frag';
import BasicPainter from './BasicPainter';
import { clamp } from '../Util';

const DEFAULT_SCENE_CONFIG = {
    collision : true,
    fading : true,
    fadingDuration : 400,
    fadingDelay : 200
};

const UINT8 = new Uint8Array(1);

export default class CollisionPainter extends BasicPainter {
    constructor(regl, layer, sceneConfig) {
        super(regl, layer, sceneConfig);
        this.sceneConfig = maptalks.Util.extend({}, DEFAULT_SCENE_CONFIG, this.sceneConfig);
        this._fadingRecords = {};
    }

    updateBoxCollisionFading(mesh, allElements, boxCount, start, end, mvpMatrix, boxIndex) {
        const geometryProps = mesh.geometry.properties;
        const { level, meshKey } = mesh.properties;
        let collision = this._isBoxVisible(mesh, allElements, boxCount, start, end, mvpMatrix, boxIndex);
        let visible = !collision.collides;

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

        if (visible || isFading) {
            const symbol = geometryProps.symbol;
            if (!symbol[this.propIgnorePlacement]) {
                this._fillCollisionIndex(collision.boxes, mesh);
            }
        }
        if (visible) {
            const opacity = UINT8[0] = fadingOpacity * 255;
            const vertexIndexStart = allElements[start];
            if (geometryProps.aOpacity.data[vertexIndexStart] !== opacity) {
                const vertexIndexEnd = allElements[end - 1];
                for (let i = vertexIndexStart; i <= vertexIndexEnd; i++) {
                    geometryProps.aOpacity.data[i] = opacity;
                }
            }
        }
        return visible;
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
        const { fadingDuration, fadingDelay } = this.sceneConfig,
            timestamp = this.layer.getRenderer().getFrameTimestamp();
        let boxTimestamp = stamps[index],
            fadingOpacity = visible ? 1 : 0;
        if (!boxTimestamp) {
            if (visible && !(level === 0 && this._zoomFading >= 0)) {
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
                boxTimestamp = visible ? newStamp : -newStamp;
                stamps[index] = boxTimestamp;
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
                fadingOpacity = 1 - (timestamp - Math.abs(boxTimestamp)) / fadingDuration;
            }
        } else if (visible) {
            //显示fading
            if (boxTimestamp < 0) {
                //显示fading起点，记录时间戳
                stamps[index] = boxTimestamp = timestamp + fadingDelay;
            }
            fadingOpacity = (timestamp - boxTimestamp) / fadingDuration;
        } else {
            //消失fading
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

    deleteMesh(meshes) {
        if (!meshes) {
            return;
        }
        if (this._fadingRecords) {
            for (let i = 0; i < meshes.length; i++) {
                const key = meshes[i].properties.meshKey;
                delete this._fadingRecords[key];
            }
        }
        super.deleteMesh(meshes);
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
            aPosition : [],
            aVisible : [],
            indices : []
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
        super.preparePaint(context);
        if (this._zoomFading >= 0 && this._zoomMeshes) {
            const tileZoom = this.layer.getRenderer().getCurrentTileZoom();
            for (let i = 0; i < this._zoomMeshes.length; i++) {
                const mesh = this._zoomMeshes[i];
                const tileInfo = mesh.properties.tile;
                const level = tileInfo.z - tileZoom > 0 ? 2 * (tileInfo.z - tileZoom) - 1 : 2 * (tileZoom - tileInfo.z);
                mesh.properties.level = level;
                mesh.setUniform('level', level);
            }
            this.scene.addMesh(this._zoomMeshes);
        }
    }

    paint(context) {
        const status = super.paint(context);

        this._renderCollisionBox();
        return status;
    }

    callShader(uniforms) {
        this.callCurrentTileShader(uniforms);

        const map = this.getMap();
        if (map.isInteracting() && !map.isZooming() && this._zoomFading === undefined) {
            //移动或旋转地图时，不绘制背景瓦片，消除背景瓦片引起的闪烁现象
            //但有zoomFading时
            return;
        }
        this.callBackgroundTileShader(uniforms);
        if (this._zoomFading >= 0) {
            this.setToRedraw();
        }
    }

    startFrame({ timestamp }) {
        const fadingDuration = this.sceneConfig.fadingDuration;
        const zooming = this.getMap().isZooming();
        if (!zooming && this._zooming) {
            //记录zoom结束的时间戳
            this._zoomEndTimestamp = timestamp;
        }
        this._zooming = zooming;
        const timeElapsed = timestamp - (this._zoomEndTimestamp || 0);
        if (timeElapsed < fadingDuration) {
            //处于zoom结束后的fading中
            this._zoomFading = 1 - timeElapsed / fadingDuration;
        } else if (this._zoomMeshes) {
            delete this._zoomFading;
            delete this._zoomMeshes;
        }
        if (zooming) {
            //记录zooming过程中的meshes
            this._zoomMeshes = this.scene.getMeshes();
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
                    aPosition : [],
                    aVisible: []
                },
                [],
                0,
                {
                    positionSize : 2,
                    primitive : 'lines'
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
                size : [this.canvas.width, this.canvas.height]
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
            x : 0,
            y : 0,
            width : () => {
                return canvas ? canvas.width : 1;
            },
            height : () => {
                return canvas ? canvas.height : 1;
            }
        };
        this._collisionShader = new reshader.MeshShader({
            vert : collisionVert, frag : collisionFrag,
            uniforms : [
                'size'
            ],
            extraCommandProps : {
                viewport,
                depth : {
                    enable : false,
                }
            }
        });

    }
}
