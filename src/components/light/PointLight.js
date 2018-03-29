/**
 * 点光源属性
 * @author yellow date 2018/3/25
 */
const Vec3 = require('kiwi.matrix').Vec3,
    Mat4 = require('kiwi.matrix').Mat4,
    GLMatrix = require('kiwi.matrix').GLMatrix;

/**
 * @class
 */
class PointLight {

    constructor() {
        /**
         * 光源位置
         * @type {Vec3}
         */
        this.position = new Vec3().set(0,1,3);
        /**
         * 环境光遮罩
         * @type {Vec3}
         */
        this.ambient = new Vec3().set(0.2, 0.2, 0.2);
        /**
         * 漫反射
         * @type {Vec3}
         */
        this.diffuse = new Vec3().set(0.5, 0.5, 0.5);
        /**
         * 镜面反射
         * @type {Vec3}
         */
        this.specular = new Vec3().set(1.0, 1.0, 1.0);
        /**
         * 传播衰减相关
         */
        this.constant = 1.0;
        /**
         * 传播衰减相关
         */
        this.linear = 0.09;
        /**
         * 传播衰减相关
         */
        this.quadratic = 0.032;
        /**
         * 正交投影矩阵，用于计算阴影
         */
        this.projectionMatrix = Mat4.ortho(-1, 1, 1, -1, 1, 10);
        // this.projectionMatrix = Mat4.perspective(GLMatrix.toRadian(60), 800/600,1,2000);
        /**
         * 光源的视图矩阵
         */
        this.viewMatrix = new Mat4().lookAt(this.position, new Vec3().set(0,0,0), new Vec3().set(0, 1, 0));
        /**
         * 光线的 uv
         */
        this.viewProjectMatrix = this.projectionMatrix.clone().multiply(this.viewMatrix);
    }

    /**
     * 
     * @param {WebGLRenderingContext} gl 
     * @param {*} program 
     */
    prepareDraw(gl, program) {
        // const light_position = gl.getUniformLocation(program, 'u_pointLight.position');
        // const light_ambient = gl.getUniformLocation(program, 'u_pointLight.ambient');
        // const light_diffuse = gl.getUniformLocation(program, 'u_pointLight.diffuse');
        // const light_specular = gl.getUniformLocation(program, 'u_pointLight.specular');
        // const light_constant = gl.getUniformLocation(program, 'u_pointLight.constant');
        // const light_linear = gl.getUniformLocation(program, 'u_pointLight.linear');
        // const light_quadratic = gl.getUniformLocation(program, 'u_pointLight.quadratic');
        // gl.uniform3fv(light_position, [0, 0, 1]);
        // gl.uniform3fv(light_ambient, [0.2, 0.2, 0.2]);
        // gl.uniform3fv(light_diffuse, [0.5, 0.5, 0.5]);
        // gl.uniform3fv(light_specular, [1.0, 1.0, 1.0]);
        // gl.uniform1f(light_constant,1.0);
        // gl.uniform1f(light_linear,0.09);
        // gl.uniform1f(light_quadratic,0.032);
    }

}

module.exports = PointLight;