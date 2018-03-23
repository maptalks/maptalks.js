/**
 * @class
 */
class Mesh {

    constructor() {
        /**
         * @type {Array}
         */
        this._vertex = [];
        /**
         * @type {Array}
         */
        this._normal = [];
        /**
         * @type {Array}
         */
        this._texCoords = [];
        /**
         * @type {GLTexture}
         */
        this._texture;
    }

}

module.exports = Mesh;