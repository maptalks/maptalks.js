import { vec3 } from '@maptalks/reshader.gl';

// all args are Vec3, Hit will be filled by this algo
export default function checkLineBox( B1, B2, L1, L2, Hit) {
    // if (L2[0] < B1[0] && L1[0] < B1[0]) return false;
    // if (L2[0] > B2[0] && L1[0] > B2[0]) return false;
    // if (L2[1] < B1[1] && L1[1] < B1[1]) return false;
    // if (L2[1] > B2[1] && L1[1] > B2[1]) return false;
    // if (L2[2] < B1[2] && L1[2] < B1[2]) return false;
    // if (L2[2] > B2[2] && L1[2] > B2[2]) return false;
    // if (L1[0] > B1[0] && L1[0] < B2[0] &&
    //     L1[1] > B1[1] && L1[1] < B2[1] &&
    //     L1[2] > B1[2] && L1[2] < B2[2])
    // {
    //     vec3.set( L1, Hit);
    //     return true;
    // }

    if ((getIntersection(L1[0] - B1[0], L2[0] - B1[0], L1, L2, Hit) && inBox(Hit, B1, B2, 1))
      || (getIntersection(L1[1] - B1[1], L2[1] - B1[1], L1, L2, Hit) && inBox(Hit, B1, B2, 2))
      || (getIntersection(L1[2] - B1[2], L2[2] - B1[2], L1, L2, Hit) && inBox(Hit, B1, B2, 3))
      || (getIntersection(L1[0] - B2[0], L2[0] - B2[0], L1, L2, Hit) && inBox(Hit, B1, B2, 1))
      || (getIntersection(L1[1] - B2[1], L2[1] - B2[1], L1, L2, Hit) && inBox(Hit, B1, B2, 2))
      || (getIntersection(L1[2] - B2[2], L2[2] - B2[2], L1, L2, Hit) && inBox(Hit, B1, B2, 3)))
        return true;

    return false;
}

var temp = [];
function getIntersection( fDst1, fDst2, P1, P2, Hit) {
    if ((fDst1 * fDst2) >= 0) return false;
    if (fDst1 == fDst2) return false;

    vec3.subtract(P2, P1, temp);
    vec3.scale( temp, (-fDst1 / (fDst2 - fDst1)));
    vec3.add( temp, P1, Hit);

    return true;
}

function inBox(Hit, B1, B2, Axis) {
    if (Axis == 1 && Hit[2] > B1[2] && Hit[2] < B2[2] && Hit[1] > B1[1] && Hit[1] < B2[1]) return true;
    if (Axis == 2 && Hit[2] > B1[2] && Hit[2] < B2[2] && Hit[0] > B1[0] && Hit[0] < B2[0]) return true;
    if (Axis == 3 && Hit[0] > B1[0] && Hit[0] < B2[0] && Hit[1] > B1[1] && Hit[1] < B2[1]) return true;
    return false;
}
