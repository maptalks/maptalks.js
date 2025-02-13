//
export function getGroundVertexes() {
    // Push vertex attributes for an additional ground plane
    // prettier-ignore
    return [
         3, -3, -3, 1,
         3, 3, -3, 1,
        -3, 3, -3, 1,

         3, -3, -3, 1,
         -3, 3, -3, 1,
         -3, -3, -3, 1
    ];

    // if (triangles) {
    //     // Push indices for an additional ground plane
    //     triangles.push(
    //         [positions.length, positions.length + 2, positions.length + 1],
    //         [positions.length, positions.length + 1, positions.length + 3]
    //     );
    // }


    // if (uvs) {
    //     uvs.push(
    //         [0, 0], //
    //         [1, 1], //
    //         [0, 1], //
    //         [1, 0]
    //     );
    // }

}
