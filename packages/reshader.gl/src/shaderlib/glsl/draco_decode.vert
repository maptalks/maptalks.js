#if defined(HAS_TANGENT)
    attribute vec4 aTangent;
#elif defined(HAS_NORMAL)
    #ifdef HAS_DRACO_NORMAL
        attribute vec2 aNormal;
        uniform float gltf_u_dec_normal_rangeConstant;
    #else
        attribute vec3 aNormal;
    #endif
#endif

#ifdef HAS_DRACO_POSITION
    uniform float gltf_u_dec_position_normConstant;
    uniform vec3 minValues_pos;

    vec3 decodeDracoPosition(vec3 aPosition) {
        return minValues_pos + aPosition * gltf_u_dec_position_normConstant;
    }
#endif

#ifdef HAS_DRACO_TEXCOORD
    uniform vec2 minValues_tex;
    uniform float gltf_u_dec_texcoord_0_normConstant;

    vec2 decodeDracoTexcoord(vec2 aTexCoord) {
        return minValues_tex + aTexCoord * gltf_u_dec_texcoord_0_normConstant;
    }
#endif

#ifdef HAS_WEB3D_quantized_attributes_TEXCOORD
    uniform mat3 decodeMatrix;
#endif

#ifdef HAS_DRACO_NORMAL
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

    vec3 decode_getNormal(vec2 aNormal) {
        return decodeDracoNormal(aNormal, gltf_u_dec_normal_rangeConstant).zxy;
    }
#endif

#ifdef HAS_COMPRESSED_INT16
    #ifdef HAS_COMPRESSED_INT16_POSITION
      uniform vec2 compressedPositionRange;
    #endif
    #ifdef HAS_COMPRESSED_INT16_TEXCOORD_0
      uniform vec2 compressedTexcoordRange_0;
    #endif
    #ifdef HAS_COMPRESSED_INT16_TEXCOORD_1
      uniform vec2 compressedTexcoordRange_1;
    #endif
    #ifdef HAS_COMPRESSED_INT16_NORMAL
      uniform vec2 compressedNormalRange;
    #endif
    #ifdef HAS_COMPRESSED_INT16_RATIO
      uniform float compressed_ratio;
    #endif
    float int16ToFloat32(float value, vec2 range) {
        float v = (value >= 32768.0) ? -(65536.0 - value) / 32768.0 : value / 32767.0;
        return (v + 1.0) * (range.y - range.x) / 2.0 + range.x;
    }
#endif

vec3 decode_getPosition(vec3 aPosition) {
    vec3 position = aPosition;
    #if defined(HAS_COMPRESSED_INT16) && defined(HAS_COMPRESSED_INT16_POSITION)
        float x = int16ToFloat32(aPosition.x, compressedPositionRange);
        float y = int16ToFloat32(aPosition.y, compressedPositionRange);
        float z = int16ToFloat32(aPosition.z, compressedPositionRange);
        #ifdef HAS_COMPRESSED_INT16_RATIO
          position = vec3(x / compressed_ratio, y / compressed_ratio, z);
        #else
          position = vec3(x, y, z);
        #endif
    #endif
    #ifdef HAS_DRACO_POSITION
        return decodeDracoPosition(position);
    #else
        return position;
    #endif
}

vec2 decode_getTexcoord(vec2 aTexCoord) {
    vec2 texcoord = aTexCoord;
    #if defined(HAS_COMPRESSED_INT16) && (defined(HAS_COMPRESSED_INT16_TEXCOORD_0) || defined(HAS_COMPRESSED_INT16_TEXCOORD_1))
        float x = int16ToFloat32(aTexCoord.x, compressedTexcoordRange_0);
        float y = int16ToFloat32(aTexCoord.y, compressedTexcoordRange_0);
        texcoord = vec2(x, y);
    #endif
    #ifdef HAS_DRACO_TEXCOORD
        return decodeDracoTexcoord(texcoord);
    #elif defined(HAS_WEB3D_quantized_attributes_TEXCOORD)
        vec3 web3dTexcoord = decodeMatrix * vec3(texcoord, 1.0);
        return vec2(web3dTexcoord.x, web3dTexcoord.y);
    #else
        return texcoord;
    #endif
}

vec3 decode_getNormal(vec3 aNormal) {
    #ifdef HAS_COMPRESSED_INT16_NORMAL
        aNormal.x = int16ToFloat32(aNormal.x, compressedNormalRange);
        aNormal.y = int16ToFloat32(aNormal.y, compressedNormalRange);
        aNormal.z = int16ToFloat32(aNormal.z, compressedNormalRange);
    #endif
    return aNormal;
}
