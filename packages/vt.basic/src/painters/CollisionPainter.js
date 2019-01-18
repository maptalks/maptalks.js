import * as maptalks from 'maptalks';
import { reshader } from '@maptalks/gl';
import collisionVert from './glsl/collision.vert';
import collisionFrag from './glsl/collision.frag';
import BasicPainter from './BasicPainter';
import { clamp } from '../Util';

const DEFAULT_SCENE_CONFIG = {
    collision : true,
    fadingDuration : 400,
    fadingDelay : 200
};

export default class CollisionPainter extends BasicPainter {
    constructor(regl, layer, sceneConfig) {
        super(regl, layer, sceneConfig);
        this.sceneConfig = maptalks.Util.extend({}, DEFAULT_SCENE_CONFIG, this.sceneConfig);
        this._fadingRecords = {};
    }

    updateBoxCollisionFading(mesh, allElements, boxCount, start, end, mvpMatrix, boxIndex) {
        const timestamp = this.layer.getRenderer().getFrameTimestamp(),
            geometryProps = mesh.geometry.properties,
            fadingDuration = this.sceneConfig.fadingDuration;
        const key = mesh.properties.meshKey;
        let visible = this._isBoxVisible(mesh, allElements, boxCount, start, end, mvpMatrix);
        const fadingOpacity = this._getBoxFading(visible, this._getBoxTimestamps(key), boxIndex);
        if (fadingOpacity > 0) {
            visible = true;
        }
        const vertexIndexStart = allElements[start],
            vertexIndexEnd = allElements[end - 1];
        for (let i = vertexIndexStart; i <= vertexIndexEnd; i++) {
            geometryProps.aOpacity.data[i] = fadingOpacity * 255;
        }

        const boxTimestamp = this._getBoxTimestamps(key)[boxIndex];
        if ((timestamp - Math.abs(boxTimestamp)) < fadingDuration) {
            //fading 动画没结束时，设置重绘
            this.setToRedraw();
        }
        return visible;
    }


    _isBoxVisible(mesh, elements, boxCount, start, end, mvpMatrix) {
        const symbol = mesh.geometry.properties.symbol;
        if (symbol[this.propIgnorePlacement] && symbol[this.propAllowOverlap]) {
            return true;
        }
        const boxes = this.isBoxCollides(mesh, elements, boxCount, start, end, mvpMatrix);
        if ((!boxes || !boxes.length) && !symbol[this.propAllowOverlap]) {
            //boxes为null或为空数组，说明collides
            return false;
        }
        if (!symbol[this.propIgnorePlacement]) {
            if (Array.isArray(boxes[0])) {
                for (let i = 0; i < boxes.length; i++) {
                    this.insertCollisionBox(boxes[i]);
                }
            } else {
                this.insertCollisionBox(boxes);
            }
        }
        return true;
    }

    _getBoxFading(visible, stamps, index) {
        const { fadingDuration, fadingDelay } = this.sceneConfig,
            timestamp = this.layer.getRenderer().getFrameTimestamp();
        let boxTimestamp = stamps[index],
            fadingOpacity = visible ? 1 : 0;
        if (!boxTimestamp && !visible) {
            return 0;
        }

        if (boxTimestamp && (timestamp - Math.abs(boxTimestamp) < fadingDuration)) {
            //fading过程中，不管visible是否改变，继续计算原有的fadingOpacity
            if (boxTimestamp > 0) {
                //显示fading
                fadingOpacity = (timestamp - boxTimestamp) / fadingDuration;
            } else {
                //消失fading
                fadingOpacity = 1 - (timestamp - Math.abs(boxTimestamp)) / fadingDuration;
            }
        } else if (!visible) {
            //消失fading
            if (boxTimestamp > 0) {
                //消失fading起点，记录时间戳
                stamps[index] = boxTimestamp = -(timestamp + fadingDelay);
            }
            fadingOpacity = 1 - (timestamp + boxTimestamp) / fadingDuration;
        } else {
            //显示fading
            if (!boxTimestamp || boxTimestamp < 0) {
                //显示fading起点，记录时间戳
                stamps[index] = boxTimestamp = timestamp + fadingDelay;
            }
            fadingOpacity = (timestamp - boxTimestamp) / fadingDuration;
        }
        fadingOpacity = clamp(fadingOpacity, 0, 1);
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
        for (let i = 0; i < meshes.length; i++) {
            const key = meshes[i].properties.meshKey;
            delete this._fadingRecords[key];
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

    isCollides(box) {
        const map = this.layer.getMap();
        if (map.isOffscreen(box)) {
            return true;
        }
        const collisionIndex = this.layer.getCollisionIndex();
        return collisionIndex.collides(box);
    }

    insertCollisionBox(box) {
        const collisionIndex = this.layer.getCollisionIndex();
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
        const map = this.layer.getMap();
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

    paint(context) {
        const status = super.paint(context);

        this._renderCollisionBox();

        return status;
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
        // debugger
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
