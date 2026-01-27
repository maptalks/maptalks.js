import { registerWGSLSource } from "@maptalks/gl";

// Analysis package WGSL files
import depthVert from "../../analysis/src/pass/wgsl/depth_vert.wgsl";
import depthFrag from "../../analysis/src/pass/wgsl/depth_frag.wgsl";
import viewshedVert from "../../analysis/src/pass/wgsl/viewshed_vert.wgsl";
import viewshedFrag from "../../analysis/src/pass/wgsl/viewshed_frag.wgsl";
import insightVert from "../../analysis/src/pass/wgsl/insight_vert.wgsl";
import insightFrag from "../../analysis/src/pass/wgsl/insight_frag.wgsl";
import floodVert from "../../analysis/src/pass/wgsl/flood_vert.wgsl";
import floodFrag from "../../analysis/src/pass/wgsl/flood_frag.wgsl";
import excavateExtentVert from "../../analysis/src/pass/wgsl/excavateExtent_vert.wgsl";
import excavateExtentFrag from "../../analysis/src/pass/wgsl/excavateExtent_frag.wgsl";

// GL package WGSL files
import skyboxVert from "../../gl/src/reshader/skybox/skybox_vert.wgsl";
import skyboxFrag from "../../gl/src/reshader/skybox/skybox_frag.wgsl";
import vsmMappingVert from "../../gl/src/reshader/shadow/wgsl/vsm_mapping_vert.wgsl";
import vsmMappingFrag from "../../gl/src/reshader/shadow/wgsl/vsm_mapping_frag.wgsl";
import shadowDisplayVert from "../../gl/src/reshader/shadow/wgsl/shadow_display_vert.wgsl";
import shadowDisplayFrag from "../../gl/src/reshader/shadow/wgsl/shadow_display_frag.wgsl";
import quadVert from "../../gl/src/reshader/shader/wgsl/quad_vert.wgsl";
import quadFrag from "../../gl/src/reshader/shader/wgsl/quad_frag.wgsl";
import phongVert from "../../gl/src/reshader/shader/wgsl/phong_vert.wgsl";
import phongFrag from "../../gl/src/reshader/shader/wgsl/phong_frag.wgsl";
import imageVert from "../../gl/src/reshader/shader/wgsl/image_vert.wgsl";
import imageFrag from "../../gl/src/reshader/shader/wgsl/image_frag.wgsl";
import fxaafFrag from "../../gl/src/reshader/shader/wgsl/fxaa_frag.wgsl";
import copyFrag from "../../gl/src/reshader/shader/wgsl/copy_frag.wgsl";
import copyDepthFrag from "../../gl/src/reshader/shader/wgsl/copy_depth_frag.wgsl";
import boxShadowBlurFrag from "../../gl/src/reshader/shader/wgsl/box_shadow_blur_frag.wgsl";
import blur6Frag from "../../gl/src/reshader/shader/wgsl/blur6_frag.wgsl";
import blur5Frag from "../../gl/src/reshader/shader/wgsl/blur5_frag.wgsl";
import blur4Frag from "../../gl/src/reshader/shader/wgsl/blur4_frag.wgsl";
import blur3Frag from "../../gl/src/reshader/shader/wgsl/blur3_frag.wgsl";
import blur2Frag from "../../gl/src/reshader/shader/wgsl/blur2_frag.wgsl";
import blur1Frag from "../../gl/src/reshader/shader/wgsl/blur1_frag.wgsl";
import blur0Frag from "../../gl/src/reshader/shader/wgsl/blur0_frag.wgsl";
import bloomCombineFrag from "../../gl/src/reshader/shader/wgsl/bloom_combine_frag.wgsl";
import standardVert from "../../gl/src/reshader/pbr/wgsl/standard_vert.wgsl";
import standardFrag from "../../gl/src/reshader/pbr/wgsl/standard_frag.wgsl";
import terrainVert from "../../gl/src/layer/terrain/wgsl/terrain_vert.wgsl";
import terrainSkinVert from "../../gl/src/layer/terrain/wgsl/terrain_skin_vert.wgsl";
import terrainSkinFrag from "../../gl/src/layer/terrain/wgsl/terrain_skin_frag.wgsl";
import terrainFrag from "../../gl/src/layer/terrain/wgsl/terrain_frag.wgsl";
import glslFillVert from "../../gl/src/layer/glsl/fill_vert.wgsl";
import glslFillFrag from "../../gl/src/layer/glsl/fill_frag.wgsl";
import analysisFrag from "../../gl/src/analysis/wgsl/analysis_frag.wgsl";

