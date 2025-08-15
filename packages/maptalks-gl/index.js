export { Ajax, ArcConnectorLine, ArcCurve, AreaTool, BBOXUtil, Browser, COLOR_PROPERTIES, CRS, Canvas, CanvasLayer, CanvasTileLayer, Circle, Class, CollisionIndex, ConnectorLine, Coordinate, CubicBezierCurve, Curve, DEFAULT_TEXT_SIZE, DistanceTool, DomUtil, DragHandler, DrawTool, DrawToolLayer, Ellipse, Eventable, Extent, GEOJSON_TYPES, GEOMETRY_COLLECTION_TYPES, GeoJSON, Geometry, GeometryCollection, GlobalConfig, GlobalEvent, GroupTileLayer, Handler, Handlerable, INTERNAL_LAYER_PREFIX, ImageLayer, JSONAble, LRUCache, Label, Layer, LineString, Map, MapTool, MapboxUtil, Marker, MicroTask, MultiLineString, MultiPoint, MultiPolygon, NUMERICAL_PROPERTIES, OverlayLayer, ParticleLayer, Point, PointExtent, Polygon, QuadBezierCurve, RESOURCE_PROPERTIES, RESOURCE_SIZE_PROPERTIES, Rectangle, ResourceProxy, Sector, Size, SpatialReference, StringUtil, TextBox, TextMarker, TileConfig, TileLayer, TileSystem, Transformation, Util, VectorLayer, WMSTileLayer, animate, animation, control, formatResourceUrl, getDefaultSpatialReference, getResouceCacheInstance, math, measurer, parseSVG, projection, registerWorkerAdapter, renderer, symbolizer, ui, worker } from 'maptalks';
export { Area3DTool, BoxInsideClipMask, BoxOutsideClipMask, ClipInsideMask, ClipOutsideMask, ColorMask, ContextUtil, Distance3DTool, ElevateMask, FlatInsideMask, FlatOutsideMask, GLContext, GroundPainter, GroupGLLayer, HeatmapProcess, Height3DTool, HighlightUtil, ImageMask, MaskLayerMixin, MaskRendererMixin, Measure3DTool, RayCaster, VideoMask, color, createREGL, earcut, glMatrix, mat2, mat2d, mat3, mat4, quat, quat2, reshader, transcoders, vec2, vec3, vec4 } from '@maptalks/gl';
export { ExtrudePolygonLayer, FillPainter, FillPlugin, FilterUtil, GLTFPhongPlugin, GLTFStandardPlugin, GeoJSONVectorTileLayer, HeatmapPlugin, IconPainter, IconPlugin, LineGradientPlugin, LinePainter, LinePlugin, LineStringLayer, LitPlugin, MapboxVectorTileLayer, NativeLinePainter, NativeLinePlugin, NativePointPainter, PackUtil, PhongPainter, PhongPlugin, PointLayer, PolygonLayer, SYMBOLS_NEED_REBUILD_IN_VECTOR, SYMBOLS_NEED_REBUILD_IN_VT, TextPainter, TextPlugin, TubePlugin, Vector3DLayer, VectorTileLayer, VectorTileLayerRenderer, WaterPlugin, WireframePainter, WireframePlugin } from '@maptalks/vt';
export { B3DMLoader, CMPTLoader, Geo3DTilesLayer, Geo3DTilesUtil, Geo3DTransform } from '@maptalks/3dtiles';
export { GLTFGeometry, GLTFLayer, GLTFLineString, GLTFMarker, GLTFMercatorGeometry, MultiGLTFMarker } from '@maptalks/gltf-layer';
export { TransformControl } from '@maptalks/transform-control';
export { VideoLayer, VideoSurface } from '@maptalks/video-layer';

import { transcoders } from '@maptalks/gl';
if (typeof window !== 'undefined') {
    // transcoders are registered at maptalksgl namespace
    // @ts-expect-error-error
    window.maptalksgl = window.maptalksgl || {};
    // @ts-expect-error-error
    window.maptalksgl.transcoders = window.maptalksgl.transcoders || transcoders;
}
