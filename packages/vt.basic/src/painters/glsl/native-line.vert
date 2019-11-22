#ifdef IS_2D_POSITION
    attribute vec2 aPosition;
#else
    attribute vec3 aPosition;
#endif

uniform mat4 projViewModelMatrix;

#if defined(HAS_COLOR)
	attribute vec4 aColor;
    varying vec4 vColor;
#endif

void main() {
    #ifdef IS_2D_POSITION
        vec3 position = vec3(aPosition, 0.0);
    #else
        vec3 position = aPosition;
    #endif
    gl_Position = projViewModelMatrix * vec4(position, 1.0);

    #if defined(HAS_COLOR)
		vColor = aColor / 255.0;
	#endif
}
