import Texture from './AbstractTexture';

class TextureCube extends Texture {
    onLoad(/* images */) {
        const config = this.config;
        if (!config) {
            return;
        }
        // const faces = this._createFaces(images);
        // config.faces = faces.map(face => face.data);
        this._updateREGL();
    }

    createREGLTexture(regl) {
        return regl.cube(this.config);
    }

    //@internal
    _createFaces(/* images */) {
        return [];
    }
}

export default TextureCube;
