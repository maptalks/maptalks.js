precision highp float;

varying vec2 vTexCoord;

uniform sampler2D textureSource;
uniform vec2 resolution;
uniform float ignoreTransparent;

void main()
{
    vec4 c = vec4(0.0);
    float weight = 0.0;
    for (int x = -BOXBLUR_OFFSET; x <= BOXBLUR_OFFSET; ++x)
    for (int y = -BOXBLUR_OFFSET; y <= BOXBLUR_OFFSET; ++y)
    {
        vec2 uv = vTexCoord.st + vec2(float(x) / resolution.x, float(y) / resolution.y);
        uv = clamp(uv, 0.0, 1.0);
        vec4 fetchColor = texture2D(textureSource, uv);
        float factor;
        if (ignoreTransparent == 1.0) {
            factor = sign(fetchColor.a);
        } else {
            factor = 1.0;
        }
        weight += factor;
        c += factor * fetchColor;
    }
    //当9个像素中，只有一个像素有值则舍弃它，以过滤ssr中可能的噪点
    gl_FragColor = c / max(weight, 1.0) * clamp(sign(weight - 1.0), 0.0, 1.0);
}
