export * from 'core/Constants';
export { default as Browser } from 'core/Browser';
import * as Util from 'core/util';
import * as DomUtil from 'core/util/dom';
import * as MapboxUtil from 'core/mapbox';
export { Util, DomUtil, MapboxUtil };
export { default as Ajax } from 'core/Ajax';
export { default as Canvas } from 'core/Canvas';

// core classes
export { default as Class } from 'core/Class';
export { default as Handler } from 'handler/Handler';
export { default as Handlerable } from 'handler/Handlerable';

// geo classes
export * from 'geo';

export * from 'map';

// maptalks.ui.*
import * as ui from 'ui';
// maptalks.control.*
import * as control from 'control';
export { ui, control };

export * from 'layer';

export * from 'geometry';

/**
 * @namespace
 */
// import layer renderers
import * as renderer from 'renderer';
export { renderer };
// import geometry renderers
import 'renderer/geometry';
import * as symbolizer from 'renderer/geometry/symbolizers';
import * as animation from 'core/Animation';
export { symbolizer, animation };
