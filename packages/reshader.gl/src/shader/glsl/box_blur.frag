precision mediump float;

varying vec2 vTexCoord;

uniform sampler2D textureSource;
uniform vec2 textureSize;

void main()
{
    vec2 c = vec2(0.0);
    for (int x = -BOXBLUR_OFFSET; x <= BOXBLUR_OFFSET; ++x)
    for (int y = -BOXBLUR_OFFSET; y <= BOXBLUR_OFFSET; ++y)
	{
        c += texture2D(textureSource, vTexCoord.st + vec2(float(x) / textureSize.x, float(y) / textureSize.y)).rg;
	}
    vec2 color = c / float((2 * BOXBLUR_OFFSET + 1) * (2 * BOXBLUR_OFFSET + 1));
    gl_FragColor = vec4(color, 0.0, 1.0);
}
