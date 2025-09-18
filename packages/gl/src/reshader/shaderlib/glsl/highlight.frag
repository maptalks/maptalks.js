#if defined(HAS_HIGHLIGHT_COLOR)
	varying vec4 vHighlightColor;
#endif

#if defined(HAS_HIGHLIGHT_OPACITY)
    varying float vHighlightOpacity;
#endif

vec4 highlight_blendColor(vec4 color) {
	vec4 outColor;
	#if defined(HAS_HIGHLIGHT_COLOR)
		color.rgb = color.rgb * (1.0 - vHighlightColor.a) + vHighlightColor.rgb * vHighlightColor.a;
		// not defined
		#ifndef HAS_HIGHLIGHT_COLOR_POINT
        	color.a = color.a * (1.0 - vHighlightColor.a) + vHighlightColor.a;
        #endif
        outColor = color;
	#else
		outColor = color;
	#endif

	#if defined(HAS_HIGHLIGHT_OPACITY)
		outColor *= vHighlightOpacity;
	#endif

	return outColor;
}
