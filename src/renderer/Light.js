/**
 * light
 * reference https://github.com/mrdoob/three.js/blob/dev/src/lights/LightShadow.js
 * @author yellow date 2017/6/14
 */

import glMatrix from 'kiwi.matrix';

class LightShadow {
    /**
     * 
     * @param {Camera} camera 
     */
    constructor(camera) {
        this._camera = camera;
        this._bias = 0;
        this._radius = 1;
        this._mapSize = new glMatrix.vec2().set(512, 512);
        this._map = null;
        this._matrix = new glMatrix.mat4();
    }
}

class Light {
    /**
     * @member of Light
     * @attribute {LightShadow} _shadow
     */
    _shadow;

    _intensity;
    /**
     * create a Light
     * @param {number} intensity arrange from [0,1]
     */
    constructor(intensity) {
        this._intensity = intensity;
    }

}

class PointLight extends Light {
    /**
     * @param {Camera} camera
     * @param {number} intensity 
     * @param {number} distance 
     * @param {number} [decay] 
     */
    constructor(camera, intensity, distance, decay = 2) {
        super(intensity);
        this._distance = distance;
        this._decay = decay || 2;
        this._shadow = new LightShadow(camera);
    }

}

export { PointLight }