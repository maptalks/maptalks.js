import { vec4 } from '@maptalks/gl';
import rbush from 'rbush';

//temp
const VEC = [];

/**
 * 碰撞检测的实现思路：
 * 1. 在layer上创建collsionIndex
 * 2. painter中查询collisionIndex中是否有命中
 *   2.1 如果有，则从elements中删除当前item
 *   2.2 如果没有，如果需要的，insert到collisionIndex中
 */

/**
 *
 */
class CollisionIndex {
    constructor(map, viewportPadding) {
        this._tree = rbush(9, ['[0]', '[1]', '[2]', '[3]']);
        this._map = map;
        this.viewportPadding = viewportPadding;
    }

    //minx, miny, maxx, maxy
    placeBox(out, x1, y1, x2, y2) {
        vec4.set(VEC, x1, y1, x2, y2);
        if (this._tree.collides(VEC)) {
            return null;
        }
        out[0] = x1;
        out[1] = y1;
        out[2] = x2;
        out[3] = y2;
        return out;
    }

    /**
     * Insert box in collision index
     */
    insertBox(box) {
        const tree = this._grid;
        tree.insert([box[0], box[1], box[2], box[3]]);
    }

    isOffscreen(x1, y1, x2, y2) {
        const { width, height } = this._map;
        const viewportPadding = this.viewportPadding;
        const screenRightBoundary = width + viewportPadding;
        const screenBottomBoundary = height + viewportPadding;
        return x2 < viewportPadding || x1 >= screenRightBoundary || y2 < viewportPadding || y1 > screenBottomBoundary;
    }

    clear() {
        this._tree.clear();
    }
}

export default CollisionIndex;
