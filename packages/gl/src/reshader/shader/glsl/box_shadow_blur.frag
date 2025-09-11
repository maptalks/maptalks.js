precision highp float;

varying vec2 vTexCoord;

uniform sampler2D textureSource;
uniform vec2 resolution;

#include <common_pack_float>

//TODO 可以参考fxaa.vert, 预先把偏移量在vert中算好，在这里免去循环
void main()
{
    float c = 0.0;
    float weight = 0.0;
    for (int x = -BOXBLUR_OFFSET; x <= BOXBLUR_OFFSET; ++x)
    for (int y = -BOXBLUR_OFFSET; y <= BOXBLUR_OFFSET; ++y)
    {
        vec2 uv = vTexCoord.st + vec2(float(x) / resolution.x, float(y) / resolution.y);
        uv = clamp(uv, 0.0, 1.0);
        float depth = common_decodeDepth(texture2D(textureSource, uv));
        float s = max(0.0, sign(1.0 - depth));
        weight += sign(depth) * s;
        c += depth;
    }
    float avgDepth = c / max(1.0, weight);//float((2 * BOXBLUR_OFFSET + 1) * (2 * BOXBLUR_OFFSET + 1));
    gl_FragColor = common_encodeDepth(avgDepth);

    // gl_FragColor = texture2D(textureSource, vTexCoord.st);
}
