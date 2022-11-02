import * as reshader from '@maptalks/reshader.gl';

export default function (Base) {
    return class extends Base {
        clearMask() {
            delete this._maskUniforms['mask_colorExtent'];
            delete this._maskUniforms['mask_extent'];
            delete this._maskUniforms['mask_modeExtent'];
            delete this._maskUniforms['mask_hasFlatOut'];
            delete this._maskUniforms['mask_hasClipOut'];
            delete this._maskUniforms['mask_heightRatio'];
            delete this._maskUniforms['mask_heightOffset'];
            if (this._extentPass) {
                this._extentPass.dispose();
                delete this._extentPass;
            }
            this.setToRedraw();
        }
    
        setMask(maskObjects, extent, projViewMatrix, ratio, minHeight) {
            if (!this.viewport) {
                this.viewport = {
                    x : 0,
                    y : 0,
                    width : () => {
                        return this.canvas ? this.canvas.width : 1;
                    },
                    height : () => {
                        return this.canvas ? this.canvas.height : 1;
                    }
                };
            }
            if (!this._extentPass) {
                if (this.regl) {
                    this._extentPass = new reshader.ExtentPass(this.regl, this.viewport);
                    this._renderExtentMap(maskObjects, extent, projViewMatrix, ratio, minHeight);
                } else {
                    this.layer.once('contextcreate', () => {
                        this._extentPass = new reshader.ExtentPass(this.regl, this.viewport);
                        this._renderExtentMap(maskObjects, extent, projViewMatrix, ratio, minHeight);
                    }, this);
                }
            } else {
                this._renderExtentMap(maskObjects, extent, projViewMatrix, ratio, minHeight);
            }
        }
    
        _renderExtentMap(maskObjects, extent, projViewMatrix, ratio, minHeight) {
            this._extentPass.setExtentPositions(maskObjects)
            const { colorExtent, modeExtent } = this._extentPass.render(projViewMatrix);
            this._maskUniforms = this._maskUniforms || {};
            this._maskUniforms['mask_colorExtent'] = colorExtent;
            this._maskUniforms['mask_extent'] = extent;
            this._maskUniforms['mask_modeExtent'] = modeExtent;
            this._maskUniforms['mask_hasFlatOut'] = this._hasOutMask(maskObjects, 0.4);
            this._maskUniforms['mask_hasClipOut'] = this._hasOutMask(maskObjects, 0.2);
            this._maskUniforms['mask_heightRatio'] = ratio;
            this._maskUniforms['mask_heightOffset'] = minHeight;
            this.setToRedraw();
        }
    
        _hasOutMask(maskObjects, outType) {
            for (let i = 0; i < maskObjects.length; i++) {
                if (maskObjects[i].maskMode === outType) {
                    return 1;
                }
            }
            return 0;
        }

        getMaskUniforms() {
            return this._maskUniforms;
        }

        getMaskDefines() {
            if (!this._maskDefines) {
                this._maskDefines = {};
            }
            if (this._maskUniforms['mask_colorExtent']) {
                this._maskDefines['HAS_MASK_EXTENT'] = 1;
            } else {
                delete this._maskDefines['HAS_MASK_EXTENT'];
            }
            return this._maskDefines;
        }
    }
}