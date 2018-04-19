
export function createGLContext(canvas, options) {
    const attributes = {
        'alpha': true,
        'stencil' : true,
        'preserveDrawingBuffer' : true,
        'antialias' : false
    };
    const names = ['webgl', 'experimental-webgl'];
    let context = null;
    /* eslint-disable no-empty */
    for (let i = 0; i < names.length; ++i) {
        try {
            context = canvas.getContext(names[i], options || attributes);
        } catch (e) {}
        if (context) {
            break;
        }
    }
    return context;
    /* eslint-enable no-empty */
}

/**
* Create a shader object
* @param gl GL context
* @param type the type of the shader object to be created
* @param source shader program (string)
* @return created shader object, or null if the creation has failed.
* @private
*/
export function compileShader(gl, type, source) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compiled) {
        const error = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error('Failed to compile shader: ' + error);
    }
    return shader;
}

/**
 * Create the linked program object
 * @param {String} vert a vertex shader program (string)
 * @param {String} frag a fragment shader program (string)
 * @return {WebGLProgram} created program object, or null if the creation has failed
 * @private
 */
export function createProgram(gl, vert, frag) {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vert);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, frag);
    if (!vertexShader || !fragmentShader) {
        return null;
    }

    const program = gl.createProgram();
    if (!program) {
        return null;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);
    return { program, vertexShader, fragmentShader };
}

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
export function enableVertexAttrib(gl, program, attributes) {
    if (Array.isArray(attributes[0])) {
        const FSIZE = Float32Array.BYTES_PER_ELEMENT;
        let STRIDE = 0;
        for (let i = 0; i < attributes.length; i++) {
            STRIDE += (attributes[i][1] || 0);
        }
        let offset = 0;
        for (let i = 0; i < attributes.length; i++) {
            const attr = gl.getAttribLocation(program, attributes[i][0]);
            if (attr < 0) {
                throw new Error('Failed to get the storage location of ' + attributes[i][0]);
            }
            gl.vertexAttribPointer(attr, attributes[i][1], gl[attributes[i][2] || 'FLOAT'], false, FSIZE * STRIDE, FSIZE * offset);
            offset += (attributes[i][1] || 0);
            gl.enableVertexAttribArray(attr);
        }
    } else {
        const attr = gl.getAttribLocation(program, attributes[0]);
        gl.vertexAttribPointer(attr, attributes[1], gl[attributes[2] || 'FLOAT'], false, 0, 0);
        gl.enableVertexAttribArray(attr);
    }
}