// VT package WGSL files
import tubeVert from "../../vt/src/layer/plugins/painters/wgsl/tube_vert.wgsl";
import textVert from "../../vt/src/layer/plugins/painters/wgsl/text_vert.wgsl";
import textLineVert from "../../vt/src/layer/plugins/painters/wgsl/text_line_vert.wgsl";
import textFrag from "../../vt/src/layer/plugins/painters/wgsl/text_frag.wgsl";
import outlineFrag from "../../vt/src/layer/plugins/painters/wgsl/outline_frag.wgsl";
import nativePointVert from "../../vt/src/layer/plugins/painters/wgsl/native-point_vert.wgsl";
import nativePointFrag from "../../vt/src/layer/plugins/painters/wgsl/native-point_frag.wgsl";
import nativeLineVert from "../../vt/src/layer/plugins/painters/wgsl/native-line_vert.wgsl";
import nativeLineFrag from "../../vt/src/layer/plugins/painters/wgsl/native-line_frag.wgsl";
import markerVert from "../../vt/src/layer/plugins/painters/wgsl/marker_vert.wgsl";
import markerFrag from "../../vt/src/layer/plugins/painters/wgsl/marker_frag.wgsl";
import lineVert from "../../vt/src/layer/plugins/painters/wgsl/line_vert.wgsl";
import lineGradientFrag from "../../vt/src/layer/plugins/painters/wgsl/line_gradient_frag.wgsl";
import lineFrag from "../../vt/src/layer/plugins/painters/wgsl/line_frag.wgsl";
import fillVert from "../../vt/src/layer/plugins/painters/wgsl/fill_vert.wgsl";
import fillPickingVert from "../../vt/src/layer/plugins/painters/wgsl/fill_picking_vert.wgsl";
import fillFrag from "../../vt/src/layer/plugins/painters/wgsl/fill_frag.wgsl";
import collisionVert from "../../vt/src/layer/plugins/painters/wgsl/collision_vert.wgsl";
import collisionFrag from "../../vt/src/layer/plugins/painters/wgsl/collision_frag.wgsl";
import billboardVert from "../../vt/src/layer/plugins/painters/wgsl/billboard_vert.wgsl";
import billboardFrag from "../../vt/src/layer/plugins/painters/wgsl/billboard_frag.wgsl";

// Layer video package WGSL files
import videoVert from "../../layer-video/src/video_vert.wgsl";
import videoFrag from "../../layer-video/src/video_frag.wgsl";

// Layer 3D tiles package WGSL files
import pickingVert from "../../layer-3dtiles/src/layer/renderer/wgsl/picking_vert.wgsl";

// Register Analysis WGSL sources
registerWGSLSource("analysis_depth_vert", depthVert);
registerWGSLSource("analysis_depth_frag", depthFrag);
registerWGSLSource("analysis_viewshed_vert", viewshedVert);
registerWGSLSource("analysis_viewshed_frag", viewshedFrag);
registerWGSLSource("analysis_insight_vert", insightVert);
registerWGSLSource("analysis_insight_frag", insightFrag);
registerWGSLSource("analysis_flood_vert", floodVert);
registerWGSLSource("analysis_flood_frag", floodFrag);
registerWGSLSource("analysis_excavateExtent_vert", excavateExtentVert);
registerWGSLSource("analysis_excavateExtent_frag", excavateExtentFrag);

