/**
 * 点光源属性
 * @author yellow date 2018/3/25
 */
const Vec3 = require('kiwi.matrix').Vec3;

/**
 * @class
 */
class PointLight{

    constructor(){
        /**
         * 光源位置
         * @type {Vec3}
         */
        this.position = new Vec3().set(0,0,5);
        /**
         * 环境光遮罩
         * @type {Vec3}
         */
        this.ambient = new Vec3().set(0.2,0.2,0.2);
        /**
         * 漫反射
         * @type {Vec3}
         */
        this.diffuse = new Vec3().set(0.5,0.5,0.5);
        /**
         * 镜面反射
         * @type {Vec3}
         */
        this.specular = new Vec3().set(1.0,1.0,1.0);
    }
    /**
     * @type {string}
     */
    get type(){
        return 'PointLight';
    }

}

module.exports = PointLight;