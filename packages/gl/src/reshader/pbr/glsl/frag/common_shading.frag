// These variables should be in a struct but some GPU drivers ignore the
// precision qualifier on individual struct members
      // TBN matrix
highp mat3  shading_tangentToWorld;
      // position of the fragment in world space
highp vec3  shading_position;
      // normalized vector from the fragment to the eye
      vec3  shading_view;
      // normalized normal, in world space
      vec3  shading_normal;
      // reflection of view about normal
      vec3  shading_reflected;
      // dot(normal, view), always strictly >= MIN_N_DOT_V
      float shading_NoV;

#if defined(MATERIAL_HAS_CLEAR_COAT)
      // normalized clear coat layer normal, in world space
      vec3  shading_clearCoatNormal;
#endif
