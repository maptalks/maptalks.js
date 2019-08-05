vec4 mesh_position;

#if defined(HAS_ATTRIBUTE_TANGENTS)
vec4 mesh_tangents;
#endif

#if defined(HAS_ATTRIBUTE_COLOR)
vec4 mesh_color;
#endif

#if defined(HAS_ATTRIBUTE_UV0)
vec2 mesh_uv0;
#endif

#if defined(HAS_ATTRIBUTE_UV1)
vec2 mesh_uv1;
#endif

#if defined(HAS_ATTRIBUTE_BONE_INDICES)
vec4 mesh_bone_indices;
#endif

#if defined(HAS_ATTRIBUTE_BONE_WEIGHTS)
vec4 mesh_bone_weights;
#endif

varying highp vec3 vertex_worldPosition;
#if defined(HAS_ATTRIBUTE_TANGENTS)
varying mediump vec3 vertex_worldNormal;
#if defined(MATERIAL_HAS_ANISOTROPY) || defined(MATERIAL_HAS_NORMAL) || defined(MATERIAL_HAS_CLEAR_COAT_NORMAL)
varying mediump vec3 vertex_worldTangent;
varying mediump vec3 vertex_worldBitangent;
#endif
#if defined(GEOMETRIC_SPECULAR_AA_NORMAL)
varying centroid vec3 vertex_worldNormalCentroid;
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
