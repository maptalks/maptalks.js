#ifdef GL_ES
precision highp float;
#endif
uniform vec4 maskColor;
#ifdef HAS_TEXTURE
    uniform sampler2D maskTexture;
    varying vec2 uv;
    uniform vec3 mask_position0;
    uniform vec3 mask_position1;
    uniform vec3 mask_position2;
    uniform vec3 mask_position3;
    varying vec4 vPos;

    vec2 bilinearTexCoord(vec2 pos, vec2 a, vec2 b, vec2 c, vec2 d) {
        // 计算当前点在四边形中的参数坐标 (u, v)
        // 使用迭代法求解双线性方程
        vec2 uv = vec2(0.5, 0.5); // 初始猜测

        for(int i = 0; i < 10; i++) {
            float u = uv.x;
            float v = uv.y;

            // 双线性插值公式
            vec2 interpolated = (1.0 - u) * (1.0 - v) * a +
                                u * (1.0 - v) * b +
                                u * v * c +
                                (1.0 - u) * v * d;

            vec2 diff = pos - interpolated;

            if(length(diff) < 0.001) break;

            // 计算雅可比矩阵
            vec2 dPdu = -(1.0 - v) * a + (1.0 - v) * b + v * c - v * d;
            vec2 dPdv = -(1.0 - u) * a - u * b + u * c + (1.0 - u) * d;

            // 计算雅可比行列式
            float det = dPdu.x * dPdv.y - dPdu.y * dPdv.x;

            if(abs(det) > 0.0001) {
                // 牛顿-拉夫逊迭代
                vec2 delta = vec2(
                    (diff.x * dPdv.y - diff.y * dPdv.x) / det,
                    (diff.y * dPdu.x - diff.x * dPdu.y) / det
                );
                uv += delta;
            }

            uv = clamp(uv, 0.0, 1.0);
        }

        return uv;
    }
#endif

void main() {
    #ifdef HAS_TEXTURE
        vec2 pos = vPos.xy;

        // 使用双线性插值计算正确的纹理坐标
        vec2 texCoord = bilinearTexCoord(pos, mask_position0.xy, mask_position1.xy, mask_position2.xy, mask_position3.xy);
        gl_FragColor = texture2D(maskTexture, texCoord);
        gl_FragColor.a *= maskColor.a;
    #else
        if (maskColor.a == 0.0) {
            discard;
        }
        gl_FragColor = maskColor;
    #endif
}
