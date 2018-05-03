/** 
 * https://github.com/mochajs/mocha/wiki/Using-mocha-programmatically
*/
const assert = require('assert'),
    headless = require('gl')(800,600),
    common = require('./common/common'),
    GLConstants = require('./../src/gl/GLConstants'),
    fusion = require('./../src/init');

describe('baseline test', () => {
    /**
     * reference:
     * https://learnopengl-cn.github.io/01%20Getting%20started/04%20Hello%20Triangle/
     */
    it('#1.draw a triangle', () => {
        const glCanvas = new fusion.gl.GLCanvas(headless);
        const gl = glCanvas.getContext('webgl');
        //enable debugger
        fusion.gl.Debug.Enable(headless);
        //
        const glShader1 = gl.createShader(gl.VERTEX_SHADER);
        const glShader2 = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(glShader1, common.base_vs);
        gl.shaderSource(glShader2, common.base_fs);
        gl.compileShader(glShader1);
        gl.compileShader(glShader2);
        const glProgram = gl.createProgram();
        gl.attachShader(glProgram, glShader1);
        gl.attachShader(glProgram, glShader2);
        gl.linkProgram(glProgram);
        //
        const positionAttributeLocation = gl.getAttribLocation(glProgram, "a_position");
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        const positions = [
            0, 0,
            0, 0.5,
            0.7, 0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.viewport(0, 0, 800, 600);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(glProgram);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
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
        //disable debugger
        const [...logger] = fusion.gl.Debug.GetLogger(headless);
        assert.equal(logger.join(','), "createShader,createShader,shaderSource,shaderSource,compileShader,compileShader,createProgram,attachShader,attachShader,linkProgram,getAttribLocation,createBuffer,bindBuffer,bufferData,viewport,clearColor,clear,useProgram,enableVertexAttribArray,bindBuffer,vertexAttribPointer,drawArrays");
    });

});