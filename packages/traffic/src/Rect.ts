import Point from "./Point";
import Segment from "./Segment";

export default class Rect {
  x = 0;
  y = 0;
  width = 0;
  height = 0;

  constructor(x?: number, y?: number, width?: number, height?: number) {
    this.x = x || 0;
    this.y = y || 0;
    this.width = width || 0;
    this.height = height || 0;
  }

  static copy(rect: Rect) {
    return new Rect(rect.x, rect.y, rect.width, rect.height);
  }

  toJSON() {
    return Object.assign({}, this);
  }

  area() {
    return this.width * this.height;
  }

  left(left?: number) {
    if (left !== undefined) {
      this.x = left;
    }

    return this.x;
  }

  right(right?: number) {
    if (right !== undefined) {
      this.x = right - this.width;
    }

    return this.x + this.width;
  }

  top(top?: number) {
    if (top !== undefined) {
      this.y = top;
    }

    return this.y;
  }

  bottom(bottom?: number) {
    if (bottom !== undefined) {
      this.y = bottom - this.height;
    }

    return this.y + this.height;
  }

  center(center?: { x: number; y: number }) {
    if (center !== undefined) {
      this.x = center.x - this.width / 2;
      this.y = center.y - this.height / 2;
    }

    return new Point(this.x + this.width / 2, this.y + this.height / 2);
  }

  containsPoint(point: Point) {
    let ref: number, ref1: number;
    return (
      this.left() <= (ref = point.x) &&
      ref <= this.right() &&
      this.top() <= (ref1 = point.y) &&
      ref1 <= this.bottom()
    );
  }

  containsRect(rect: Rect) {
    return (
      this.left() <= rect.left() &&
      rect.right() <= this.right() &&
      this.top() <= rect.top() &&
      rect.bottom() <= this.bottom()
    );
  }

  getVertices() {
    return [
      new Point(this.left(), this.top()),
      new Point(this.right(), this.top()),
      new Point(this.right(), this.bottom()),
      new Point(this.left(), this.bottom()),
    ];
  }

  getSide(i: number) {
    const vertices = this.getVertices();
    return new Segment(vertices[i], vertices[(i + 1) % 4]);
  }

  getSectorId(point: Point) {
    const offset = point.subtract(this.center());
    if (offset.y <= 0 && Math.abs(offset.x) <= Math.abs(offset.y)) return 0;
    if (offset.x >= 0 && Math.abs(offset.x) >= Math.abs(offset.y)) return 1;
    if (offset.y >= 0 && Math.abs(offset.x) <= Math.abs(offset.y)) return 2;
    if (offset.x <= 0 && Math.abs(offset.x) >= Math.abs(offset.y)) return 3;
    throw new Error("algorithm error");
  }

  getSector(point: Point) {
    return this.getSide(this.getSectorId(point));
  }
}
