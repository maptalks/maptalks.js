#define SHADER_NAME standard
    #extension GL_OES_standard_derivatives : enable
#if defined(GL_EXT_shader_texture_lod)
    #extension GL_EXT_shader_texture_lod : enable
#endif

    // #define saturate(a) clamp( a, 0.0, 1.0 )

    precision mediump float;

    varying vec3 vWorldPos;
    varying vec3 vNormal;

#if defined(USE_NORMAL_MAP)
    varying vec3 vViewPos;
#endif
#if defined(USE_NORMAL_MAP) || defined(USE_ALBEDO_MAP) || defined(USE_OCCULUSIONROUGHNESSMETALLIC_MAP)
    varying vec2 vTexCoord;
#endif

#ifdef USE_COLOR
    varying vec3 vColor;
#endif

    uniform vec3 albedoColor;

#ifdef USE_ALBEDO_MAP
    uniform sampler2D albedoMap;
#endif

#ifdef USE_OCCULUSIONROUGHNESSMETALLIC_MAP
    //it overrides roughness and metallic uniform
    uniform sampler2D occulusionRoughnessMetallicMap;
#else
    uniform float roughness;
    uniform float metallic;
#endif

#ifdef USE_AMBIENT_CUBEMAP
    // IBL
    uniform samplerCube irradianceMap;
    uniform samplerCube prefilterMap;
    uniform sampler2D brdfLUT;
#else
    uniform vec3 ambientColor;
#endif
    uniform float ambientIntensity;

#ifdef USE_SPOT_LIGHT
    // lights
    uniform vec3 spotLightPositions[NUM_OF_SPOT_LIGHTS];
    uniform vec3 spotLightColors[NUM_OF_SPOT_LIGHTS];
#endif

#ifdef USE_DIR_LIGHT
    // directional lights
    uniform vec3 dirLightDirections[NUM_OF_DIR_LIGHTS];
    uniform vec3 dirLightColors[NUM_OF_DIR_LIGHTS];
#endif

    uniform vec3 camPos;

    const float PI = 3.14159265359;

#ifdef USE_NORMAL_MAP
    uniform sampler2D normalMap;
#endif

#ifdef USE_SHADOW_MAP
    #include <vsm_shadow_frag>
