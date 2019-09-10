#include <fl_header_frag>

#if defined(HAS_SHADOWING)
#include <vsm_shadow_frag>
#endif

//webgl 2.0中的函数实现
#include <fl_common_math_glsl>
#include <fl_common_graphics_glsl>
//initialize frameUniforms
#include <fl_uniforms_glsl>
//varyings
#include <fl_inputs_frag>
//brdf functions
#include <fl_brdf_frag>
//MaterialInputs结构定义
//mapatalksgl的Material => MaterialInputs
#include <fl_common_shading_frag>
#include <fl_getters_frag>
#include <fl_material_inputs_frag>
#include <fl_common_material_frag>
//构造各类shading_*的值
#include <fl_shading_params>
//PixelParams结构定义
#include <fl_common_lighting_frag>

#include <fl_material_uniforms_frag>
//初始化light相关的uniforms，如light_iblDFG等
#include <fl_light_uniforms_frag>

#include <fl_ambient_occlusion_frag>
//IBL灯光的计算逻辑
#if defined(HAS_IBL_LIGHTING)
#include <fl_light_indirect>
#endif
#include <fl_shading_model_standard_frag>
//有向光的计算逻辑
#include <fl_light_directional>

//lit材质的逻辑
#include <fl_shading_lit>

#include <fl_main>
