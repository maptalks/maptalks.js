import Map from './Map';
import CollisionIndex from '../core/CollisionIndex';

Map.include(/** @lends Map.prototype */ {
    /**
     * Get map scope collision index
     * @returns {CollisionIndex} collision index
     */
    getCollisionIndex() {
        if (!this._collisionIndex) {
            this.createCollisionIndex();
        }
        return this._collisionIndex || this.createCollisionIndex();
    },

    /**
     * Create a new collisionIndex
     * @returns {CollisionIndex} new collision index
     */
    createCollisionIndex() {
        this.clearCollisionIndex();
        this._collisionIndex = new CollisionIndex();
        return this._collisionIndex;
    },

    /**
     * Clear collision index
     * @returns {Map} this
     */
    clearCollisionIndex() {
        this.collisionFrameTime = 0;
        if (this._collisionIndex) {
            this._collisionIndex.clear();
        }
        return this;
    },

    _uiCollides() {
        if (!this.uiList) {
            return this;
        }
        if (!this._uiCollisionIndex) {
            this._uiCollisionIndex = new CollisionIndex();
        }
        const uiCollisionIndex = this._uiCollisionIndex;
        uiCollisionIndex.clear();
        const uiList = this.uiList;
        for (let i = 0, len = uiList.length; i < len; i++) {
            const ui = uiList[i];
            const { collisionBufferSize, collision } = ui.options;
            if (!collision) {
                continue;
            }
            if (!ui.isVisible() || !ui.getDOM()) {
                continue;
            }
            const size = ui._size;
            if (!size) {
                continue;
            }
            const p = ui.getPosition();
            if (!p) {
                continue;
            }
            if (!ui.bbox) {
                ui.bbox = [0, 0, 0, 0];
            }
            const { width, height } = size;
            const minX = p.x - width / 2 - collisionBufferSize, maxX = p.x + width / 2 + collisionBufferSize;
            const minY = p.y - height / 2 - collisionBufferSize, maxY = p.y + height / 2 + collisionBufferSize;
            ui.bbox[0] = minX;
            ui.bbox[1] = minY;
            ui.bbox[2] = maxX;
            ui.bbox[3] = maxY;
            if (uiCollisionIndex.collides(ui.bbox)) {
                ui._collidesEffect(false);
                continue;
            }
            uiCollisionIndex.insertBox(ui.bbox);
            ui._collidesEffect(true);
        }
        return this;
    },

    _addUI(ui) {
        if (!this.uiList) {
            this.uiList = [];
        }
        const index = this.uiList.indexOf(ui);
        if (index > -1) {
            return this;
        }
        this.uiList.push(ui);
        this.uiList = this.uiList.sort((a, b) => {
            return b.options['collisionWeight'] - a.options['collisionWeight'];
        });
        return this;
    },

    _removeUI(ui) {
        if (!this.uiList) {
            return -1;
        }
        const index = this.uiList.indexOf(ui);
        if (index < 0) {
            return index;
        }
        this.uiList.splice(index, 1);
        return this;
    }
});
