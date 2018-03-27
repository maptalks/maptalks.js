import Texture from './AbstractTexture';

class TextureCube extends Texture {
    onLoad(error, images) {
        const config = this.config;
        const faces = this._createFaces(images);
        config.faces = faces;
        this._updateREGL();
    }

    createREGLTexture(regl) {
        return regl.cube(this.config);
    }

    _createFaces(/* images */) {
        return [];
    }
}

export default TextureCube;
