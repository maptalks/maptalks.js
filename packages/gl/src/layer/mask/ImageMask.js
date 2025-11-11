import * as reshader from '../../reshader';
import Mask from './Mask';

export default class ImageMask extends Mask {
    /**
     * @param  {Object} options.url   image resource url
     */
    constructor(coordinates, options) {
        super(coordinates, options);
        this._mode = 'texture';
    }

    setUrl(url) {
        this.options.url = url;
        const mesh = this._mesh;
        if (!mesh) {
            return;
        }
        if (mesh.material) {
            const maskTexture = mesh.material.get('maskTexture');
            if (maskTexture) {
                this._createTexture(maskTexture);
                const layer = this.getLayer();
                if (layer) {
                    layer.getRenderer().setToRedraw();
                }
            }
        }
    }

    _createMesh(regl) {
        const { geometry, copyGeometry } = this._createGeometry(regl);
        const mesh = new reshader.Mesh(geometry);
        const texture = regl.texture()
        this._createTexture(texture);
        mesh.material = new reshader.Material({ maskTexture: texture });
        this._setDefines(mesh);
        this._setLocalTransform(mesh);
        //this._copyMesh用于后面insect frustum的判断，之所以不直接用this._mesh，有高度的考量
        this._copyMesh = new reshader.Mesh(copyGeometry);
        this._setLocalTransform(this._copyMesh);
        return mesh;
    }

    _updateUniforms(mesh) {
        const maskMode = this._getMaskMode();
        mesh.setUniform('maskMode', maskMode);
        const color = this._getMaskColor();
        mesh.setUniform('maskColor', color);
        if (this._positions && this._positions.length) {
            for (let i = 0; i < 4; i++) {
                mesh.setUniform('mask_position' + i, this._positions.slice(i * 3, i * 3 + 3));
            }
        }
    }

    _setDefines(mesh) {
        const defines = mesh.getDefines();
        defines['HAS_TEXTURE'] = 1;
        mesh.setDefines(defines);
    }

    _createTexture(imageTexture) {
        const image = new Image()
        image.src = this.options.url;
        image.crossOrigin = 'anonymous';
        image.onload = function () {
            imageTexture(image);
        }
        image.onerror = function () {
            console.warn('Image load error');
        }
    }

    getBBox() {
        return this._copyMesh.getBoundingBox();
    }
}
