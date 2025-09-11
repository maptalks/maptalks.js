//生成 BRDF LUT
precision highp float;

varying vec2 vTexCoords;
uniform sampler2D distributionMap;

const float PI = 3.14159265359;

vec4 packFloat(float a, float b) {
    // vec4 rgba = texture2D(brdfLUT, vec2(NoV, roughness));
    // float b = (rgba[3] * 65280.0 + rgba[2] * 255.0);
    // float a = (rgba[1] * 65280.0 + rgba[0] * 255.0);
    // const float div = 1.0 / 65535.0;
    // return (specular * a + b * f90) * div;

    a *= 65535.0;
    b *= 65535.0;
    vec4 rgba;
    rgba[0] = mod(a, 255.0);
    rgba[1] = (a - rgba[0]) / 65280.0;

    rgba[2] = mod(b, 255.0);
    rgba[3] = (b - rgba[2]) / 65280.0;
    return rgba;
}

vec3 ImportanceSampleGGX(float Xi, vec3 N, float roughness)
{
    vec4 distro = texture2D(distributionMap, vec2(roughness, Xi));
    vec3 H = distro.xyz;
    float s0 = sign(distro.w - 0.5);
    float s1 = sign(distro.w - clamp(s0, 0.0, 1.0) * 200.0 / 255.0 - 0.15);
    H.x *= s0;
    H.y *= s1;

    // from tangent-space H vector to world-space sample vector
    vec3 up          = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
    vec3 tangent   = normalize(cross(up, N));
    vec3 bitangent = cross(N, tangent);

    vec3 sampleVec = tangent * H.x + bitangent * H.y + N * H.z;
    return normalize(sampleVec);
}
// ----------------------------------------------------------------------------
float GeometrySchlickGGX(float NdotV, float roughness)
{
    // note that we use a different k for IBL
    float a = roughness;
    float k = (a * a) / 2.0;

    float nom   = NdotV;
    float denom = NdotV * (1.0 - k) + k;

    return nom / denom;
}
// ----------------------------------------------------------------------------
float GeometrySmith(float NdotV, float NdotL, float roughness)
{
    float ggx2 = GeometrySchlickGGX(NdotV, roughness);
    float ggx1 = GeometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}
// ----------------------------------------------------------------------------
vec2 IntegrateBRDF(float NdotV, float roughness)
{
    vec3 V;
    V.x = sqrt(1.0 - NdotV*NdotV);
    V.y = 0.0;
    V.z = NdotV;

    float A = 0.0;
    float B = 0.0;

    vec3 N = vec3(0.0, 0.0, 1.0);

    const int SAMPLE_COUNT = 1024;
    for(int i = 0; i < SAMPLE_COUNT; ++i)
    {
        // generates a sample vector that's biased towards the
        // preferred alignment direction (importance sampling).
        vec3 H = ImportanceSampleGGX(float(i) / float(SAMPLE_COUNT), N, roughness);
        vec3 L  = normalize(2.0 * dot(V, H) * H - V);

        float NdotL = max(L.z, 0.0);
        float NdotH = max(H.z, 0.0);
        float VdotH = max(dot(V, H), 0.0);
        float NdotV = max(dot(N, V), 0.0);

        if(NdotL > 0.0)
        {
            float G = GeometrySmith(NdotV, NdotL, roughness);
            float G_Vis = (G * VdotH) / (NdotH * NdotV);
            float Fc = pow(1.0 - VdotH, 5.0);

            A += (1.0 - Fc) * G_Vis;
            B += Fc * G_Vis;
        }
    }
    A /= float(SAMPLE_COUNT);
    B /= float(SAMPLE_COUNT);
    return vec2(A, B);
}
// ----------------------------------------------------------------------------
void main()
{
    vec2 integratedBRDF = IntegrateBRDF(vTexCoords.x, vTexCoords.y);
    gl_FragColor = packFloat(integratedBRDF.x, integratedBRDF.y);
    // gl_FragColor = vec4(integratedBRDF, 0.0, 1.0);
    // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
