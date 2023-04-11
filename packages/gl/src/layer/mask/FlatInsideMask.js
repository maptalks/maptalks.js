import * as reshader from '@maptalks/reshader.gl';
import Mask from './Mask';

export default class FlatInsideMask extends Mask {
    constructor(coordinates, options) {
        super(coordinates, options);
        this._mode = 'flat-inside';
    }

    setFlatheight(flatHeight) {
        this.options.flatHeight = flatHeight;
        this['_fireEvent']('flatheightchange');
    }

    _createMesh(regl) {
        const geometry = this._createGeometry(regl);
        const mesh = new reshader.Mesh(geometry);
        this._setDefines(mesh);
        this._setLocalTransform(mesh);
        return mesh;
    }

    _updateUniforms(mesh) {
        const maskMode = this._getMaskMode();
        mesh.setUniform('maskMode', maskMode);
        const color = this._getMaskColor();
        mesh.setUniform('maskColor', color);
        const flatHeight = this._altitudeToPoint(this.options.flatHeight || 0);
        mesh.setUniform('flatHeight', flatHeight);
    }

    _setDefines(mesh) {
        const defines = mesh.getDefines();
        defines['HAS_MASK_FLAT'] = 1;
        mesh.setDefines(defines);
    }
}