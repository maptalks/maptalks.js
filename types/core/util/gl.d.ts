export declare function createGLContext(canvas: HTMLCanvasElement, options: any): any;
/**
* Create a shader object
* @param gl GL context
* @param type the type of the shader object to be created
* @param source shader program (string)
* @return created shader object, or null if the creation has failed.
* @private
*/
export declare function compileShader(gl: any, type: any, source: any): any;
/**
 * Create the linked program object
 * @param {String} vert a vertex shader program (string)
 * @param {String} frag a fragment shader program (string)
 * @return {WebGLProgram} created program object, or null if the creation has failed
 * @private
 */
export declare function createProgram(gl: any, vert: any, frag: any): {
    program: any;
    vertexShader: any;
    fragmentShader: any;
};
/**
 * Enable vertex attributes
 * @param {Array} attributes [[name, stride, type], [name, stride, type]...]
 * @example
 * rendererr.enableVertexAttrib([
 *  ['a_position', 3, 'FLOAT'],
 *  ['a_normal', 3, 'FLOAT']
 * ]);
 * @private
 */
export declare function enableVertexAttrib(gl: any, program: any, attributes: any): void;