#endif

    // Per-Pixel Tangent Space Normal Mapping
	// http://hacksoflife.blogspot.ch/2009/11/per-pixel-tangent-space-normal-mapping.html
    // from three.js/normalmap_pars_fragment.glsl
	vec3 getNormal() {
        #ifdef USE_NORMAL_MAP
            // Workaround for Adreno 3XX dFd*( vec3 ) bug. See #9988

            vec3 q0 = vec3( dFdx( vViewPos.x ), dFdx( vViewPos.y ), dFdx( vViewPos.z ) );
            vec3 q1 = vec3( dFdy( vViewPos.x ), dFdy( vViewPos.y ), dFdy( vViewPos.z ) );
            vec2 st0 = dFdx( vTexCoord.st );
            vec2 st1 = dFdy( vTexCoord.st );

            vec3 S = normalize( q0 * st1.t - q1 * st0.t );
            vec3 T = normalize( -q0 * st1.s + q1 * st0.s );
            vec3 N = normalize( vNormal );

            vec3 mapN = texture2D( normalMap, vTexCoord ).xyz * 2.0 - 1.0;
            mapN.xy = /* normalScale */ 1.0 * mapN.xy;
            mat3 tsn = mat3( S, T, N );
            return normalize( tsn * mapN );
        #else
            return normalize(vNormal);
        #endif
	}

    vec3 getAlbedoColor() {
        #ifdef USE_ALBEDO_MAP
            vec3 color = pow(texture2D(albedoMap, vTexCoord).rgb, vec3(2.2)) * albedoColor;
        #else
            vec3 color = albedoColor;
        #endif
        #ifdef USE_COLOR
            return color * vColor;
        #else
            return color;
        #endif
    }

    float getAO() {
        #ifdef USE_OCCULUSIONROUGHNESSMETALLIC_MAP
            return texture2D(occulusionRoughnessMetallicMap, vTexCoord).r;
        #else
            return 1.0;
        #endif
    }

    float getRoughness() {
        #ifdef USE_OCCULUSIONROUGHNESSMETALLIC_MAP
            return texture2D(occulusionRoughnessMetallicMap, vTexCoord).g;
        #else
            return roughness;
        #endif
    }

    float getMetallic() {
        #ifdef USE_OCCULUSIONROUGHNESSMETALLIC_MAP
            return texture2D(occulusionRoughnessMetallicMap, vTexCoord).b;
        #else
            return metallic;
        #endif
    }

    // ----------------------------------------------------------------------------
    float DistributionGGX(vec3 N, vec3 H, float roughness)
    {
        float a = roughness * roughness;
        float a2 = a*a;
        float NdotH = max(dot(N, H), 0.0);
        float NdotH2 = NdotH * NdotH;

        float nom   = a2;
        float denom = (NdotH2 * (a2 - 1.0) + 1.0);
        denom = PI * denom * denom;

        return nom / denom;
    }
    // ----------------------------------------------------------------------------
    float GeometrySchlickGGX(float NdotV, float roughness)
    {
        float r = (roughness + 1.0);
        float k = (r*r) / 8.0;

        float nom   = NdotV;
        float denom = NdotV * (1.0 - k) + k;

        return nom / denom;
    }
    // ----------------------------------------------------------------------------
    float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness)
    {
        float NdotV = max(dot(N, V), 0.0);
        float NdotL = max(dot(N, L), 0.0);
        float ggx2 = GeometrySchlickGGX(NdotV, roughness);
        float ggx1 = GeometrySchlickGGX(NdotL, roughness);

        return ggx1 * ggx2;
    }
    // ----------------------------------------------------------------------------
    vec3 fresnelSchlick(float cosTheta, vec3 F0)
    {
        return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
    }
    // ----------------------------------------------------------------------------
    vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness)
    {
        return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(1.0 - cosTheta, 5.0);
    }
    // ----------------------------------------------------------------------------

#if defined(USE_DIR_LIGHT) || defined(USE_SPOT_LIGHT)
    vec3 caculateLightLumin(vec3 lightDir, vec3 lightColor, vec3 albedo, vec3 F0, vec3 V, vec3 N, float metallic, float roughness, float attenuation)
    {
        // calculate per-light radiance
        vec3 L = lightDir;
        vec3 H = normalize(V + L);

        vec3 radiance = lightColor * attenuation;

        // Cook-Torrance BRDF
        //TODO 改为GGX
        float NDF = DistributionGGX(N, H, roughness);
        float G   = GeometrySmith(N, V, L, roughness);
        vec3 F    = fresnelSchlick(max(dot(H, V), 0.0), F0);

        vec3 nominator    = NDF * G * F;
        float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.001; // 0.001 to prevent divide by zero.
        vec3 specular = nominator / denominator;

        // kS is equal to Fresnel
        vec3 kS = F;
        // for energy conservation, the diffuse and specular light can't
        // be above 1.0 (unless the surface emits light); to preserve this
        // relationship the diffuse component (kD) should equal 1.0 - kS.
        vec3 kD = vec3(1.0) - kS;
        // multiply kD by the inverse metalness such that only non-metals
        // have diffuse lighting, or a linear blend if partly metal (pure metals
        // have no diffuse light).
        kD *= 1.0 - metallic;

        // scale light by NdotL
        float NdotL = max(dot(N, L), 0.0);

        // add to outgoing radiance Lo
        return (kD * albedo / PI + specular) * radiance * NdotL; // note that we already multiplied the BRDF by the Fresnel (kS) so we won't multiply by kS again
    }
