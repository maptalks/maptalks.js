import { mat4 } from 'gl-matrix';

const globalWorldInverse = [];
export default class Skin {
    constructor(joints, inverseBindMatrixData) {
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
        // this.jointTexture = jointTexture;
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
        if (this.jointTexture) {
            this.jointTexture({
                width : 4,
                type : 'float',
                height : this.joints.length,
                data : this.jointData
            });
        }
    }
}
