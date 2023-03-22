#ifdef GL_OES_standard_derivatives
    #extension GL_OES_standard_derivatives : enable
    #define support_standard_derivatives 1
#endif
#ifdef GL_EXT_shader_texture_lod
    #extension GL_EXT_shader_texture_lod : enable
    #define support_shader_texture_lod 1
#endif

precision highp float;

#include <gl2_frag>

#if __VERSION__ == 300
    #define support_standard_derivatives 1
    #define support_shader_texture_lod 1
#endif

    uniform vec3 czm_lightDirectionEC;
    uniform vec4 uDiffuseColor;
#ifdef TexCoord
    varying vec4 vTexCoord;
#ifdef COMPUTE_TEXCOORD
    uniform sampler2D uTexture;
    uniform highp float uTexture0Width;
    varying vec4 vTexCoordTransform;
    varying vec4 vTexMatrix;
    varying vec2 vIsRGBA;
#endif
#endif

    varying vec4 vColor;
    // varying vec4 vSecondColor;
    varying vec4 vPositionMC;
    varying vec3 vPositionEC;
#ifdef VertexNormal
    varying vec3 vNormalEC;
#endif
#ifdef TexCoord2
    uniform sampler2D uTexture2;
    uniform float uTexture1Width;
    varying vec4 vTexMatrix2;
#endif
#ifdef COMPUTE_TEXCOORD
    void calculateMipLevel(in vec2 inTexCoord, in float vecTile, in float fMaxMip, inout float mipLevel)
    {
        vec2 dx = dFdx(inTexCoord * vecTile);
        vec2 dy = dFdy(inTexCoord * vecTile);
        float dotX = dot(dx, dx);
        float dotY = dot(dy, dy);
        float dMax = max(dotX, dotY);
        float dMin = min(dotX, dotY);
        float offset = (dMax - dMin) / (dMax + dMin);
        offset = clamp(offset, 0.0, 1.0);
        float d = dMax * (1.0 - offset) + dMin * offset;
        mipLevel = 0.5 * log2(d);
        mipLevel = clamp(mipLevel, 0.0, fMaxMip - 1.62);
    }

    void calculateTexCoord(in vec3 inTexCoord, in float scale, in float XTran, in float YTran, in float fTile, in float mipLevel, inout vec2 outTexCoord)
    {
        if(inTexCoord.z < -9000.0)
        {
            outTexCoord = inTexCoord.xy;
        }
        else
        {
            vec2 fTexCoord = fract(inTexCoord.xy);
            float offset = 1.0 * pow(2.0, mipLevel) / fTile;
            fTexCoord = clamp(fTexCoord, offset, 1.0 - offset);
            outTexCoord.x = (fTexCoord.x + XTran) * scale;
            outTexCoord.y = (fTexCoord.y + YTran) * scale;
        }
    }

    vec4 getTexColorForS3M(sampler2D curTexture, vec3 oriTexCoord, float texTileWidth, float fMaxMipLev, float fTexCoordScale, vec2 vecTexCoordTranslate, float isRGBA)
    {
        vec4 color = vec4(1.0);
        float mipLevel = 0.0;
    #ifdef support_standard_derivatives
        calculateMipLevel(oriTexCoord.xy, texTileWidth, fMaxMipLev, mipLevel);
    #endif
        vec2 realTexCoord;
        calculateTexCoord(oriTexCoord, fTexCoordScale, vecTexCoordTranslate.x, vecTexCoordTranslate.y, texTileWidth, mipLevel, realTexCoord);
        if(isRGBA > 0.5)
        {
            vec2 rgbTexCoord;
            rgbTexCoord.x = (realTexCoord.x + vecTexCoordTranslate.x * fTexCoordScale) * 0.5;
            rgbTexCoord.y = (realTexCoord.y + vecTexCoordTranslate.y * fTexCoordScale) * 0.5;
            color = texture2D(curTexture, rgbTexCoord.xy, -10.0);
            vec2 vecAlphaTexCoord;
            vecAlphaTexCoord.x = rgbTexCoord.x;
            vecAlphaTexCoord.y = rgbTexCoord.y + fTexCoordScale * 0.5;
            color.a = texture2D(curTexture, vecAlphaTexCoord.xy, -10.0).r;
        }
        else
        {
            if(oriTexCoord.z < -9000.0)
            {
                color = texture2D(curTexture, realTexCoord.xy);
            }
            else
            {
                #ifdef support_shader_texture_lod
                    color = texture2DLodEXT(curTexture, realTexCoord.xy, mipLevel);
                #else
                    color = texture2D(curTexture, realTexCoord.xy, mipLevel);
                #endif
            }
        }

        return color;
    }

    vec4 getTextureColor()
    {
        if(vTexMatrix.z < 0.0)
        {
            return vec4(1.0);
        }
        float texTileWidth0 = vTexMatrix.z * uTexture0Width;
        vec3 realTexCoord = vec3(vTexCoord.xy, vTexCoordTransform.x);
        vec4 FColor = getTexColorForS3M(uTexture, realTexCoord, texTileWidth0, vTexMatrix.w, vTexMatrix.z, vTexMatrix.xy, vIsRGBA.x);
    #ifdef TexCoord2
        float texTileWidth1 = vTexMatrix2.z * uTexture1Width;
        realTexCoord = vec3(vTexCoord.zw, vTexCoordTransform.y);
        vec4 SColor = getTexColorForS3M(uTexture2, realTexCoord, texTileWidth1, vTexMatrix2.w, vTexMatrix2.z, vTexMatrix2.xy, vIsRGBA.y);
        SColor.r = clamp(SColor.r, 0.0, 1.0);
        SColor.g = clamp(SColor.g, 0.0, 1.0);
        SColor.b = clamp(SColor.b, 0.0, 1.0);
        return FColor * SColor;
    #else
        return FColor;
    #endif
    }
