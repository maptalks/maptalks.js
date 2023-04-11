import * as reshader from '@maptalks/reshader.gl';
import Mask from './Mask';

export default class ClipInsideMask extends Mask {
    constructor(coordinates, options) {
        super(coordinates, options);
        this._mode = 'clip-inside';
    }

    _createMesh(regl) {
        const geometry = this._createGeometry(regl);
        const mesh = new reshader.Mesh(geometry);
        return mesh;
    }

    _updateUniforms(mesh) {
        const maskMode = this._getMaskMode();
        mesh.setUniform('maskMode', maskMode);
        const color = this._getMaskColor();
        mesh.setUniform('maskColor', color);
        this._setLocalTransform(mesh);
    }
}