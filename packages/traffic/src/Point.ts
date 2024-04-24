export default class Point {
  x = 0;
  y = 0;

  constructor(x?: number, y?: number) {
    if (x) this.x = x;
    if (y) this.y = y;
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

  add(point: Point) {
    return new Point(this.x + point.x, this.y + point.y);
  }

  subtract(point: Point) {
    return new Point(this.x - point.x, this.y - point.y);
  }

  mult(ratio: number) {
    return new Point(this.x * ratio, this.y * ratio);
  }

  divide(ratio: number) {
    return new Point(this.x / ratio, this.y / ratio);
  }
}
