import CollisionIndex from '../core/CollisionIndex';
type Constructor = new (...args: any[]) => {};
/**
 *
 * @mixin MapCollision
 */
export default function MapCollision<TBase extends Constructor>(Base: TBase): {
    new (...args: any[]): {
        _collisionIndex: CollisionIndex;
        collisionFrameTime: number;
        _uiCollidesQueue: Array<number>;
        uiList: Array<any>;
        /** @lends Map.prototype */
        /**
         * Get map scope collision index
         * @returns {CollisionIndex} collision index
         * @function MapCollision.getCollisionIndex
         */
        getCollisionIndex(): CollisionIndex;
        /**
         * Create a new collisionIndex
         * @returns {CollisionIndex} new collision index
         * @function MapCollision.createCollisionIndex
         */
        createCollisionIndex(): CollisionIndex;
        /**
         * Clear collision index
         * @returns {Map} this
         * @function MapCollision.clearCollisionIndex
         */
        clearCollisionIndex(): any;
        _insertUICollidesQueue(): any;
        uiCollides(): any;
        _addUI(ui: any): any;
        _removeUI(ui: any): number;
    };
} & TBase;
export {};
