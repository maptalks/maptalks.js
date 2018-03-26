/**
 * @author yellow date 2018/3/23
 */
const  Vec3 = require('kiwi.matrix').Vec3;

/**
 * @class
 */
class Camera{

    constructor(){
        /**
         * default position at the z-axis
         */
        this._position = new Vec3().set(0,0,1);
        /**
         * 
         */
        this._target = new Vec3().set(0,0,0);
        /**
         * move speed
         */
        this._movementSpeed = 2.5;
    }
    /**
     * need to implement at inheritance class
     */
    _update(){

    }
    /**
     * set camera position
     * @type {Array} array[3]
     */
    set position(v){
        this._position.set(v[0],v[1],v[2]);
        this._update();
    }
    /**
     * get array of position
     */
    get position(){
        return this._position.value;
    }

}

module.exports = Camera;