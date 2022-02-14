#if defined(HAS_TANGENT)
    attribute vec4 aTangent;
#elif defined(HAS_NORMAL)
    #ifdef HAS_DECODE_NORMAL
        attribute vec2 aNormal;
        uniform float gltf_u_dec_normal_rangeConstant;
    #else
        attribute vec3 aNormal;
    #endif
#endif

#ifdef HAS_DECODE_POSITION
    uniform float gltf_u_dec_position_normConstant;
    uniform vec3 minValues_pos;

    vec3 decodeDracoPosition(vec3 aPosition) {
        return minValues_pos + aPosition * gltf_u_dec_position_normConstant;
    }
#endif

#ifdef HAS_DECODE_TEXCOORD
    uniform vec2 minValues_tex;
    uniform float gltf_u_dec_texcoord_0_normConstant;

    vec2 decodeDracoTexcoord(vec2 aTexCoord) {
        return minValues_tex + aTexCoord * gltf_u_dec_texcoord_0_normConstant;
    }
#endif

#ifdef HAS_DECODE_NORMAL
    float czm_signNotZero(float value) {
        return value >= 0.0 ? 1.0 : -1.0;
    }
    vec2 czm_signNotZero(vec2 value) {
        return vec2(czm_signNotZero(value.x), czm_signNotZero(value.y));
    }

    //https://johnwhite3d.blogspot.com/2017/10/signed-octahedron-normal-encoding.html
    vec3 decodeDracoNormal(vec2 encoded, float range)
    {
        if (encoded.x == 0.0 && encoded.y == 0.0) {
            return vec3(0.0, 0.0, 0.0);
        }
        encoded = encoded / range * 2.0 - 1.0;
        vec3 v = vec3(encoded.x, encoded.y, 1.0 - abs(encoded.x) - abs(encoded.y));
        if (v.z < 0.0) {
            v.xy = (1.0 - abs(v.yx)) * czm_signNotZero(v.xy);
        }
        return normalize(v);
    }

    vec3 getNormal(vec2 aNormal) {
        return decodeDracoNormal(aNormal, gltf_u_dec_normal_rangeConstant).zxy;
    }
#endif

vec3 getPositionAsDraco(vec3 aPosition) {
    #ifdef HAS_DECODE_POSITION
        return decodeDracoPosition(aPosition);
    #else
        return aPosition;
    #endif
}

vec2 getTexcoord(vec2 aTexCoord) {
    #ifdef HAS_DECODE_TEXCOORD
        return decodeDracoTexcoord(aTexCoord);
    #else
        return aTexCoord;
    #endif
}
