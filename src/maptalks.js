/**
 * @namespace
 */
const maptalks = {};

import Ajax from './utils/Ajax';
import Canvas from './utils/Canvas';
// import Promise from './utils/Promise';

maptalks.Ajax = Ajax;
maptalks.Canvas = Canvas;
// maptalks.Promise = Promise;

import * as util from 'core/util';
maptalks.Util = util;

// maptalks.Util.getJSON = Ajax.getJSON;

import * as DomUtil from 'core/util/dom';
maptalks.DomUtil = DomUtil;

import Map from 'map';
maptalks.Map = Map;

import * from 'map/tool';
maptalks.MapTool = MapTool;
maptalks.DrawTool = DrawTool;
maptalks.AreaTool = AreaTool;
maptalks.DistanceTool = DistanceTool;

import * as ui from 'ui';
maptalks.ui = ui;

import * as control from 'control';
maptalks.control = control;

import { exportGeometries } from 'geometry';
exportGeometries(maptalks);

import { Layer } from 'layer/Layer';
maptalks.Layer = Layer;

import { TileLayer } from 'layer/tile/TileLayer';
maptalks.TileLayer = TileLayer;

import { OverlayLayer } from 'layer/OverlayLayer';
maptalks.OverlayLayer = OverlayLayer;

import { VectorLayer } from 'layer/VectorLayer';
maptalks.VectorLayer = VectorLayer;

// import { TileCache } from 'renderer/tilelayer/TileCache';
// maptalks.TileLayer.TileCache = TileCache;

import * as renderer from 'renderer';
maptalks.renderer = renderer;

import * as Symbolizers from 'renderer/vectorlayer/symbolizers';
maptalks.symbolizers = Symbolizers;

import * as animation from 'utils/Animation';
maptalks.animation = animation;
maptalks.Animation = animation.Animation;

export default maptalks;
