/**
 * 碰撞检测的实现思路：
 * 1. 选择 collsionIndex
 *    1.1 如果 collision scope 是 layer，则在layer上创建
 *    1.2 如果 collision scope 是 map, 则直接使用map的collisionIndex
 * 2. painter中查询collisionIndex中是否有命中
 *   2.1 如果有，则从 elements 中删除当前item
 *   2.2 如果没有，如果需要的，insert到collisionIndex中
 * @category core
 */
declare class CollisionIndex {
    _tree: any;
    constructor();
    /**
     * Test if given box is collided with any other
     * @param {Number[]} box - [minx, miny, maxx, maxy]
     * @returns {Boolean}
     */
    collides(box: any): any;
    /**
     * Insert box in collision index
     * @param {Number[]} box - [minx, miny, maxx, maxy]
     * @returns {CollisionIndex} this
     */
    insertBox(box: any): this;
    /**
     * Bulk insert boxes in collision index
     * Powered by rbush, it will perform better in subsquent query
     * @param {Number[][]} boxes - [[minx, miny, maxx, maxy], ...]
     * @returns {CollisionIndex} this
     */
    bulkInsertBox(boxes: any): this;
    /**
     * Clear the collision index
     * @returns {CollisionIndex} this
     */
    clear(): this;
}
export default CollisionIndex;
