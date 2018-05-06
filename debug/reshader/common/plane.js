export default {
    // Create a plane
    //    v2----- v3
    //   /       /
    //  v1------v0
    // Coordinates
    vertices : [
        -0.5, 0, -0.5,
        0.5, 0, -0.5,
        -0.5, 0, 0.5,
        0.5, 0, 0.5,
    ],
  
    // Normal
    normals : [
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
    ],
    
    // Indices of the vertices
    indices : [
        3, 1, 0, 0, 2, 3
    ]
  };
  