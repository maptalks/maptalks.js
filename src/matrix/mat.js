
/**
 * reference https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/common.js
 * switch to es6 syntax
 * warning:if you don't want to change the source value,please use mat.clone().* instead of mat.*
 * @author yellow 2017/5/8
 */

let degree = Math.PI / 180;

export default class matrix{
    //precision
    static EPSILON = 1e-6;
    //support ie9
    static ARRAY_TYPE = (typeof Float32Array !== 'undefined') ? Float32Array : Array;
    static RANDOM=Math.random;
    static ENABLE_SIMD=true;
    static SIMD_AVAILABLE =(matrix.ARRAY_TYPE === Float32Array) && (typeof SIMD != 'undefined');
    static USE_SIMD = matrix.ENABLE_SIMD && matrix.SIMD_AVAILABLE;

    /**
     * Set ArrayType,such as Float32Array or Array ([])
     * @param {Type} type Array type,such as Float32Array or Array
     */
    static setMatrixArrayType(type){
        matrix.ARRAY_TYPE=type;
    };

    /**
     * Convert degree to radian
     * @param {Number} deg Angle in Degrees
     */
    static toRadian(deg){
        return deg*degree;
    }

    /**
     * Convert rad to degree
     * @param {Number} rad Angle in Radian
     */
    static toDegree(rad){
        return rad/degree;
    }

    /**
     * @param {Number} a The first number to test.
     * @param {Number} b The first number to test.
     * @return {Boolean} True if the numbers are approximately equal, false otherwise.
     */
    static equals(a,b){
        return Math.abs(a - b) <= matrix.EPSILON*Math.max(1.0, Math.abs(a), Math.abs(b));
    }
}

