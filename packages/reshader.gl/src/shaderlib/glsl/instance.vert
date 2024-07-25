attribute vec4 instance_vectorA;
attribute vec4 instance_vectorB;
attribute vec4 instance_vectorC;
#ifdef HAS_INSTANCE_TERRAIN_ALTITUDE
attribute float aTerrainAltitude;
uniform float terrainAltitudeScale;
#endif

mat4 instance_getAttributeMatrix() {
    mat4 mat =  mat4(
        instance_vectorA.x, instance_vectorB.x, instance_vectorC.x, 0.0,
        instance_vectorA.y, instance_vectorB.y, instance_vectorC.y, 0.0,
        instance_vectorA.z, instance_vectorB.z, instance_vectorC.z, 0.0,
        instance_vectorA.w, instance_vectorB.w, instance_vectorC.w, 1.0
    );
    #ifdef HAS_INSTANCE_TERRAIN_ALTITUDE
        mat4 terrainMat = mat4(
            1., 0., 0., 0.,
            0., 1., 0., 0.,
            0., 0., 1., 0.,
            0., 0., aTerrainAltitude * terrainAltitudeScale, 1.
        );
        mat = terrainMat * mat;
    #endif
    return mat;
}

#ifdef HAS_INSTANCE_HIGHLIGHT
    attribute vec4 highlight_color;
#endif

#ifdef HAS_INSTANCE_COLOR
   
    attribute vec4 instance_color;
    vec4 instance_getInstanceColor() {
        vec4 color = instance_color;
        #ifdef HAS_INSTANCE_HIGHLIGHT
            color = instance_color * highlight_color;
        #endif
        return color;
    }
#endif
