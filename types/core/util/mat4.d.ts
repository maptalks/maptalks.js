export declare function perspective(out: Array<number>, fovy: number, aspect: number, near: number, far: number): number[];
export declare function translate(out: Array<number>, a: Array<number>, v: Array<number>): number[];
export declare function scale(out: Array<number>, a: Array<number>, v: Array<number>): number[];
export declare function rotateX(out: Array<number>, a: Array<number>, rad: number): number[];
export declare function rotateZ(out: Array<number>, a: Array<number>, rad: number): number[];
export declare function multiply(out: Array<number>, a: Array<number>, b: Array<number>): number[];
export declare function invert(out: Array<number>, a: Array<number>): number[];
/**
 * Set a mat4 to the identity matrix
 *
 * @param {mat4} out the receiving matrix
 * @returns {mat4} out
 * @private
 */
export declare function identity(out: Array<number>): number[];
/**
 * Copy the values from one mat4 to another
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 * @private
 */
export declare function copy(out: Array<number>, a: Array<number>): number[];
