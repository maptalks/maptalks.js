import Geometry from './Geometry.js';
import { getPosArrayType } from './common/Util';

class Plane extends Geometry {
    constructor(z) {
        const arrType = getPosArrayType(z || 0);
        super(
            {
                //width and height are both 1
                aPosition : new arrType([
                    -1, -1, z || 0,
                    1, -1, z || 0,
                    -1, 1, z || 0,
                    1, 1, z || 0,
                ]),

                // Normal
                aNormal : new Int8Array([
                    0, 0, 1,
                    0, 0, 1,
                    0, 0, 1,
                    0, 0, 1,
                ])
            },
            [3, 1, 0, 0, 2, 3]
        );
    }
}

export default Plane;
