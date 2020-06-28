#define SHADER_NAME NATIVE_LINE
attribute vec3 aPosition;
uniform mat4 projViewModelMatrix;

#if defined(HAS_COLOR)
	attribute vec4 aColor;
    varying vec4 vColor;
#endif

void main() {
    gl_Position = projViewModelMatrix * vec4(aPosition, 1.0);

    #if defined(HAS_COLOR)
		vColor = aColor / 255.0;
	#endif
}