#endif

    void main()
    {
        // material properties
        vec3 albedo = getAlbedoColor();
        float ao = getAO();
        float roughness = getRoughness();
        float metallic = getMetallic();


        // input lighting data
        vec3 N = getNormal();
        vec3 V = normalize(camPos - vWorldPos);
        vec3 R = reflect(-V, N);

        // calculate reflectance at normal incidence; if dia-electric (like plastic) use F0
        // of 0.04 and if it's a metal, use the albedo color as F0 (metallic workflow)
        vec3 F0 = vec3(0.04);
        F0 = mix(F0, albedo, metallic);

        // reflectance equation
        vec3 Lo = vec3(0.0);
        #ifdef USE_SPOT_LIGHT
            for(int i = 0; i < NUM_OF_SPOT_LIGHTS; ++i)
            {
                vec3 lightDir = spotLightPositions[i] - vWorldPos;
                float distance = length(lightDir);
                float attenuation = 1.0 / (distance * distance);
                Lo += caculateLightLumin(normalize(lightDir), spotLightColors[i], albedo, F0, V, N, metallic, roughness, attenuation);
            }
        #endif

        // diffuse equation
        vec3 Do = vec3(0.0);
        #ifdef USE_DIR_LIGHT
            for(int i = 0; i < NUM_OF_DIR_LIGHTS; ++i)
            {
                vec3 lumin = caculateLightLumin(normalize(dirLightDirections[i]), dirLightColors[i], albedo, F0, V, N, metallic, roughness, 1.0);
                #ifdef USE_SHADOW_MAP
                    float shadow = shadow_computeShadow(i);
                    lumin *= shadow;
                #endif
                Do += lumin;
            }
        #endif

        #ifdef USE_AMBIENT_CUBEMAP
            // ambient lighting (we now use IBL as the ambient term)
            vec3 F = fresnelSchlickRoughness(max(dot(N, V), 0.0), F0, roughness);

            vec3 kS = F;
            vec3 kD = 1.0 - kS;
            kD *= 1.0 - metallic;

            vec3 irradiance = textureCube(irradianceMap, N).rgb;
            vec3 diffuse      = irradiance * albedo;

            #if defined(GL_EXT_shader_texture_lod)
                // sample both the pre-filter map and the BRDF lut and combine them together as per the Split-Sum approximation to get the IBL specular part.
                const float MAX_REFLECTION_LOD = 6.0;
                vec3 prefilteredColor = textureCubeLodEXT(prefilterMap, R, roughness * MAX_REFLECTION_LOD).rgb;
            #else
                vec3 prefilteredColor = textureCube(prefilterMap, R).rgb;
            #endif
            vec2 brdf  = texture2D(brdfLUT, vec2(max(dot(N, V), 0.0), roughness)).rg;
            vec3 specular = prefilteredColor * (F * brdf.x + brdf.y);

            vec3 ambient = (kD * diffuse + specular);
        #else
            vec3 ambient = ambientColor;
        #endif

        vec3 color = ambient * ao * ambientIntensity + Lo + Do;

        // HDR tonemapping
        color = color / (color + vec3(1.0));
        // gamma correct
        color = pow(color, vec3(1.0/2.2));

        gl_FragColor = vec4(color, 1.0);
        // gl_FragColor = vec4(prefilteredColor, 1.0);
        // gl_FragColor = vec4(diffuse, 1.0);
        // gl_FragColor = vec4(max(dot(N, V), 0.0), roughness, 0.0, 1.0);
        // gl_FragColor = vec4(brdf, 0.0, 1.0);
        // gl_FragColor = vec4(vTexCoord, 0.0, 1.0);
        // gl_FragColor = vec4(N, 1.0);
        // gl_FragColor = vec4(Do, 1.0);
        // gl_FragColor = vec4(Lo , 1.0);
        // gl_FragColor = vec4(roughness, 0.0, 0.0, 1.0);
    }

