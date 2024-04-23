import { version } from '../package.json';
export { default as GlobalConfig } from './GlobalConfig';
export * from './core/ResourceProxy';
export * from './core/Constants';
export { default as Browser } from './core/Browser';
import * as Util from './core/util/index';
import * as DomUtil from './core/util/dom';
import * as StringUtil from './core/util/strings';
import * as MapboxUtil from './core/mapbox';

import * as MicroTask from './core/MicroTask';
export { Util, DomUtil, StringUtil, MapboxUtil, MicroTask };

export { default as LRUCache } from './core/util/LRUCache';
export { default as Ajax } from './core/Ajax';
export { default as Canvas } from './core/Canvas';

// core classes
export { default as Class } from './core/Class';
export { default as Eventable } from './core/Eventable';
export { GlobalEvent } from './core/GlobalEvent';
export { default as JSONAble } from './core/JSONAble';
export { default as CollisionIndex } from './core/CollisionIndex';

export { default as Handlerable } from './handler/Handlerable';
export { default as Handler } from './handler/Handler';
export { default as DragHandler } from './handler/Drag';

// geo classes
export * from './geo/index';

import { Map } from './map/index';
Map.VERSION = version;
export { Map };

export { MapTool, DrawTool, AreaTool, DistanceTool } from './map/tool/index';
export { default as SpatialReference } from './map/spatial-reference/SpatialReference';
// import './map/spatial-reference/SpatialReference.Arc';
// import './map/spatial-reference/SpatialReference.WMTS';

/** @namespace ui */
import * as ui from './ui/index';
/** @namespace control */
import * as control from './control/index';
export { ui, control };

export * from './layer/index';

export * from './geometry/index';

import './geometry/editor/GeometryEditor';
import './geometry/editor/TextEditable';

import './geometry/ext/Geometry.Animation';
import './geometry/ext/Geometry.Drag';
import './geometry/ext/Geometry.Edit';
import './geometry/ext/Geometry.Events';
import './geometry/ext/Geometry.InfoWindow';
import './geometry/ext/Geometry.JSON';

/**
 * @namespace renderer
 */
// import layer renderers
import * as renderer from './renderer/index';
export { renderer };
// import geometry renderers
import './renderer/geometry';
import * as symbolizer from './renderer/geometry/symbolizers/index';
/** @namespace animation */
import * as animation from './core/Animation';
export { symbolizer, animation };
export { animate } from './core/Animation';

export { registerWorkerAdapter } from './core/worker/Worker';

import Actor from './core/worker/Actor';

/**
 * @namespace worker
 */
const worker = {
    Actor: Actor
};

export { worker };
