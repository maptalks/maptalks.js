#ifdef HAS_TERRAIN_NORMAL
    uniform sampler2D terrainHeightTexture;
    uniform vec2 terrainHeightMapResolution;
    uniform vec2 terrainResolution;
    // uniform float terrainHeightScale;
    // uniform float terrainTileResolution;
    uniform vec4 terrainUnpackFactors;

    // queried pixels:
    // +-----------+
    // |   |   |   |
    // | a | b | c |
    // |   |   |   |
    // +-----------+
    // |   |   |   |
    // | d |   | e |
    // |   |   |   |
    // +-----------+
    // |   |   |   |
    // | f | g | h |
    // |   |   |   |
    // +-----------+


    float getHeight(vec2 uv) {
        vec4 color = texture2D(terrainHeightTexture, uv) * 255.0;
        // float height = -10000. + (color.r * 255. * 256. * 256. + color.g * 255. * 256. + color.b * 255.) * 0.1;
        color.a = -1.0;
        return dot(color, terrainUnpackFactors) / 4.0;
    }

    // https://www.shadertoy.com/view/3sSSW1
    // vec3 convertTerrainHeightToNormalMap(in vec2 uv) {
    //     uv.y = 1.0 - uv.y;
    //     vec2 pixelToTexelRatio = terrainResolution / terrainHeightMapResolution;
    //     float height = getHeight(uv);
    //     vec3 normal = normalize(vec3(vec2(dFdx(height), dFdy(height)) * pixelToTexelRatio, 1.0));
    //     return normal * 0.5 + 0.5;
    // }

    vec3 convertTerrainHeightToNormalMap(vec2 uv) {
        uv.y = 1.0 - uv.y;
        vec2 epsilon = 1.0 / terrainHeightMapResolution;

        float a = getHeight(uv + vec2(-epsilon.x, -epsilon.y));
        float b = getHeight(uv + vec2(0, -epsilon.y));
        float c = getHeight(uv + vec2(epsilon.x, -epsilon.y));
        float d = getHeight(uv + vec2(-epsilon.x, 0));
        float e = getHeight(uv + vec2(epsilon.x, 0));
        float f = getHeight(uv + vec2(-epsilon.x, epsilon.y));
        float g = getHeight(uv + vec2(0, epsilon.y));
        float h = getHeight(uv + vec2(epsilon.x, epsilon.y));

        vec2 dxy = vec2(
            (c + e + e + h) - (a + d + d + f),
            (f + g + g + h) - (a + b + b + c)
        );
        return normalize(vec3(dxy / epsilon, terrainResolution ));
    }

    // vec3 convertTerrainHeightToNormalMap(vec2 uv) {
    //     uv.y = 1.0 - uv.y;
    //     float scale = 1.0;
    //     vec2 step = 1.0 / terrainHeightMapResolution;

    //     float height = getHeight(uv);

    //     vec2 dxy = height - vec2(
    //         getHeight(uv + vec2(step.x, 0.)),
    //         getHeight(uv + vec2(0., step.y))
    //     );

    //     // return vec3(normalize(vec3(dxy * scale / step, 1.0 )));
    //     return vec3(0.0, 0.0, 1.0);
    // }


    // vec3 convertTerrainHeightToNormalMap(vec2 uv) {
    //     vec2 texelSize = 1. / terrainHeightMapResolution;
    //     vec2 origin = uv;
    //     float top = getHeight(origin + vec2(0., texelSize.y));
    //     float bottom = getHeight(origin + vec2(0., -texelSize.y));
    //     float left = getHeight(origin + vec2(-texelSize.x, 0.));
    //     float right = getHeight(origin + vec2(texelSize.x, 0.));

    //     vec3 n = normalize(vec3(left - right, bottom - top, 1.0/* terrainTileResolution */));

    //     // vec3 n = normalize(vec3(bottom - top, texelSize.x * heightMapWorldSize, left - right));

    //     return n;
    // }
#endif
