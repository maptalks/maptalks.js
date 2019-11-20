#define SHADER_NAME vsm_mapping
#ifdef USE_VSM
    #extension GL_OES_standard_derivatives : enable
#endif

precision highp float;
varying vec4 vPosition;

#ifdef PACK_FLOAT
    #include <common_pack_float>
#endif

//VSM
void main()
{
    #if defined(USE_VSM)
        float depth = vPosition.z / vPosition.w;
        depth = depth * 0.5 + 0.5;
        float moment1 = depth;
        float moment2 = depth * depth;

        // Adjusting moments using partial derivative
        float dx = dFdx(depth);
        float dy = dFdy(depth);
        // Resovle shadow acne
        moment2 += 0.25 * (dx * dx + dy * dy);
        gl_FragColor = vec4(moment1, moment2, depth, 0.0);
    #endif

    #if defined(USE_ESM)
        #ifdef PACK_FLOAT
            gl_FragColor = common_encodeDepth(gl_FragCoord.z);
        #else
            gl_FragColor = vec4(gl_FragCoord.z, 0.0, 0.0, 1.0);
        #endif
        // gl_FragColor = vec4(vPosition.z / vPosition.w, 0.0, 0.0, 1.0);
    #endif
}
