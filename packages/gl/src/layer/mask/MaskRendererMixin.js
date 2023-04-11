import * as reshader from '@maptalks/reshader.gl';
import { extend } from '../util/util';

export default function (Base) {
    return class extends Base {
        setMask(extent, projViewMatrix, ratio, minHeight) {
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
                    this._renderExtentMap(extent, projViewMatrix, ratio, minHeight);
                } else {
                    this.layer.once('contextcreate', () => {
                        this._extentPass = new reshader.ExtentPass(this.regl, this.viewport);
                        this._renderExtentMap(extent, projViewMatrix, ratio, minHeight);
                    }, this);
                }
            } else {
                this._renderExtentMap(extent, projViewMatrix, ratio, minHeight);
            } 
        }

        needToRedraw() {
            if (super.needToRedraw()) {
                return true;
            }
            if (this._hasPlayingVideoMask()) {
                return true;
            }
        }

        _renderExtentMap(extent, projViewMatrix, ratio, minHeight) {
            const maskMeshes = this._getMaskMeshes(ratio, minHeight);
            this._projViewMatrix = projViewMatrix;
            const { colorExtent, modeExtent } = this._extentPass.render(maskMeshes, projViewMatrix);
            this._maskUniforms = this._maskUniforms || {};
            this._maskUniforms['mask_colorExtent'] = colorExtent;
            this._maskUniforms['mask_extent'] = extent;
            this._maskUniforms['mask_modeExtent'] = modeExtent;
            this._maskUniforms['mask_hasFlatOut'] = this._hasOutMask('flat-outside');
            this._maskUniforms['mask_hasClipOut'] = this._hasOutMask( 'clip-outside');
            this._maskUniforms['mask_hasVideo'] = this._hasOutMask('video');
            this._maskUniforms['mask_heightRatio'] = ratio;
            this._maskUniforms['mask_heightOffset'] = minHeight;
            this.setToRedraw();
        }

        _getMaskMeshes(ratio, minHeight) {
            const meshes = [];
            const masks = this.layer.getMasks();
            for (let i = 0; i < masks.length; i++) {
                const mesh = masks[i].getMesh(this.regl, ratio, minHeight);
                if (mesh) {
                    meshes.push(mesh);
                }
            }
            return meshes;
        }

        _clearMask() {
            this._deleteMaskUniforms();
            if (this._extentPass) {
                this._extentPass.dispose();
                delete this._extentPass;
            }
            this.setToRedraw();
        }

        _deleteMaskUniforms() {
            delete this._maskUniforms;
        }

        _updateVideoMask() {
            if (!this._extentPass || !this._maskUniforms) {
                return;
            }
            const ratio = this._maskUniforms['mask_heightRatio'];
            const minHeight = this._maskUniforms['mask_heightOffset'];
            const maskMeshes = this._getMaskMeshes(ratio, minHeight);
            this._extentPass.render(maskMeshes, this._projViewMatrix);
            const masks = this.layer.getMasks();
            for (let i = 0; i < masks.length; i++) {
                if (masks[i].getMode() === 'video') {
                    masks[i]._update();
                }
            }
        }
    
        _hasOutMask(outType) {
            const masks = this.layer.getMasks();
            for (let i = 0; i < masks.length; i++) {
                if (masks[i].getMode() === outType) {
                    return 1;
                }
            }
            return 0;
        }

        getMaskUniforms() {
            if (this._hasPlayingVideoMask()) {
                this._updateVideoMask();
            }
            return this._maskUniforms;
        }

        getMaskDefines() {
            if (!this._maskDefines) {
                this._maskDefines = {};
            }
            if (this._maskUniforms && this._maskUniforms['mask_colorExtent']) {
                this._maskDefines['HAS_MASK_EXTENT'] = 1;
            } else {
                delete this._maskDefines['HAS_MASK_EXTENT'];
            }
            return this._maskDefines;
        }

        updateMaskDefines(mesh) {
            const defines = mesh.getDefines();
            delete defines['HAS_MASK_EXTENT'];
            const maskDefines = this.getMaskDefines();
            extend(defines, maskDefines);
            mesh.setDefines(defines);
        }

        _hasPlayingVideoMask() {
            const masks = this.layer.getMasks();
            if (!masks) {
                return false;
            }
            for (let i = 0; i < masks.length; i++) {
                if (masks[i].getMode() === 'video' && masks[i]._needUpdate()) {
                    return true;
                }
            }
            return false;
        }
    }
}