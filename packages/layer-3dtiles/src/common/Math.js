export const EPSILON14 = 0.00000000000001;
export const EPSILON15 = 0.000000000000001;
export const EPSILON6 = 0.000001;

export function equalsEpsilon (
    left,
    right,
    relativeEpsilon,
    absoluteEpsilon
) {  //>>includeEnd('debug');

    relativeEpsilon = (relativeEpsilon || 0.0);
    absoluteEpsilon = (absoluteEpsilon || relativeEpsilon);
    const absDiff = Math.abs(left - right);
    return (
        absDiff <= absoluteEpsilon ||
    absDiff <= relativeEpsilon * Math.max(Math.abs(left), Math.abs(right))
    );
}
