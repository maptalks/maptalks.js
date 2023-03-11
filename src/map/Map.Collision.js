import Map from './Map';
import CollisionIndex from '../core/CollisionIndex';

const UICollisionIndex = new CollisionIndex();

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

    _insertUICollidesQueue() {
        if (!this._uiCollidesQueue) {
            this._uiCollidesQueue = [];
        }
        this._uiCollidesQueue.push(1);
        return this;
    },

    uiCollides() {
        if (!this.uiList || this.uiList.length === 0 || !this._uiCollidesQueue || this._uiCollidesQueue.length === 0) {
            return this;
        }
        const collisionIndex = UICollisionIndex;
        collisionIndex.clear();
        const uiList = this.uiList;
        for (let i = 0, len = uiList.length; i < len; i++) {
            const ui = uiList[i];
            const { collisionBufferSize, collision } = ui.options;
            if (!collision) {
                continue;
            }
            const dom = ui.getDOM();
            if (!ui.isVisible() || !dom) {
                continue;
            }
            if (!dom.getBoundingClientRect) {
                continue;
            }
            if (!ui.bbox) {
                ui.bbox = [0, 0, 0, 0];
            }
            //https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
            const bcRect = dom.getBoundingClientRect();
            const { x, y } = bcRect;
            let { width, height } = bcRect;
            // fix 1904
            //in firefox,the dom init Cannot get width and height,why? I don't know either
            //该问题仅仅发生在dom刚加入文档流,后期是可以正常获取到的
            if (width === 0 || height === 0) {
                const size = ui.getSize();
                if (size) {
                    width = size.width;
                    height = size.height;
                }
            }
            const minX = x - collisionBufferSize, maxX = x + width + collisionBufferSize;
            const minY = y - collisionBufferSize, maxY = y + height + collisionBufferSize;
            ui.bbox[0] = minX;
            ui.bbox[1] = minY;
            ui.bbox[2] = maxX;
            ui.bbox[3] = maxY;
            if (collisionIndex.collides(ui.bbox)) {
                ui._collidesEffect(false);
                continue;
            }
            collisionIndex.insertBox(ui.bbox);
            ui._collidesEffect(true);
        }
        this._uiCollidesQueue = [];
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
        return index;
    }
});
