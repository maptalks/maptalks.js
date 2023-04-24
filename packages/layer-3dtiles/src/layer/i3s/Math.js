import defaultValue from "./defaultValue.js";

/**
 * Math functions.
 *
 * @exports CesiumMath
 * @alias Math
 */
const CesiumMath = {};


/**
 * The number of radians in a degree.
 *
 * @type {Number}
 * @constant
 */
CesiumMath.RADIANS_PER_DEGREE = Math.PI / 180.0;

/**
 * Determines if two values are equal using an absolute or relative tolerance test. This is useful
 * to avoid problems due to roundoff error when comparing floating-point values directly. The values are
 * first compared using an absolute tolerance test. If that fails, a relative tolerance test is performed.
 * Use this test if you are unsure of the magnitudes of left and right.
 *
 * @param {Number} left The first value to compare.
 * @param {Number} right The other value to compare.
 * @param {Number} [relativeEpsilon=0] The maximum inclusive delta between <code>left</code> and <code>right</code> for the relative tolerance test.
 * @param {Number} [absoluteEpsilon=relativeEpsilon] The maximum inclusive delta between <code>left</code> and <code>right</code> for the absolute tolerance test.
 * @returns {Boolean} <code>true</code> if the values are equal within the epsilon; otherwise, <code>false</code>.
 *
 * @example
 * var a = Cesium.Math.equalsEpsilon(0.0, 0.01, Cesium.Math.EPSILON2); // true
 * var b = Cesium.Math.equalsEpsilon(0.0, 0.1, Cesium.Math.EPSILON2);  // false
 * var c = Cesium.Math.equalsEpsilon(3699175.1634344, 3699175.2, Cesium.Math.EPSILON7); // true
 * var d = Cesium.Math.equalsEpsilon(3699175.1634344, 3699175.2, Cesium.Math.EPSILON9); // false
 */
CesiumMath.equalsEpsilon = function (
    left,
    right,
    relativeEpsilon,
    absoluteEpsilon
) {

    relativeEpsilon = defaultValue(relativeEpsilon, 0.0);
    absoluteEpsilon = defaultValue(absoluteEpsilon, relativeEpsilon);
    const absDiff = Math.abs(left - right);
    return (
        absDiff <= absoluteEpsilon ||
    absDiff <= relativeEpsilon * Math.max(Math.abs(left), Math.abs(right))
    );
};


/**
 * Computes <code>Math.asin(value)</code>, but first clamps <code>value</code> to the range [-1.0, 1.0]
 * so that the function will never return NaN.
 *
 * @param {Number} value The value for which to compute asin.
 * @returns {Number} The asin of the value if the value is in the range [-1.0, 1.0], or the asin of -1.0 or 1.0,
 *          whichever is closer, if the value is outside the range.
 */
CesiumMath.asinClamped = function (value) {
    return Math.asin(CesiumMath.clamp(value, -1.0, 1.0));
};


/**
 * Constraint a value to lie between two values.
 *
 * @param {Number} value The value to constrain.
 * @param {Number} min The minimum value.
 * @param {Number} max The maximum value.
 * @returns {Number} The value clamped so that min <= value <= max.
 */
CesiumMath.clamp = function (value, min, max) {
    return value < min ? min : value > max ? max : value;
};

export default CesiumMath;
