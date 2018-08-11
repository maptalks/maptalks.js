attribute vec3 aPosition;
attribute vec2 aTexCoord;

varying vec2 vTexCoords;

void main()
{
    vTexCoords = aTexCoord;
    gl_Position = vec4(aPosition, 1.0);
}
