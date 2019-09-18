precision mediump float;

varying vec2 vTexCoord;

uniform sampler2D textureSource;
uniform vec2 resolution;

//TODO 可以参考fxaa.vert, 预先把偏移量在vert中算好，在这里免去循环
void main()
{
    float c = 0.0;
    for (int x = -BOXBLUR_OFFSET; x <= BOXBLUR_OFFSET; ++x)
    for (int y = -BOXBLUR_OFFSET; y <= BOXBLUR_OFFSET; ++y)
	{
        c += texture2D(textureSource, vTexCoord.st + vec2(float(x) / resolution.x, float(y) / resolution.y)).r;
	}
    float color = c / float((2 * BOXBLUR_OFFSET + 1) * (2 * BOXBLUR_OFFSET + 1));
    gl_FragColor = vec4(color, 0.0, 0.0, 1.0);
}
