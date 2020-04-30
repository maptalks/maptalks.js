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
                    -1, -1, z,
                    1, -1, z,
                    -1, 1, z,
                    1, 1, z,
                ]),

                // Normal
                aNormal : new Int8Array([
                    0, 0, 1,
                    0, 0, 1,
                    0, 0, 1,
                    0, 0, 1,
                ])
            },
            [0, 1, 3, 3, 2, 0]
        );
    }
}

export default Plane;
