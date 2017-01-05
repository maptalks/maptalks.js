export { default as Browser } from 'core/Browser';
import * as Util from 'core/util';
import * as DomUtil from 'core/util/dom';
export { Util, DomUtil };
export { default as Ajax } from 'utils/Ajax';
export { default as Canvas } from 'utils/Canvas';

// core classes
export { default as Class } from 'core/Class';
export { default as Handler } from 'core/Handler';
export { default as Handlerable } from 'core/Handlerable';

// geo classes
export * from 'geo';

export { default as Map } from 'map';
export { MapTool, DrawTool, AreaTool, DistanceTool } from 'map/tool';

// maptalks.ui.*
import * as ui from 'ui';
// maptalks.control.*
import * as control from 'control';
export { ui, control };

export { default as Layer } from 'layer/Layer';
export { default as TileLayer } from 'layer/tile/TileLayer';
export { default as CanvasTileLayer } from 'layer/tile/CanvasTileLayer';
export { default as OverlayLayer } from 'layer/OverlayLayer';
export { default as VectorLayer } from 'layer/VectorLayer';
export { default as GeoJSONLayer } from 'layer/GeoJSONLayer';
export { default as CanvasLayer } from 'layer/CanvasLayer';
export { default as ParticleLayer } from 'layer/ParticleLayer';

export * from 'geometry';

import 'geometry/editor/GeometryEditor';
import 'geometry/editor/TextMarkerEditor';

import 'geometry/ext/Geometry.Animation';
import 'geometry/ext/Geometry.Drag';
import 'geometry/ext/Geometry.Edit';
import 'geometry/ext/Geometry.Events';
import 'geometry/ext/Geometry.InfoWindow';

/**
 * @namespace
 */
// import layer renderers
import * as renderer from 'renderer';
export { renderer };
// import geometry renderers
import 'renderer/geometry';
import * as symbolizer from 'renderer/geometry/symbolizers';
import * as animation from 'utils/Animation';
export { symbolizer, animation };
