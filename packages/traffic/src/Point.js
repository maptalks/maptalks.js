export default class Point {
    constructor(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }

    get length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    get direction() {
        return Math.atan2(this.y, this.x);
    }

    get normalized() {
        return new Point(this.x / this.length, this.y / this.length);
    }

    add(point) {
        return new Point(this.x + point.x, this.y + point.y);
    }

    subtract(point) {
        return new Point(this.x - point.x, this.y - point.y);
    }

    mult(ratio) {
        return new Point(this.x * ratio, this.y * ratio);
    }

    divide(ratio) {
        return new Point(this.x / ratio, this.y / ratio);
    }
}
