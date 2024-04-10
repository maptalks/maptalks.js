import Geometry from './Geometry.js';
import { getPosArrayType } from './common/Util';

class Plane extends Geometry {
    constructor(z) {
        z = z || 0;
        const arrType = getPosArrayType(z);
        super(
            {
                //width and height are both 1
                aPosition : new arrType([
                    -1, -1, z, // left bottom
                    1, -1, z,  // right bottom
                    -1, 1, z,  // left top
                    1, 1, z,   // right top
                ]),

                // Normal
                aNormal : new Int8Array([
                    0, 0, 1,
                    0, 0, 1,
                    0, 0, 1,
                    0, 0, 1,
                ])
            },
            new Uint16Array([0, 1, 3, 3, 2, 0])
        );
    }
}

export default Plane;
