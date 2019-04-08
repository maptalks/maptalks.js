//webgl 2.0中的函数实现
#include <fl_common_math_glsl>
//initialize frameUniforms
#include <fl_uniforms_glsl>
//MaterialInputs结构定义
#include <fl_common_material_frag>
//构造各类shading_*的值
#include <fl_shading_params>
//PixelParams结构定义
#include <fl_common_lighting_frag>
//mapatalksgl的Material => MaterialInputs
#include <fl_material_uniforms_frag>

//IBL灯光的计算逻辑
#include <fl_light_indirect>
//有向光的计算逻辑
#include <fl_light_directional>

//lit材质的逻辑
#include <fl_shading_lit>

#include <fl_main>
