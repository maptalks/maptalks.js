const glCanvas = new fusion.gl.GLCanvas('mapCanvas');
//const glCanvas = document.getElementById('mapCanvas');
//
const vertexText =
        'attribute vec3 a_position;' +
        'attribute vec3 a_normal;' +
        'attribute vec2 a_texCoords;' +
        'uniform mat4 u_projectionMatrix;' +
        'uniform mat4 u_viewMatrix;' +
        'uniform mat4 u_modelMatrix;' +
        'varying vec3 o_normal;' +
        'varying vec3 o_fragpos;' +
        'varying vec2 TexCoords;' +
        'void main(){' +
        'gl_Position = u_projectionMatrix*u_viewMatrix*u_modelMatrix*vec4(a_position,1.0);' +
        'o_fragpos = vec3(u_modelMatrix*vec4(a_position,1.0));' +
        'o_normal = a_normal;' +
        'TexCoords = a_texCoords;' +
        '}';

//注：使用采样后必须申明浮点数精度，否则报错 No precision specified for (float)
const fragText =
        'precision mediump float;' +
        'uniform sampler2D u_sample;' +
        'uniform vec3 u_viewPos;' +
        'varying vec3 o_normal;' +
        'varying vec3 o_fragpos;' +
        'varying vec2 TexCoords;' +
        //光源结构体
        'struct Light{' +
        '       vec3 position;' +
        //光照的环境光颜色分量
        '       vec3 ambient;' +
        '       vec3 diffuse;' +
        '       vec3 specular;' +
        '};' +
        'uniform Light light;' +
        //材质结构体
        'struct Matreial{' +
        //环境关照在这个物体反射什么颜色
        '       vec3 ambient;' +
        //漫反射照射下物体颜色
        '       sampler2D diffuse;' +
        //镜面光照下物体颜色
        '       sampler2D specular;' +
        //镜面光散射/半径
        '       float shininess;' +
        '};' +
        'uniform Matreial material;' +
        'void main(){' +
        //环境光
        'vec3 ambient = light.ambient*vec3(texture2D(material.diffuse,TexCoords));' +
        //漫反射
        'vec3 norm = normalize(o_normal);' +
        'vec3 lightDir = normalize(light.position-o_fragpos);' +
        'float diff = max(dot(norm,lightDir),0.0);' +
        'vec3 diffuse = light.diffuse*diff*vec3(texture2D(material.diffuse,TexCoords));' +
        //镜面光
        'vec3 viewDir = normalize(u_viewPos-o_fragpos);' +
        'vec3 reflectDir = reflect(-1.0*lightDir, norm);' +
        'float sepc = pow(max(dot(viewDir, reflectDir), 0.0),material.shininess);' +
        'vec3 specular =light.specular*sepc*vec3(texture2D(material.specular,TexCoords));' +
        //组合光
        'vec3 combine = ambient + diffuse + specular;' +
        'gl_FragColor = vec4(combine,1.0);' +
        // 'gl_FragColor=vec4(TexCoords,0,1.0);'+
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
//
gl.enable(gl.DEPTH_TEST);
gl.clearColor(0, 0, 0, 1);
gl.clear(gl.COLOR_BUFFER_BIT);
//立方体顶点，顶点坐标遵循标准化设备坐标规则（NDC）
const vertices =
        [
                // Z轴上的平面
                -0.5, 0.5, 0.5,
                -0.5, -0.5, 0.5,
                0.5, -0.5, 0.5,
                0.5, -0.5, 0.5,
                0.5, 0.5, 0.5,
                -0.5, 0.5, 0.5,
                -0.5, 0.5, -0.5,
                -0.5, -0.5, -0.5,
                0.5, -0.5, -0.5,
                0.5, -0.5, -0.5,
                0.5, 0.5, -0.5,
                -0.5, 0.5, -0.5,
                // X轴上的平面
                0.5, -0.5, 0.5,
                0.5, -0.5, -0.5,
                0.5, 0.5, -0.5,
                0.5, 0.5, -0.5,
                0.5, 0.5, 0.5,
                0.5, -0.5, 0.5,
                -0.5, -0.5, 0.5,
                -0.5, -0.5, -0.5,
                -0.5, 0.5, -0.5,
                -0.5, 0.5, -0.5,
                -0.5, 0.5, 0.5,
                -0.5, -0.5, 0.5,
                // Y轴上的平面
                -0.5, 0.5, 0.5,
                -0.5, 0.5, -0.5,
                0.5, 0.5, -0.5,
                0.5, 0.5, -0.5,
                0.5, 0.5, 0.5,
                -0.5, 0.5, 0.5,
                -0.5, -0.5, 0.5,
                -0.5, -0.5, -0.5,
                0.5, -0.5, -0.5,
                0.5, -0.5, -0.5,
                0.5, -0.5, 0.5,
                -0.5, -0.5, 0.5
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
//法线数据
const normals =
        [
                // Z轴上的平面
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                0, 0, -1,
                0, 0, -1,
                0, 0, -1,
                0, 0, -1,
                0, 0, -1,
                0, 0, -1,
                // X轴上的平面
                1, 0, 0,
                1, 0, 0,
                1, 0, 0,
                1, 0, 0,
                1, 0, 0,
                1, 0, 0,
                -1, 0, 0,
                -1, 0, 0,
                -1, 0, 0,
                -1, 0, 0,
                -1, 0, 0,
                -1, 0, 0,
                // Y轴上的平面
                0, 1, 0,
                0, 1, 0,
                0, 1, 0,
                0, 1, 0,
                0, 1, 0,
                0, 1, 0,
                0, -1, 0,
                0, -1, 0,
                0, -1, 0,
                0, -1, 0,
                0, -1, 0,
                0, -1, 0
        ];
//传递法线数据操作
const normalBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
const a_normal = gl.getAttribLocation(program, 'a_normal');
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
gl.vertexAttribPointer(a_normal, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(a_normal);
//光源
const light_position = gl.getUniformLocation(program, 'light.position');
const light_ambient = gl.getUniformLocation(program, 'light.ambient');
const light_diffuse = gl.getUniformLocation(program, 'light.diffuse');
const light_specular = gl.getUniformLocation(program, 'light.specular');
gl.uniform3fv(light_position, [0, 0, 5]);
gl.uniform3fv(light_ambient, [0.2, 0.2, 0.2]);
gl.uniform3fv(light_diffuse, [0.5, 0.5, 0.5]);
gl.uniform3fv(light_specular, [1.0, 1.0, 1.0]);
//材质
const material_ambient = gl.getUniformLocation(program, 'material.ambient');
const material_diffuse = gl.getUniformLocation(program, 'material.diffuse');
const material_specular = gl.getUniformLocation(program, 'material.specular');
const material_shininess = gl.getUniformLocation(program, 'material.shininess');
gl.uniform3fv(material_ambient, [1.0, 0.5, 0.31]);
// gl.uniform3fv(material_specular, [0.5, 0.5, 0.5]);
gl.uniform1f(material_shininess, 32.0);
//设置纹理坐标
const texCoords =
        [
                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,
                1.0, 1.0,
                0.0, 1.0,
                0.0, 0.0,

                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,
                1.0, 1.0,
                0.0, 1.0,
                0.0, 0.0,

                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0,
                0.0, 1.0,
                0.0, 0.0,
                1.0, 0.0,

                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0,
                0.0, 1.0,
                0.0, 0.0,
                1.0, 0.0,

                0.0, 1.0,
                1.0, 1.0,
                1.0, 0.0,
                1.0, 0.0,
                0.0, 0.0,
                0.0, 1.0,

                0.0, 1.0,
                1.0, 1.0,
                1.0, 0.0,
                1.0, 0.0,
                0.0, 0.0,
                0.0, 1.0
        ];
const texCoordBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW)
const a_texCoords = gl.getAttribLocation(program, 'a_texCoords');
gl.vertexAttribPointer(a_texCoords, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(a_texCoords);
//设置相机相关矩阵

const camera = new fusion.gl.PerspectiveCamera(60, 800 / 600, 0.1, 1000);
gl.viewport(0, 0, 800, 600);
camera.position = [2, -2, 4];

const u_viewPos = gl.getUniformLocation(program, 'u_viewPos');
gl.uniform3fv(u_viewPos, [2, -2, 4]);

const u_projectionMatrix = gl.getUniformLocation(program, 'u_projectionMatrix');
gl.uniformMatrix4fv(u_projectionMatrix, false, camera.projectionMatrix.value);
const u_viewMatrix = gl.getUniformLocation(program, 'u_viewMatrix');
gl.uniformMatrix4fv(u_viewMatrix, false, camera.viewMatrix.value);
const u_modelMatrix = gl.getUniformLocation(program, 'u_modelMatrix');
gl.uniformMatrix4fv(u_modelMatrix, false, camera.identityMatrix.value);
//
let i = 0;
const animate = function () {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform3fv(light_position, [0, 0, 0.01 * i++]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 36);
        requestAnimationFrame(animate);
}
//漫反射纹理
const image_diffuse = new Image();
image_diffuse.src = './assets/wall_diffuse.jpg';
image_diffuse.onload = function () {
        //纹理进行y轴反转
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        //开启纹理单元
        gl.activeTexture(gl.TEXTURE0);
        //创建纹理对象
        const texture = gl.createTexture();
        //绑定给texture_2d
        gl.bindTexture(gl.TEXTURE_2D, texture);
        //设置纹理环绕方式,处理非2的幂指数分辨率问题
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        //设置纹理纹理过滤选项
        //设置纹理在缩小(minify)操作时，使用邻近过滤
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        //设置纹理在缩小(magnify)操作时，使用线性过滤（即线性插值）
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        //设置纹理在缩小时，使用多级渐远纹理（Mipmap）,一个常见的错误是:
        //将放大过滤的选项设置为多级渐远纹理过滤选项之一。
        //这样没有任何效果，因为多级渐远纹理主要是使用在纹理被缩小的情况下的：
        //纹理放大不会使用多级渐远纹理，为放大过滤设置多级渐远纹理的选项会产生一个GL_INVALID_ENUM错误代码。
        //如果纹理分辨率
        //gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
        //传递纹理图像(无需给定图像的长宽)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image_diffuse);
        gl.uniform1i(material_diffuse, 0);
        //镜面纹理
        const image_specular = new Image();
        image_specular.src = './assets/wall_specular.png';
        image_specular.onload = function () {
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
                gl.activeTexture(gl.TEXTURE1);
                const texture2 = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, texture2);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image_specular);
                gl.uniform1i(material_specular, 1);
                requestAnimationFrame(animate);
        }
}
//
glCanvas.linkToCanvas(document.getElementById('mapCanvas'));