#endif
    vec4 SRGBtoLINEAR4(vec4 srgbIn)
    {
    #ifndef HDR
        vec3 linearOut = pow(srgbIn.rgb, vec3(2.2));
        return vec4(linearOut, srgbIn.a);
    #else
        return srgbIn;
    #endif
    }
    vec3 LINEARtoSRGB(vec3 linearIn)
    {
    #ifndef HDR
        return pow(linearIn, vec3(1.0/2.2));
    #else
        return linearIn;
    #endif
    }
    // vec3 applyTonemapping(vec3 linearIn)
    // {
    // #ifndef HDR
    //     return czm_acesTonemapping(linearIn);
    // #else
    //     return linearIn;
    // #endif
    // }

    vec3 computeNormal(in vec3 oriVertex)
    {
        vec3 normal = cross(vec3(dFdx(oriVertex.x), dFdx(oriVertex.y), dFdx(oriVertex.z)), vec3(dFdy(oriVertex.x), dFdy(oriVertex.y), dFdy(oriVertex.z)));
        normal = normalize(normal);
        return normal;
    }

    void main()
    {
        if(vColor.a < 0.1)
        {
            discard;
        }
        vec4 baseColorWithAlpha = vColor;
    #ifdef COMPUTE_TEXCOORD
        baseColorWithAlpha *= SRGBtoLINEAR4(getTextureColor());
    #endif

        if(baseColorWithAlpha.a < 0.1)
        {
            discard;
        }
        vec3 normal = vec3(0.0);
    #ifdef VertexNormal
        normal = normalize(vNormalEC);
    #endif
        normal = length(normal) > 0.1 ? normal : computeNormal(vPositionMC.xyz);
        vec3 color = baseColorWithAlpha.rgb;
        vec3 dirVectorEC = normalize(czm_lightDirectionEC);
        float dotProduct = dot( normal, dirVectorEC );
        float dirDiffuseWeight = max( dotProduct, 0.0 );
        dirDiffuseWeight = dirDiffuseWeight * 0.5 + 0.5;
        color += color * uDiffuseColor.rgb * dirDiffuseWeight;
    #ifdef TexCoord
        color = LINEARtoSRGB(color);
    #endif
        glFragColor = vec4(color, baseColorWithAlpha.a);
#if __VERSION__ == 100
    gl_FragColor = glFragColor;
#endif
    }
