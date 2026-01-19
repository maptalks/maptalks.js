struct FragmentUniforms {
  #ifdef HAS_FLOODANALYSE
    flood_waterColor: vec3f,
    flood_waterOpacity: f32,
  #endif
  #ifdef HAS_VIEWSHED
    viewshed_visibleColor: vec4f,
    viewshed_invisibleColor: vec4f,
  #endif
  #ifdef HAS_INSIGHT
    insight_visibleColor: vec4f,
    insight_invisibleColor: vec4f,
  #endif
  #ifdef HAS_CROSSCUT
    cutLineColor: vec4f,
  #endif
  #ifdef HAS_HEIGHTLIMIT
    limitColor: vec3f,
  #endif
};

#ifdef HAS_FLOODANALYSE
  @group(0) @binding($b) var floodMap: texture_2d<f32>;
  @group(0) @binding($b) var floodMapSampler: sampler;
#endif

#ifdef HAS_SKYLINE
  @group(0) @binding($b) var skylineMap: texture_2d<f32>;
  @group(0) @binding($b) var skylineMapSampler: sampler;
#endif

#ifdef HAS_VIEWSHED
  @group(0) @binding($b) var viewshedMap: texture_2d<f32>;
  @group(0) @binding($b) var viewshedMapSampler: sampler;
#endif

#ifdef HAS_INSIGHT
  @group(0) @binding($b) var insightMap: texture_2d<f32>;
  @group(0) @binding($b) var insightMapSampler: sampler;
#endif

#ifdef HAS_CUT
  @group(0) @binding($b) var meshesMap: texture_2d<f32>;
  @group(0) @binding($b) var meshesMapSampler: sampler;
  @group(0) @binding($b) var invisibleMap: texture_2d<f32>;
  @group(0) @binding($b) var invisibleMapSampler: sampler;
#endif

#ifdef HAS_EXCAVATE
  @group(0) @binding($b) var excavateMap: texture_2d<f32>;
  @group(0) @binding($b) var excavateMapSampler: sampler;
#endif

#ifdef HAS_CROSSCUT
  @group(0) @binding($b) var crosscutMap: texture_2d<f32>;
  @group(0) @binding($b) var crosscutMapSampler: sampler;
#endif

#ifdef HAS_HEIGHTLIMIT
  @group(0) @binding($b) var heightLimitMap: texture_2d<f32>;
  @group(0) @binding($b) var heightLimitMapSampler: sampler;
#endif

@group(0) @binding($b) var sceneMap: texture_2d<f32>;
@group(0) @binding($b) var sceneMapSampler: sampler;

@group(0) @binding($b) var<uniform> uniforms: FragmentUniforms;

@fragment
fn main(vertexOutput: VertexOutput) -> @location(0) vec4f {
  var glFragColor: vec4f;
  let sceneColor = textureSample(sceneMap, sceneMapSampler, vertexOutput.vTexCoord);
  glFragColor = sceneColor;

  #ifdef HAS_VIEWSHED
    let viewshedColor = textureSample(viewshedMap, viewshedMapSampler, vertexOutput.vTexCoord);
    if (viewshedColor.r > 0.99) {
      glFragColor = vec4f(
        mix(uniforms.viewshed_invisibleColor.rgb, sceneColor.rgb, uniforms.viewshed_invisibleColor.a),
        sceneColor.a
      );
    } else if (viewshedColor.g > 0.99) {
      glFragColor = vec4f(
        mix(uniforms.viewshed_visibleColor.rgb, sceneColor.rgb, uniforms.viewshed_visibleColor.a),
        sceneColor.a
      );
    } else if (viewshedColor.a < 0.01) {
      glFragColor = vec4f(viewshedColor.rgb, 1.0);
    }
  #endif

  #ifdef HAS_FLOODANALYSE
    let floodColor = textureSample(floodMap, floodMapSampler, vertexOutput.vTexCoord);
    if (floodColor.r > 0.0) {
      glFragColor = vec4f(
        mix(glFragColor.rgb, uniforms.flood_waterColor, uniforms.flood_waterOpacity),
        glFragColor.a
      );
    }
  #endif

  #ifdef HAS_SKYLINE
    let skylineColor = textureSample(skylineMap, skylineMapSampler, vertexOutput.vTexCoord);
    if (skylineColor.r > 0.0 || skylineColor.g > 0.0 || skylineColor.b > 0.0) {
      glFragColor = skylineColor;
    }
  #endif

  #ifdef HAS_INSIGHT
    let insightColor = textureSample(insightMap, insightMapSampler, vertexOutput.vTexCoord);
    if (insightColor.g > 0.0) {
      glFragColor = uniforms.insight_visibleColor;
    } else if (insightColor.r > 0.0) {
      glFragColor = uniforms.insight_invisibleColor;
    }
  #endif

  #ifdef HAS_CUT
    let cutColor = textureSample(invisibleMap, invisibleMapSampler, vertexOutput.vTexCoord);
    let meshesMapColor = textureSample(meshesMap, meshesMapSampler, vertexOutput.vTexCoord);
    if (cutColor.r == 1.0 && cutColor.g == 0.0 && cutColor.b == 0.0) {
      glFragColor = meshesMapColor;
    } else if (cutColor.r == 0.0 && cutColor.g == 1.0 && cutColor.b == 0.0) {
      glFragColor = meshesMapColor;
    } else if (cutColor.r == 0.0 && cutColor.g == 0.0 && cutColor.b == 1.0) {
      glFragColor = sceneColor;
    }
  #endif

  #ifdef HAS_EXCAVATE
    let excavateColor = textureSample(excavateMap, excavateMapSampler, vertexOutput.vTexCoord);
    if (excavateColor.r == 1.0 && excavateColor.g == 0.0 && excavateColor.b == 0.0) {
      glFragColor = sceneColor;
    } else {
      glFragColor = excavateColor;
    }
  #endif

  #ifdef HAS_CROSSCUT
    let crosscutColor = textureSample(crosscutMap, crosscutMapSampler, vertexOutput.vTexCoord);
    if (crosscutColor.r > 0.0) {
      glFragColor = vec4f(
        mix(uniforms.cutLineColor.rgb, glFragColor.rgb, 0.99),
        glFragColor.a
      );
    }
  #endif

  #ifdef HAS_HEIGHTLIMIT
    let heightLimitColor = textureSample(heightLimitMap, heightLimitMapSampler, vertexOutput.vTexCoord);
    if (heightLimitColor.r > 0.0) {
      glFragColor = vec4f(
        mix(uniforms.limitColor, glFragColor.rgb, 0.6),
        glFragColor.a
      );
    }
  #endif

  return glFragColor;
}
