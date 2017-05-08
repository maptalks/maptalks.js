/**
 * reference https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/vec2.js
 * @author yellow 2017/5/8
 */
import matrix from './matrix';

export default class vec2 {

    _out;
    /**
     * Creates a new, empty vec2
     */
    constructor() {
        _out = new matrix.ARRAY_TYPE(2);
        _out[0] = 0;
        _out[1] = 0;
        return this;
    };
    /**
     * generate a random vector
     */
    static random() {
        let vec = new vec2(),
            r = matrix.RANDOM() * 2.0 * Math.PI;
        vec._out[0] = Math.cos(r);
        vec._out[1] = Math.sin(r);
        return vec;
    };
    /**
     * set value of vec2,such as [x,y]
     */
    set(x, y) {
        _out[0] = x;
        _out[1] = y;
        return this;
    }

    /**
     * Creates a new vec2 initialized with values from an existing vector
     */
    clone() {
        let vec = new vec2();
        vec.set(this._out[0], this._out[1]);
        return vec;
    };
    /**
     * Add two vec2's
     * @param {vec2} vec the vec2 which waiting for add
     */
    add(vec) {
        this._out[0] += vec._out[0];
        this._out[1] += vec._out[1];
        return vec;
    };
    /**
     * substract vector vec from this
     * @param {vec2} vec
     */
    sub(vec) {
        this._out[0] -= vec._out[0];
        this._out[1] -= vec._out[1];
        return this;
    };
    /**
     * multiplies two vec2's
     * @param {vec2} 
     */
    multiply(vec) {
        this._out[0] *= vec._out[0];
        this._out[1] *= vec._out[1];
        return this;
    };
    /**
     * diveides two vec2's
     * 
     */
    divide(vec) {
        this._out[0] /= vec._out[0];
        this._out[1] /= vec._out[1];
        return this;
    };
    /**
     * use math.ceil to adjust the value of v0 v1
     * 
     */
    ceil() {
        this._out[0] = Math.ceil(this._out[0]);
        this._out[1] = Math.ceil(this._out[1]);
        return this;
    };
    /**
     * use math.floor to adjust the value of v0 v1
     */
    floor() {
        this._out[0] = Math.floor(this._out[0]);
        this._out[1] = Math.floor(this._out[1]);
        return this;
    };
    /**
     * use math.round to adjust the value of v0 v1
     */
    round() {
        this._out[0] = Math.round(this._out[0]);
        this._out[1] = Math.round(this._out[1]);
        return this;
    };
    /**
     * merge two vector's min value
     * 
     */
    min(vec) {
        this._out[0] = Math.min(this._out[0], vec._out[0]);
        this._out[1] = Math.min(this._out[1], vec._out[1]);
        return this;
    };
    /**
     *  merge two vector's max value
     */
    max(vec) {
        this._out[0] = Math.max(this._out[0], vec._out[0]);
        this._out[1] = Math.max(this._out[1], vec._out[1]);
        return this;
    };
    /**
     * Scales a vec2 by a scalar number
     * @param {Number} n
     */
    scale(n) {
        this._out[0] *= n;
        this._out[1] *= n;
        return this;
    };
    /**
     * Calculates the euclidian distance between two vec2's
     */
    distance(vec) {
        let x = this._out[0] - vec._out[0],
            y = this._out[1] - vec._out[2];
        return Math.sqrt(x * x + y * y);
    };
    /**
     * Calculates the manhattan distance between two vec2's
     */
    manhattanDistance(vec) {
        let x = Math.abs(this._out[0] - vec._out[0]),
            y = Math.abs(this._out[1] - vec._out[2]);
        return x + y;
    };
    /**
     * Calculates the chebyshev distance between two vec2's
     */
    chebyshevDistance(vec) {
        let x = Math.abs(this._out[0] - vec._out[0]),
            y = Math.abs(this._out[1] - vec._out[2]);
        return Math.max(x, y);
    };
    /**
     * Calculates the length of a vec2
     */
    vec2Length() {
        return this.distance(new vec2());
    };
    /**
     * Negates the components of a vec2
     */
    negate() {
        this._out[0] = -this._out[0];
        this._out[1] = -this._out[1];
        return this;
    };
    /**
     * Returns the inverse of the components of a vec2
     */
    inverse() {
        this._out[0] = 1.0 / this._out[0];
        this._out[1] = 1.0 / this._out[1];
        return this;
    };
    /**
     * Normalize a vec2
     */
    normalize() {
        let len = this.vec2Length();
        if (len > 0) {
            this._out[0] /= len;
            this._out[1] /= len;
        }
        return this;
    };
    /**
     * Calculates the dot product of two vec2's
     */
    dot(vec) {
        return this._out[0] * vec._out[0] + this._out[1] * vec._out[1];
    };
    /**
     * performs a linear interpolation between two vec2's
     * @param {vec2} vec
     * @param {number} t interpolation amount between the two inputs
     */
    lerp(vec, t) {
        let [ax, ay] = this._out,
            [bx, by] = vec._out;
        this._out[0] = ax + t * (bx - ax);
        this._out[1] = ay + t * (by - ay);
        return this;
    };
    /**
     * Returns a string representation of a vector
     */
    toString(){
        return 'vec2(' + this._out[0] + ', ' + this._out[1] + ')';
    };
    /**
     * Transforms the vec2 with a mat3
     * @param {mat3} mat matrix to transform with
     */
    transformMat3(mat){
        let [x,y]=this._out;
        this._out[0]= mat._out[0] * x + mat._out[3] * y + mat._out[6];
        this._out[1]= mat._out[1] * x + mat._out[4] * y + mat._out[7];
        return this;
    };
    /**
     * Transforms the vec2 with a mat4
     */
    transformMat4(mat){
        let [x,y]=this._out;
        this._out[0]= mat._out[0] * x + mat._out[4] * y + mat._out[5];
        this._out[1]= mat._out[1] * x + mat._out[5] * y + mat._out[13];
        return this;
    };
    /**
     * Returns whether or not the vectors have approximately the same elements in the same position.
     * precision
     */
    equals(vec) {
    let [a0,a1]=this._out,
        [b0,b1]=vec._out;
    return (Math.abs(a0 - b0) <= matrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
        Math.abs(a1 - b1) <= matrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)));
    };
};
