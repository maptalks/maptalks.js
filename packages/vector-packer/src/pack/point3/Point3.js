export default class Point3 {
    constructor(point) {
        this.x = point.x;
        this.y = point.y;
        this.z = point.z || 0;
    }

    clone() { return new Point3(this); }

    _unit() {
        this._div(this.mag());
        return this;
    }

    _div(k) {
        this.x /= k;
        this.y /= k;
        this.z /= k;
        return this;
    }

    _perp() {
        var y = this.y;
        this.y = this.x;
        this.x = -y;
        return this;
    }

    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    add(p) { return this.clone()._add(p); }

    sub(p) { return this.clone()._sub(p); }

    _add(p) {
        this.x += p.x;
        this.y += p.y;
        this.z += p.z;
        return this;
    }

    _sub(p) {
        this.x -= p.x;
        this.y -= p.y;
        this.z -= p.z;
        return this;
    }

    equals(other) {
        return this.x === other.x &&
               this.y === other.y && this.z === other.z;
    }

    mult(k) {
        return this.clone()._mult(k);
    }

    _mult(k) {
        this.x *= k;
        this.y *= k;
        this.z *= k;
        return this;
    }

    dist(p) {
        return Math.sqrt(this.distSqr(p));
    }

    distSqr(p) {
        var dx = p.x - this.x,
            dy = p.y - this.y,
            dz = p.z - this.z;
        return dx * dx + dy * dy + dz * dz;
    }

    _round() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        this.z = Math.round(this.z);
        return this;
    }

    angleTo(b) {
        return Math.atan2(this.y - b.y, this.x - b.x);
    }
}
