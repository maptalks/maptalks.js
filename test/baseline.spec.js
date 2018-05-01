/** 
 * https://github.com/mochajs/mocha/wiki/Using-mocha-programmatically
*/
const assert = require('assert'),
    headless = require('gl'),
    common = require('./common/common'),
    GLConstants = require('./../src/gl/GLConstants'),
    kiwi = require('./../src/init');

describe('baseline test', () => {
    /**
     * reference:
     * https://learnopengl-cn.github.io/01%20Getting%20started/04%20Hello%20Triangle/
     */
    it('#1.draw a triangle', () => {
        /**
        * enable debugger
        */
        kiwi.gl.Debug.Enable();
        const htmlCavnasElementId = 'mapCanvas';
        const glCanvas = new kiwi.gl.GLCanvas(htmlCavnasElementId);
        const gl = glCanvas.getContext('webgl');
        //
        const glShader1 = gl.createShader(gl.VERTEX_SHADER);
        const glShader2 = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(glShader1, common.base_vs);
        gl.shaderSource(glShader2, common.base_fs);
        gl.compileShader(glShader1);
        gl.compileShader(glShader2);
        //
        const glProgram = gl.createProgram();
        gl.attachShader(glProgram, glShader1);
        gl.attachShader(glProgram, glShader2);
        gl.linkProgram(glProgram);
        //
        const positionAttributeLocation = gl.getAttribLocation(glProgram, "a_position");
        const positionBuffer = gl.createBuffer();
        //
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        const positions = [
            0, 0,
            0, 0.5,
            0.7, 0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        //
        gl.viewport(0, 0, 800, 600);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(glProgram);
        //
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        //
        var size = 2;
        var type = gl.FLOAT;
        var normalize = false;
        var stride = 0;
        var offset = 0;
        gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);
        // draw
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 3;
        gl.drawArrays(primitiveType, offset, count);
        //link
        glCanvas.linkToWebGLRenderingContext(headless(400, 400));
        const [...logger] = kiwi.gl.Debug.GetLogger();
        kiwi.gl.Debug.Disable();
        assert.equal(logger.join(','), "createShader,createShader,shaderSource,shaderSource,compileShader,compileShader,createProgram,attachShader,attachShader,linkProgram,getAttribLocation,createBuffer,bindBuffer,bufferData,viewport,clearColor,clear,useProgram,enableVertexAttribArray,bindBuffer,vertexAttribPointer,drawArrays");
    });

    it('#2 ahead of drawschedule', () => {
        const glCanvas = new kiwi.gl.GLCanvas('mapCanvas');
        const gl = glCanvas.getContext('webgl');

        var vertCode = 'attribute vec2 coordinates;' +
            'uniform float size;' +
            'void main(void) {' +
            'gl_PointSize = size;' +
            'gl_Position = vec4(coordinates, 0.0, 1.0);' +
            '}';
        var vertShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertShader, vertCode);
        gl.compileShader(vertShader);

        var fragCode1 =
            'precision mediump float;' +
            'uniform float color;' +
            'void main(void) {' +
            'gl_FragColor = vec4(1.0, 0.0, color, 1.0);' +
            '}';
        var fragShader1 = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragShader1, fragCode1);
        gl.compileShader(fragShader1);

        var fragCode2 =
            'precision mediump float;' +
            'uniform float color;' +
            'void main(void) {' +
            'gl_FragColor = vec4(1.0, 0.5, color, 1.0);' +
            '}';
        var fragShader2 = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragShader2, fragCode2);
        gl.compileShader(fragShader2);

        var shaderProgram1 = gl.createProgram();
        gl.attachShader(shaderProgram1, vertShader);
        gl.attachShader(shaderProgram1, fragShader1);
        gl.linkProgram(shaderProgram1);

        var shaderProgram2 = gl.createProgram();
        gl.attachShader(shaderProgram2, vertShader);
        gl.attachShader(shaderProgram2, fragShader2);
        gl.linkProgram(shaderProgram2);

        let program = shaderProgram1;
        gl.useProgram(program);

        var vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        var vertexArray = [0.0, -0.5, 0.0, 0.5, 0.5, 0.0];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexArray), gl.STATIC_DRAW);

        var coord = gl.getAttribLocation(shaderProgram1, "coordinates");
        gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(coord);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.viewport(0, 0, 300, 300);
        //render function
        const animate = function () {
            for (let i = 0; i < 3; i++) {
                gl.uniform1f(gl.getUniformLocation(program, 'size'), 15.0);
                gl.uniform1f(gl.getUniformLocation(program, 'color'), 0.2);
                if (i === 1) {
                    program = shaderProgram2;
                    gl.useProgram(program);
                }
                gl.drawArrays(gl.POINTS, 0, 3);
            }
        }
        // active drawArrays
        animate();
    })
});