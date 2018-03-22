const glCanvas = new fusion.gl.GLCanvas('mapCanvas');
//
const vertexText =
        'attribute vec3 a_position;' +
        // 'attribute vec2 a_texCoord;' +
        'uniform mat4 u_matrix;' +
        // 'varying vec2 out_texCoord;' +
        'void main(){' +
        'gl_Position = u_matrix * vec4(a_position,1.0);' +
        // 'out_texCoord = a_texCoord;' +
        '}';

//注：使用采样后必须申明浮点数精度，否则报错 No precision specified for (float)
const fragText =
        'precision mediump float;' +
        'uniform sampler2D u_sample;' +
        // 'varying vec2 out_texCoord;' +
        'uniform vec3 objectColor;' +
        'uniform vec3 lightColor;' +
        'void main(){' +
        // 'gl_FragColor = vec4(0.01 * lightColor * objectColor,1.0)*texture2D(u_sample,out_texCoord);' +
        'gl_FragColor = vec4( 0.5 * lightColor * objectColor,1.0);' +
        '}';

/**
 * @type {WebGLRenderingContext}
 */
const gl = glCanvas.getContext('webgl');
//
const vs = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vs, vertexText);
gl.compileShader(vs);
//
const fs = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fs, fragText);
gl.compileShader(fs);
//
const program = gl.createProgram();
gl.attachShader(program, vs);
gl.attachShader(program, fs);
gl.linkProgram(program);
//
gl.useProgram(program);
gl.deleteShader(vs);
gl.deleteShader(fs);
//立方体顶点，顶点坐标遵循标准化设备坐标规则（NDC）
const vertices =
        [
                -50, -50, -50,
                50, -50, -50,
                50, 50, -50,
                50, 50, -50,
                -50, 50, -50,
                -50, -50, -50,

                -50, -50, 50,
                50, -50, 50,
                50, 50, 50,
                50, 50, 50,
                -50, 50, 50,
                -50, -50, 50,

                -50, 50, 50,
                -50, 50, -50,
                -50, -50, -50,
                -50, -50, -50,
                -50, -50, 50,
                -50, 50, 50,

                50, 50, 50,
                50, 50, -50,
                50, -50, -50,
                50, -50, -50,
                50, -50, 50,
                50, 50, 50,

                -50, -50, -50,
                50, -50, -50,
                50, -50, 50,
                50, -50, 50,
                -50, -50, 50,
                -50, -50, -50,

                -50, 50, -50,
                50, 50, -50,
                50, 50, 50,
                50, 50, 50,
                -50, 50, 50,
                -50, 50, -50
        ];
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
const a_position = gl.getAttribLocation(program, "a_position");
//Stride,步长设置为0，让程序自动决定步长
//在此设置顶点数据的读取方式
gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0);
//启用顶点属性
gl.enableVertexAttribArray(a_position);
//绘制顶点
//gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);
//设置纹理坐标
// const texCoords = 
//         [
//         -50, -50,
//         -50, 50,
//         50, 50,
//         50,-50
//         ];
// const texCoordBuffer = gl.createBuffer();
// gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
// gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW)
// const a_texCoord = gl.getAttribLocation(program, 'a_texCoord');
//将缓冲区对象分配给a_texCoord对象
// gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 0, 0);
// gl.enableVertexAttribArray(a_texCoord);
//
const camera = new fusion.gl.PerspectiveCamera(60, 800 / 600, 1, 2000);
camera.position = [100, 100, 400];
const u_matrix = gl.getUniformLocation(program, 'u_matrix');
gl.uniformMatrix4fv(u_matrix, false, camera.viewProjectionMatrix.value);
//设置颜色
const objectColor = gl.getUniformLocation(program, 'objectColor');
gl.uniform3fv(objectColor, [1.0, 0.8, 0.31]);
const lightColor = gl.getUniformLocation(program, 'lightColor');
gl.uniform3fv(lightColor, [1.2, 1.0, 2.0]);
//
gl.drawArrays(gl.TRIANGLES, 0, 36);

// let i=0;

// setInterval(function () {
//         i++;
//         camera.position = [i, 0, i];
//         gl.uniformMatrix4fv(u_matrix, false, camera.viewProjectionMatrix.value);
//         gl.drawArrays(gl.TRIANGLE_STRIP, 0, 36);
// }, 1000 / 60);

//赋纹理
// const image = new Image();
// image.src = "./assets/wall.jpg";
// image.onload = function () {
//         //纹理进行y轴反转
//         gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
//         //开启纹理单元
//         gl.activeTexture(gl.TEXTURE0);
//         //创建纹理对象
//         const texture = gl.createTexture();
//         //绑定给texture_2d
//         gl.bindTexture(gl.TEXTURE_2D, texture);
//         //设置纹理环绕方式,处理非2的幂指数分辨率问题
//         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
//         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
//         //设置纹理纹理过滤选项
//         //设置纹理在缩小(minify)操作时，使用邻近过滤
//         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
//         //设置纹理在缩小(magnify)操作时，使用线性过滤（即线性插值）
//         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
//         //设置纹理在缩小时，使用多级渐远纹理（Mipmap）,一个常见的错误是:
//         //将放大过滤的选项设置为多级渐远纹理过滤选项之一。
//         //这样没有任何效果，因为多级渐远纹理主要是使用在纹理被缩小的情况下的：
//         //纹理放大不会使用多级渐远纹理，为放大过滤设置多级渐远纹理的选项会产生一个GL_INVALID_ENUM错误代码。
//         //如果纹理分辨率
//         //gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
//         //传递纹理图像(无需给定图像的长宽)
//         gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
//         //获取采样器uniform
//         const u_sample = gl.getUniformLocation(program, 'u_sample');
//         //将激活的采样器传递给uniform
//         gl.uniform1i(u_sample, 0);
//         //清理屏幕
//         //gl.clearColor(0.0,0.0,0.0,1.0);
//         gl.clear(gl.COLOR_BUFFER_BIT);
//         //
//         gl.drawArrays(gl.TRIANGLES, 0, 6);

//         // setInterval(function(){
//         //         i++;
//         //         camera.position = [i,i,i];
//         //         gl.uniformMatrix4fv(u_matrix, false, camera.viewProjectionMatrix.value);
//         //         gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);
//         // },1000/60);
// }
//
glCanvas.linkToCanvas(document.getElementById('mapCanvas'));
