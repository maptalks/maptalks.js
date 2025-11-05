import Geometry from './Geometry.js';

class Plane extends Geometry {
    constructor(z?: number) {
        z = z || 0;
        super(
            {
                //width and height are both 1
                aPosition : new Float32Array([
                    -1, -1, z, // left bottom
                    1, -1, z,  // right bottom
                    -1, 1, z,  // left top
                    1, 1, z,   // right top
                ]),

                // Normal
                aNormal : new Float32Array([
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
