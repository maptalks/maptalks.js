#define SHADER_NAME MARKER
#define HAS_HIGHLIGHT_COLOR_POINT 1

precision mediump float;
#include <gl2_frag>

uniform float alphaTest;
uniform sampler2D iconTex;
uniform lowp float markerOpacity;
uniform lowp float blendSrcIsOne;
uniform float layerOpacity;

#include <highlight_frag>

varying vec2 vTexCoord;
varying float vOpacity;
varying float vIsText;
varying float vHalo;

#include <text_render_frag>

void main() {
    vec4 fragColor;
    // 如果条件写为 vIsText == 1.0 会因为精度问题导致判断错误
    if (vIsText > 0.5) {
        fragColor = renderText(vTexCoord);
    } else {
        fragColor = texture2D(iconTex, vTexCoord) * markerOpacity;
    }

    fragColor = fragColor * vOpacity * layerOpacity;

    // if (blendSrcIsOne == 1.0) {
    //     fragColor *= fragColor.a;
    // }


    // float alphaSum = 0.0;
    // for (int x = -BOXBLUR_OFFSET; x <= BOXBLUR_OFFSET; ++x)
    // for (int y = -BOXBLUR_OFFSET; y <= BOXBLUR_OFFSET; ++y)
    // {
    //     vec2 uv = vTexCoord.st + vec2(float(x) / resolution.x, float(y) / resolution.y);
    //     uv = clamp(uv, 0.0, 1.0);
    //     vec4 fetchColor = texture2D(iconTex, uv);
    //     alphaSum += fetchColor.a;
    // }

    // if (alphaSum / 6.0 < 0.05) {
    //     discard;
    //     return;
    // }

    if (fragColor.a < 0.05) {
        discard;
    }

    glFragColor = fragColor;

    if (glFragColor.a < alphaTest) {
        discard;
    }
    glFragColor = highlight_blendColor(glFragColor);
    // glFragColor = vec4(vIsText, 0.0, 0.0, 1.0);
    #if __VERSION__ == 100
        gl_FragColor = glFragColor;
    #endif
}
