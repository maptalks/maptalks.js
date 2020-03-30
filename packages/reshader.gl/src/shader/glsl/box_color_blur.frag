precision highp float;

varying vec2 vTexCoord;

uniform sampler2D textureSource;
uniform vec2 resolution;

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
        float factor = sign(fetchColor.a);
        weight += factor * 1.0;
        c += factor * fetchColor;
    }
    gl_FragColor = c / max(weight, 1.0);
}
