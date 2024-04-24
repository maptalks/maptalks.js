import { extend } from './Util.js';
import Point from './Point.js';
import Segment from './Segment.js';

export default class Rect {
    constructor(x, y, width, height) {
        this.x = x || 0;
        this.y = y || 0;
        this.width = width || 0;
        this.height = height || 0;
    }

    copy(rect) {
        return new Rect(rect.x, rect.y, rect.width, rect.height);
    }

    toJSON() {
        return extend({}, this);
    }

    area() {
        return this.width * this.height;
    }

    left(left) {
        if (left != null) {
            this.x = left;
        }
        return this.x;
    }

    right(right) {
        if (right != null) {
            this.x = right - this.width;
        }
        return this.x + this.width;
    }

    top(top) {
        if (top != null) {
            this.y = top;
        }
        return this.y;
    }

    bottom(bottom) {
        if (bottom != null) {
            this.y = bottom - this.height;
        }
        return this.y + this.height;
    }

    center(center) {
        if (center != null) {
            this.x = center.x - this.width / 2;
            this.y = center.y - this.height / 2;
        }
        return new Point(this.x + this.width / 2, this.y + this.heigh / 2);
    }

    containsPoint(point) {
        let ref, ref1;
        return (this.left() <= (ref = point.x) && ref <= this.right()) && (this.top() <= (ref1 = point.y) && ref1 <= this.bottom());
    }

    containsRect(rect) {
        return this.left() <= rect.left() && rect.right() <= this.right() && this.top() <= rect.top() && rect.bottom() <= this.bottom();
    }

    getVertices() {
        return [new Point(this.left(), this.top()), new Point(this.right(), this.top()), new Point(this.right(), this.bottom()), new Point(this.left(), this.bottom())];
    }

    getSide(i) {
        const vertices = this.getVertices();
        return new Segment(vertices[i], vertices[(i + 1) % 4]);
    }

    getSectorId(point) {
        const offset = point.subtract(this.center());
        if (offset.y <= 0 && Math.abs(offset.x) <= Math.abs(offset.y)) return 0;
        if (offset.x >= 0 && Math.abs(offset.x) >= Math.abs(offset.y)) return 1;
        if (offset.y >= 0 && Math.abs(offset.x) <= Math.abs(offset.y)) return 2;
        if (offset.x <= 0 && Math.abs(offset.x) >= Math.abs(offset.y)) return 3;
        throw new Error('algorithm error');
    }

    getSector(point) {
        return this.getSide(this.getSectorId(point));
    }
}
