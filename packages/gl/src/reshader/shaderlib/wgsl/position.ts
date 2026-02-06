const vert = `
    #ifdef POSITION_IS_INT
        @location($i) aPosition: vec4i,
    #elif POSITION_IS_UINT
        @location($i) aPosition: vec4u,
    #else
        @location($i) aPosition: vec3f,
    #endif
`;

export default {
    vert
};
