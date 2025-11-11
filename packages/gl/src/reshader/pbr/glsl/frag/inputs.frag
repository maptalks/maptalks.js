//------------------------------------------------------------------------------
// Attributes and uniforms
//------------------------------------------------------------------------------

#if !defined(DEPTH_PREPASS)
varying highp vec3 vertex_worldPosition;
#endif

#if defined(HAS_ATTRIBUTE_TANGENTS)
varying mediump vec3 vertex_worldNormal;
#if defined(MATERIAL_HAS_ANISOTROPY) || defined(MATERIAL_HAS_NORMAL) || defined(MATERIAL_HAS_CLEAR_COAT_NORMAL)
varying mediump vec3 vertex_worldTangent;
varying mediump vec3 vertex_worldBitangent;
#endif
#endif

#if defined(HAS_ATTRIBUTE_COLOR)
varying mediump vec4 vertex_color;
#endif

#if defined(HAS_ATTRIBUTE_UV0) && !defined(HAS_ATTRIBUTE_UV1)
 varying highp vec2 vertex_uv01;
#elif defined(HAS_ATTRIBUTE_UV1)
 varying highp vec4 vertex_uv01;
#endif