// Register GL WGSL sources
registerWGSLSource("gl_skybox_vert", skyboxVert);
registerWGSLSource("gl_skybox_frag", skyboxFrag);
registerWGSLSource("gl_vsm_mapping_vert", vsmMappingVert);
registerWGSLSource("gl_vsm_mapping_frag", vsmMappingFrag);
registerWGSLSource("gl_shadow_display_vert", shadowDisplayVert);
registerWGSLSource("gl_shadow_display_frag", shadowDisplayFrag);
registerWGSLSource("gl_quad_vert", quadVert);
registerWGSLSource("gl_quad_frag", quadFrag);
registerWGSLSource("gl_phong_vert", phongVert);
registerWGSLSource("gl_phong_frag", phongFrag);
registerWGSLSource("gl_image_vert", imageVert);
registerWGSLSource("gl_image_frag", imageFrag);
registerWGSLSource("gl_fxaa_frag", fxaafFrag);
registerWGSLSource("gl_copy_frag", copyFrag);
registerWGSLSource("gl_copy_depth_frag", copyDepthFrag);
registerWGSLSource("gl_box_shadow_blur_frag", boxShadowBlurFrag);
registerWGSLSource("gl_blur6_frag", blur6Frag);
registerWGSLSource("gl_blur5_frag", blur5Frag);
registerWGSLSource("gl_blur4_frag", blur4Frag);
registerWGSLSource("gl_blur3_frag", blur3Frag);
registerWGSLSource("gl_blur2_frag", blur2Frag);
registerWGSLSource("gl_blur1_frag", blur1Frag);
registerWGSLSource("gl_blur0_frag", blur0Frag);
registerWGSLSource("gl_bloom_combine_frag", bloomCombineFrag);
registerWGSLSource("gl_standard_vert", standardVert);
registerWGSLSource("gl_standard_frag", standardFrag);
registerWGSLSource("gl_terrain_vert", terrainVert);
registerWGSLSource("gl_terrain_skin_vert", terrainSkinVert);
registerWGSLSource("gl_terrain_skin_frag", terrainSkinFrag);
registerWGSLSource("gl_terrain_frag", terrainFrag);
registerWGSLSource("gl_glsl_fill_vert", glslFillVert);
registerWGSLSource("gl_glsl_fill_frag", glslFillFrag);
registerWGSLSource("gl_analysis_frag", analysisFrag);

// Register VT WGSL sources
registerWGSLSource("vt_tube_vert", tubeVert);
registerWGSLSource("vt_text_vert", textVert);
registerWGSLSource("vt_text_line_vert", textLineVert);
registerWGSLSource("vt_text_frag", textFrag);
registerWGSLSource("vt_outline_frag", outlineFrag);
registerWGSLSource("vt_native_point_vert", nativePointVert);
registerWGSLSource("vt_native_point_frag", nativePointFrag);
registerWGSLSource("vt_native_line_vert", nativeLineVert);
registerWGSLSource("vt_native_line_frag", nativeLineFrag);
registerWGSLSource("vt_marker_vert", markerVert);
registerWGSLSource("vt_marker_frag", markerFrag);
registerWGSLSource("vt_line_vert", lineVert);
registerWGSLSource("vt_line_gradient_frag", lineGradientFrag);
registerWGSLSource("vt_line_frag", lineFrag);
registerWGSLSource("vt_fill_vert", fillVert);
registerWGSLSource("vt_fill_picking_vert", fillPickingVert);
registerWGSLSource("vt_fill_frag", fillFrag);
registerWGSLSource("vt_collision_vert", collisionVert);
registerWGSLSource("vt_collision_frag", collisionFrag);
registerWGSLSource("vt_billboard_vert", billboardVert);
registerWGSLSource("vt_billboard_frag", billboardFrag);

// Register Layer Video WGSL sources
registerWGSLSource("layer_video_vert", videoVert);
registerWGSLSource("layer_video_frag", videoFrag);

// Register Layer 3D Tiles WGSL sources
registerWGSLSource("layer_3dtiles_picking_vert", pickingVert);
