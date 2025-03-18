const vert = /* wgsl */`
#if HAS_DRACO_NORMAL || HAS_DRACO_POSITION || HAS_DRACO_TEXCOORD || HAS_WEB3D_QUANTIZED_ATTRIBUTES_TEXCOORD || HAS_COMPRESSED_INT16
    // 定义 uniform 变量
    struct DracoUniforms {
        #if HAS_DRACO_NORMAL
            gltf_u_dec_normal_rangeConstant: f32,
        #endif

        #if HAS_DRACO_POSITION
            minValues_pos: vec3f,
            gltf_u_dec_position_normConstant: f32,
        #endif

        #if HAS_DRACO_TEXCOORD
            minValues_tex: vec2f,
            gltf_u_dec_texcoord_0_normConstant: f32,
        #endif

        #if HAS_WEB3D_QUANTIZED_ATTRIBUTES_TEXCOORD
            decodeMatrix: mat3x3f,
        #endif

    #if HAS_COMPRESSED_INT16
        #if HAS_COMPRESSED_INT16_POSITION
            compressedPositionRange: vec2f, // 压缩位置范围
        #endif
        #if HAS_COMPRESSED_INT16_TEXCOORD_0
            compressedTexcoordRange_0: vec2f, // 压缩纹理坐标范围 0
        #endif
        #if HAS_COMPRESSED_INT16_TEXCOORD_1
            compressedTexcoordRange_1: vec2f, // 压缩纹理坐标范围 1
        #endif
        #if HAS_COMPRESSED_INT16_NORMAL
            compressedNormalRange: vec2f, // 压缩法线范围
        #endif
        #if HAS_COMPRESSED_INT16_RATIO
            compressed_ratio: f32, // 压缩比例
        #endif
    #endif
    };

    @group(0) @binding($b) var<uniform> dracoUniforms: DracoUniforms;
#endif

    // Draco 位置解码函数
    #ifdef HAS_DRACO_POSITION
    fn decodeDracoPosition(aPosition: vec3f) -> vec3f {
        return dracoUniforms.minValues_pos + aPosition * dracoUniforms.gltf_u_dec_position_normConstant;
    }
    #endif

    // Draco 纹理坐标解码函数
    #ifdef HAS_DRACO_TEXCOORD
    fn decodeDracoTexcoord(aTexCoord: vec2f) -> vec2f {
        return dracoUniforms.minValues_tex + aTexCoord * dracoUniforms.gltf_u_dec_texcoord_0_normConstant;
    }
    #endif

    // Draco 法线解码函数
    #ifdef HAS_DRACO_NORMAL
    fn czm_signNotZero(value: f32) -> f32 {
        return select(-1.0, 1.0, value >= 0.0);
    }

    fn czm_signNotZero(value: vec2f) -> vec2f {
        return vec2f(czm_signNotZero(value.x), czm_signNotZero(value.y));
    }

    fn decodeDracoNormal(encoded: vec2f, range: f32) -> vec3f {
        if (encoded.x == 0.0 && encoded.y == 0.0) {
            return vec3f(0.0, 0.0, 0.0);
        }
        encoded = encoded / range * 2.0 - 1.0;
        var v = vec3f(encoded.x, encoded.y, 1.0 - abs(encoded.x) - abs(encoded.y));
        if (v.z < 0.0) {
            v.xy = (1.0 - abs(v.yx)) * czm_signNotZero(v.xy);
        }
        return normalize(v);
    }

    fn decode_getNormal(aNormal: vec2f) -> vec3f {
        return decodeDracoNormal(aNormal, dracoUniforms.gltf_u_dec_normal_rangeConstant).zxy;
    }
    #endif

    // 压缩属性解码函数
    #ifdef HAS_COMPRESSED_INT16
    fn int16ToFloat32(value: f32, range: vec2f) -> f32 {
        let v = select(-(65536.0 - value) / 32768.0, value / 32767.0, value >= 32768.0);
        return (v + 1.0) * (range.y - range.x) / 2.0 + range.x;
    }
    #endif

    // 顶点位置解码函数
    fn decode_getPosition(aPosition: vec3f) -> vec3f {
        var position = aPosition;
    #if HAS_COMPRESSED_INT16 && HAS_COMPRESSED_INT16_POSITION
        let x = int16ToFloat32(aPosition.x, dracoUniforms.compressedPositionRange);
        let y = int16ToFloat32(aPosition.y, dracoUniforms.compressedPositionRange);
        let z = int16ToFloat32(aPosition.z, dracoUniforms.compressedPositionRange);
        #ifdef HAS_COMPRESSED_INT16_RATIO
            position = vec3f(x / dracoUniforms.compressed_ratio, y / dracoUniforms.compressed_ratio, z);
        #else
            position = vec3f(x, y, z);
        #endif
    #endif
    #ifdef HAS_DRACO_POSITION
        return decodeDracoPosition(position);
    #else
        return position;
    #endif
    }

    // 纹理坐标解码函数
    fn decode_getTexcoord(aTexCoord: vec2f) -> vec2f {
        var texcoord = aTexCoord;
    // if HAS_COMPRESSED_INT16 && (HAS_COMPRESSED_INT16_TEXCOORD_0 || HAS_COMPRESSED_INT16_TEXCOORD_1)
    #if HAS_COMPRESSED_INT16 && HAS_COMPRESSED_INT16_TEXCOORD_1
        let x = int16ToFloat32(aTexCoord.x, dracoUniforms.compressedTexcoordRange_0);
        let y = int16ToFloat32(aTexCoord.y, dracoUniforms.compressedTexcoordRange_0);
        texcoord = vec2f(x, y);
    #endif
    #ifdef HAS_DRACO_TEXCOORD
        return decodeDracoTexcoord(texcoord);
    #else
        #if HAS_WEB3D_QUANTIZED_ATTRIBUTES_TEXCOORD
            let web3dTexcoord = dracoUniforms.decodeMatrix * vec3f(texcoord, 1.0);
            return vec2f(web3dTexcoord.x, web3dTexcoord.y);
        #else
            return texcoord;
        #endif
    #endif
    }

    // 法线解码函数
    fn decode_getNormal(aNormal: vec3f) -> vec3f {
    #ifdef HAS_COMPRESSED_INT16_NORMAL
        aNormal.x = int16ToFloat32(aNormal.x, dracoUniforms.compressedNormalRange);
        aNormal.y = int16ToFloat32(aNormal.y, dracoUniforms.compressedNormalRange);
        aNormal.z = int16ToFloat32(aNormal.z, dracoUniforms.compressedNormalRange);
    #endif
        return aNormal;
    }
`;

const attributes = [
    {
        defines: ['HAS_TANGENT'],
        name: 'aTangent',
        type: 'vec4f'
    },
    {
        defines: ['HAS_NORMAL'],
        name: 'aNormal',
        type: 'vec3f'
    },
    {
        defines: ['HAS_NORMAL', 'HAS_DRACO_NORMAL'],
        name: 'aNormal',
        type: 'vec2f'
    }
];

export default {
    vert, attributes
};
