import { mat4 } from 'gl-matrix';

const globalWorldInverse = [];
export default class Skin {
    constructor(regl, joints, inverseBindMatrixData) {
        this._regl = regl;
        this.joints = joints;
        this.inverseBindMatrices = [];
        this.jointMatrices = [];
        this.jointData = new Float32Array(joints.length * 16);
        for (let i = 0; i < joints.length; ++i) {
            this.inverseBindMatrices.push(new Float32Array(
                inverseBindMatrixData.buffer,
                inverseBindMatrixData.byteOffset + Float32Array.BYTES_PER_ELEMENT * 16 * i,
                16));
            this.jointMatrices.push(new Float32Array(
                this.jointData.buffer,
                Float32Array.BYTES_PER_ELEMENT * 16 * i,
                16));
        }
        this.jointTexture = regl.texture();
        this.jointTextureSize = [4, 6];
    }

    setJointTexture(jointTexture) {
        this.jointTexture = jointTexture;
    }

    update(nodeMatrix) {
        mat4.invert(globalWorldInverse, nodeMatrix);
        for (let j = 0; j < this.joints.length; ++j) {
            const joint = this.joints[j];
            const dst = this.jointMatrices[j];
            mat4.multiply(dst, globalWorldInverse, joint.nodeMatrix);
            mat4.multiply(dst, dst, this.inverseBindMatrices[j]);
        }
        const type = this._regl.hasExtension('OES_texture_half_float') ? 'float16' : 'float';
        this.jointTexture({
            width: 4,
            type,
            height: this.joints.length,
            data: this.jointData
        });
    }

    dispose() {
        this.jointTexture.destroy();
    }
}
