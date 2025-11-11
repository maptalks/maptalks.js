import * as reshader from '../../reshader';
import Mask from './Mask';
import { isNumber } from '../util/util';

export default class ClipMask extends Mask {
    constructor(coordinates, options) {
        super(coordinates, options);
    }

    _createMesh(regl) {
        const geometry = this._createGeometry(regl);
        const mesh = new reshader.Mesh(geometry);
        this._setDefines(mesh);
        this._setLocalTransform(mesh);
        return mesh;
    }

    _updateUniforms(mesh, ratio, minHeight) {
        const maskMode = this._getMaskMode();
        mesh.setUniform('maskMode', maskMode);
        const color = this._getMaskColor();
        mesh.setUniform('maskColor', color);
        if (isNumber(ratio)) {
            const heightRange = this._getHeightRange();
            heightRange[0] = (heightRange[0] - minHeight) * ratio;
            heightRange[1] = (heightRange[1] - minHeight) * ratio;
            mesh.setUniform('heightRange', heightRange);
        }
    }

    setHeightRange(heightRange) {
        this.options.heightRange = heightRange;
        this['_fireEvent']('heightrangechange');
    }

    getHeightRange() {
        return this.options.heightRange;
    }

    _getHeightRange() {
        const heightRange = [0, 0];
        if (this.options.heightRange) {
            heightRange[0] = this._altitudeToPoint(this.options.heightRange[0]);
            heightRange[1] = this._altitudeToPoint(this.options.heightRange[1]);
        }
        return heightRange;
    }

    _setDefines(mesh) {
        const defines = mesh.getDefines();
        defines['HAS_MASK_COLOR'] = 1;
        mesh.setDefines(defines);
    }
}
