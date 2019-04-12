#if defined(MATERIAL_HAS_POST_LIGHTING_COLOR)
void blendPostLightingColor(const MaterialInputs material, inout vec4 color) {
#if defined(POST_LIGHTING_BLEND_MODE_OPAQUE)
    color = material.postLightingColor;
#elif defined(POST_LIGHTING_BLEND_MODE_TRANSPARENT)
    color = material.postLightingColor + color * (1.0 - material.postLightingColor.a);
#elif defined(POST_LIGHTING_BLEND_MODE_ADD)
    color += material.postLightingColor;
#endif
}
#endif

#include <fl_gl_post_process_frag>

void main() {
    //uniforms.glsl
    initFrameUniforms();
    // See shading_parameters.frag
    // Computes global variables we need to evaluate material and lighting
    computeShadingParams();

    // Initialize the inputs to sensible default values, see common_material.fs
    MaterialInputs inputs;
    initMaterial(inputs);

    prepareMaterial(inputs);
    // Invoke user code
    getMaterial(inputs);

    vec4 color = evaluateMaterial(inputs);

#if defined(POST_PROCESS_TONE_MAPPING)
    color.rgb = postProcess(color.rgb);
#endif

    gl_FragColor = color;

#if defined(MATERIAL_HAS_POST_LIGHTING_COLOR)
    blendPostLightingColor(inputs, gl_FragColor);
#endif
}
