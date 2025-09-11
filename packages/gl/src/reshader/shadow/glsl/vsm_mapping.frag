#define SHADER_NAME vsm_mapping

precision highp float;
varying vec4 vPosition;

#ifdef PACK_FLOAT
    #include <common_pack_float>
#endif

//VSM
void main()
{
    #if defined(USE_ESM)
        #ifdef PACK_FLOAT
            gl_FragColor = common_encodeDepth(gl_FragCoord.z);
        #else
            gl_FragColor = vec4(gl_FragCoord.z, 0.0, 0.0, 1.0);
        #endif
        // gl_FragColor = vec4(vPosition.z / vPosition.w, 0.0, 0.0, 1.0);
    #endif
}
