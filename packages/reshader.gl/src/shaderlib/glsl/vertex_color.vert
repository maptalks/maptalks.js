#ifdef HAS_VERTEX_COLOR
attribute float aVertexColorType;
uniform vec4 vertexColorsOfType[VERTEX_TYPES_COUNT];
varying vec4 vertexColor_color;

void vertexColor_update() {
    vertexColor_color = vertexColorsOfType[int(aVertexColorType)];
}
#endif
