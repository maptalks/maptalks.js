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
    }
});
