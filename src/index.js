export * from './core/Constants';
export { default as Browser } from './core/Browser';
import * as Util from './core/util';
import * as DomUtil from './core/util/dom';
import * as StringUtil from './core/util/strings';
import * as MapboxUtil from './core/mapbox';
export { Util, DomUtil, StringUtil, MapboxUtil };
export { default as Ajax } from './core/Ajax';
export { default as Canvas } from './core/Canvas';

// core classes
export { default as Class } from './core/Class';
export { default as Eventable } from './core/Eventable';
export { default as JSONAble } from './core/JSONAble';

export { default as Handlerable } from './handler/Handlerable';
export { default as Handler } from './handler/Handler';
export { default as DragHandler } from './handler/Drag';

// geo classes
export * from './geo';

export * from './map';

export { MapTool, DrawTool, AreaTool, DistanceTool } from './map/tool';
export { default as SpatialReference } from './map/spatial-reference/SpatialReference';
import './map/spatial-reference/SpatialReference.Arc';

/** @namespace ui */
import * as ui from './ui';
/** @namespace control */
import * as control from './control';
export { ui, control };

export * from './layer';

export * from './geometry';

import './geometry/editor/GeometryEditor';
import './geometry/editor/TextEditable';

import './geometry/ext/Geometry.Animation';
import './geometry/ext/Geometry.Drag';
import './geometry/ext/Geometry.Edit';
import './geometry/ext/Geometry.Events';
import './geometry/ext/Geometry.InfoWindow';

/**
 * @namespace renderer
 */
// import layer renderers
import * as renderer from './renderer';
export { renderer };
// import geometry renderers
import './renderer/geometry';
import * as symbolizer from './renderer/geometry/symbolizers';
/** @namespace animation */
import * as animation from './core/Animation';
export { symbolizer, animation };

export { registerWorkerAdapter } from './core/worker/Worker';

import Actor from './core/worker/Actor';

/**
 * @namespace wprker
 */
const worker = {
    Actor : Actor
};

export { worker };
