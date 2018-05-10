import Geometry from "./Geometry.js";

class Plane extends Geometry {
    constructor() {
        super(
            {
                //width and height are both 1
                aPosition : [
                    -0.5, -0.5, 0,
                    0.5, -0.5, 0,
                    -0.5, 0.5, 0,
                    0.5, 0.5, 0,
                ],

                // Normal
                aNormal : [
                    0, 1, 0,
                    0, 1, 0,
                    0, 1, 0,
                    0, 1, 0,
                ]
            },
            [3, 1, 0, 0, 2, 3]
        );
    }
}

export default Plane;
