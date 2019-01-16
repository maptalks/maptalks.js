import { reshader } from '@maptalks/gl';
import collisionVert from './glsl/collision.vert';
import collisionFrag from './glsl/collision.frag';
import BasicPainter from './BasicPainter';

export default class CollisionPainter extends BasicPainter {

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

    addCollisionDebugBox(boxes, visible) {
        const allBoxes = this._collisionBoxes = this._collisionBoxes || {
            aPosition : [],
            aVisible : [],
            indices : []
        };
        const map = this.layer.getMap();
        for (let i = 0; i < boxes.length; i++) {
            const box = boxes[i];
            if (map.isOffscreen(box)) {
                continue;
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
