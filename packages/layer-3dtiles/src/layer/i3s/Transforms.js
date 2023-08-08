import defaultValue from "./defaultValue.js";
import { eastNorthUpToFixedFrame } from '../../common/TileHelper';
import { mat3, mat4, quat } from 'gl-matrix';
/**
 * Contains functions for transforming positions to various reference frames.
 *
 * @namespace Transforms
 */
const Transforms = {};

const scratchENUMatrix4 = [];
const scratchHPRMatrix3 = [];

/**
 * Computes a quaternion from a reference frame with axes computed from the heading-pitch-roll angles
 * centered at the provided origin. Heading is the rotation from the local north
 * direction where a positive angle is increasing eastward. Pitch is the rotation from the local east-north plane. Positive pitch angles
 * are above the plane. Negative pitch angles are below the plane. Roll is the first rotation applied about the local east axis.
 *
 * @param {Cartesian3} origin The center point of the local reference frame.
 * @param {HeadingPitchRoll} headingPitchRoll The heading, pitch, and roll.
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid whose fixed frame is used in the transformation.
 * @param {Transforms.LocalFrameToFixedFrame} [fixedFrameTransform=Transforms.eastNorthUpToFixedFrame] A 4x4 transformation
 *  matrix from a reference frame to the provided ellipsoid's fixed reference frame
 * @param {Quaternion} [result] The object onto which to store the result.
 * @returns {Quaternion} The modified result parameter or a new Quaternion instance if none was provided.
 *
 * @example
 * // Get the quaternion from local heading-pitch-roll at cartographic (0.0, 0.0) to Earth's fixed frame.
 * var center = Cesium.Cartesian3.fromDegrees(0.0, 0.0);
 * var heading = -Cesium.Math.PI_OVER_TWO;
 * var pitch = Cesium.Math.PI_OVER_FOUR;
 * var roll = 0.0;
 * var hpr = new HeadingPitchRoll(heading, pitch, roll);
 * var quaternion = Cesium.Transforms.headingPitchRollQuaternion(center, hpr);
 */
Transforms.headingPitchRollQuaternion = function (
    origin,
    headingPitchRoll,
    ellipsoid,
    fixedFrameTransform,
    result
) {
    if (!result) {
        result = [];
    }
    const transform = Transforms.headingPitchRollToFixedFrame(
        origin,
        headingPitchRoll,
        ellipsoid,
        fixedFrameTransform,
        scratchENUMatrix4
    );
    const rotation = mat3.fromMat4(scratchHPRMatrix3, transform);
    return quat.fromMat3(result, rotation);
};

const scratchHPRQuaternion = [];
const scratchScale = [1.0, 1.0, 1.0];
const scratchHPRMatrix4 = [];
const ZERO_TRANSLATION = [0, 0, 0];
/**
 * Computes a 4x4 transformation matrix from a reference frame with axes computed from the heading-pitch-roll angles
 * centered at the provided origin to the provided ellipsoid's fixed reference frame. Heading is the rotation from the local north
 * direction where a positive angle is increasing eastward. Pitch is the rotation from the local east-north plane. Positive pitch angles
 * are above the plane. Negative pitch angles are below the plane. Roll is the first rotation applied about the local east axis.
 *
 * @param {Cartesian3} origin The center point of the local reference frame.
 * @param {HeadingPitchRoll} headingPitchRoll The heading, pitch, and roll.
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid whose fixed frame is used in the transformation.
 * @param {Transforms.LocalFrameToFixedFrame} [fixedFrameTransform=Transforms.eastNorthUpToFixedFrame] A 4x4 transformation
 *  matrix from a reference frame to the provided ellipsoid's fixed reference frame
 * @param {Matrix4} [result] The object onto which to store the result.
 * @returns {Matrix4} The modified result parameter or a new Matrix4 instance if none was provided.
 *
 * @example
 * // Get the transform from local heading-pitch-roll at cartographic (0.0, 0.0) to Earth's fixed frame.
 * var center = Cesium.Cartesian3.fromDegrees(0.0, 0.0);
 * var heading = -Cesium.Math.PI_OVER_TWO;
 * var pitch = Cesium.Math.PI_OVER_FOUR;
 * var roll = 0.0;
 * var hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
 * var transform = Cesium.Transforms.headingPitchRollToFixedFrame(center, hpr);
 */
Transforms.headingPitchRollToFixedFrame = function (
    origin,
    headingPitchRoll,
    ellipsoid,
    fixedFrameTransform,
    result
) {
    fixedFrameTransform = defaultValue(
        fixedFrameTransform,
        eastNorthUpToFixedFrame
    );
    const hprQuaternion = fromHeadingPitchRoll(
        headingPitchRoll,
        scratchHPRQuaternion
    );

    const hprMatrix = mat4.fromRotationTranslationScale(scratchHPRMatrix4, hprQuaternion, ZERO_TRANSLATION, scratchScale);

    result = fixedFrameTransform(origin, ellipsoid, result);
    return mat4.multiply(result, result, hprMatrix);
};

export default Transforms;


let scratchHeadingQuaternion = [];
let scratchPitchQuaternion = [];
let scratchRollQuaternion = [];


function fromHeadingPitchRoll(headingPitchRoll, result) {
    scratchRollQuaternion = quat.fromEuler(
        scratchHPRQuaternion,
        headingPitchRoll.roll,
        0,
        0
    );
    scratchPitchQuaternion = quat.fromEuler(
        result,
        0,
        -headingPitchRoll.pitch,
        0
    );
    result = quat.mul(
        scratchPitchQuaternion,
        scratchRollQuaternion,
        scratchPitchQuaternion
    );
    scratchHeadingQuaternion = quat.fromEuler(
        scratchHPRQuaternion,
        0,
        0,
        -headingPitchRoll.heading
    );
    return quat.mul(result, scratchHeadingQuaternion, result);
}
