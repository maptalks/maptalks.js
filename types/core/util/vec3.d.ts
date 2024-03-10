/**
 * Set the components of a vec3 to the given values
 *
 * @param {vec3} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} out
 * @private
 */
export declare function set(out: Array<number>, x: number, y: number, z: number): number[];
/**
 * Adds two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 * @private
 */
export declare function add(out: Array<number>, a: Array<number>, b: Array<number>): number[];
/**
 * Subtracts vector b from vector a
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 * @private
 */
export declare function subtract(out: Array<number>, a: Array<number>, b: Array<number>): number[];
/**
 * Calculates the length of a vec3
 *
 * @param {vec3} a vector to calculate length of
 * @returns {Number} length of a
 * @private
 */
export declare function length(a: Array<number>): number;
/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to normalize
 * @returns {vec3} out
 * @private
 */
export declare function normalize(out: Array<number>, a: Array<number>): number[];
/**
 * Calculates the dot product of two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} dot product of a and b
 * @private
 */
export declare function dot(a: Array<number>, b: Array<number>): number;
/**
 * Scales a vec3 by a scalar number
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @private
 * @returns {vec3} out
 */
export declare function scale(out: Array<number>, a: Array<number>, b: number): number[];
/**
 * Computes the cross product of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 * @private
 */
export declare function cross(out: Array<number>, a: Array<number>, b: Array<number>): number[];
/**
 * Calculates the euclidian distance between two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} distance between a and b
 * @private
 */
export declare function distance(a: Array<number>, b: Array<number>): number;
/**
 * Transforms the vec3 with a mat4.
 * 4th vector component is implicitly '1'
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec3} out
 * @private
 */
export declare function transformMat4(out: Array<number>, a: Array<number>, m: Array<number>): number[];
