/**
 * 点光源属性
 * @author yellow date 2018/3/25
 */
const Vec3 = require('kiwi.matrix').Vec3;
/**
 * @class
 */
class PointLight {

    constructor() {
        /**
         * 光源位置
         * @type {Vec3}
         */
        this.position = new Vec3().set(0, 0, 5);
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
    }
    /**
     * @type {string}
     */
    get type() {
        return 'PointLight';
    }
    /**
     * 
     * @param {WebGLRenderingContext} gl 
     * @param {*} program 
     */
    prepareDraw(gl, program) {
        const light_position = gl.getUniformLocation(program, 'u_pointLight.position');
        const light_ambient = gl.getUniformLocation(program, 'u_pointLight.ambient');
        const light_diffuse = gl.getUniformLocation(program, 'u_pointLight.diffuse');
        const light_specular = gl.getUniformLocation(program, 'u_pointLight.specular');
        const light_constant = gl.getUniformLocation(program, 'u_pointLight.constant');
        const light_linear = gl.getUniformLocation(program, 'u_pointLight.linear');
        const light_quadratic = gl.getUniformLocation(program, 'u_pointLight.quadratic');
        gl.uniform3fv(light_position, [0, 0, 1]);
        gl.uniform3fv(light_ambient, [0.2, 0.2, 0.2]);
        gl.uniform3fv(light_diffuse, [0.5, 0.5, 0.5]);
        gl.uniform3fv(light_specular, [1.0, 1.0, 1.0]);
        gl.uniform1f(light_constant,1.0);
        gl.uniform1f(light_linear,0.09);
        gl.uniform1f(light_quadratic,0.032);
    }

}

module.exports = PointLight;