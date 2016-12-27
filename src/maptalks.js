/**
 * @namespace
 */
const maptalks = {};

import Ajax from './utils/Ajax';
import Canvas from './utils/Canvas';
import Matrix from './utils/Matrix';
import Promise from './utils/Promise';

maptalks.Ajax = Ajax;
maptalks.Canvas = Canvas;
maptalks.Matrix = Matrix;
maptalks.Promise = Promise;

import * as util from 'core/util';
maptalks.Util = util;

maptalks.Util.getJSON = Ajax.getJSON;

import Map from 'map';
maptalks.Map = Map;

import * as ui from 'ui';
maptalks.ui = ui;

import * as control from 'control';
maptalks.control = control;

import { Geometry } from 'geometry';
maptalks.Geometry = Geometry;

import { Layer } from 'layer/Layer';
maptalks.Layer = Layer;

import { TileLayer } from 'layer/tile/TileLayer';
maptalks.TileLayer = TileLayer;

import { OverlayLayer } from 'layer/OverlayLayer';
maptalks.OverlayLayer = OverlayLayer;

import { VectorLayer } from 'layer/VectorLayer';
maptalks.VectorLayer = VectorLayer;

import * as renderer from 'renderer';
maptalks.renderer = renderer;

import * as mapRenderer from 'renderer/map';
maptalks.renderer.map = mapRenderer;

import * as tilelayerRenderer from 'renderer/tilelayer';
maptalks.renderer.tilelayer = tilelayerRenderer;

import * as canvastilelayer from 'renderer/tilelayer/Renderer.CanvasTileLayer.Canvas';
maptalks.renderer.canvastilelayer = canvastilelayer;

import { TileCache } from 'renderer/tilelayer/TileCache';
maptalks.TileLayer.TileCache = TileCache;

import * as overlaylayerRenderer from 'renderer/overlaylayer';
maptalks.renderer.overlaylayer = overlaylayerRenderer;

import * as vectorlayerRenderer from 'renderer/vectorlayer';
maptalks.renderer.vectorlayer = vectorlayerRenderer;

import * as symbolizers from 'renderer/vectorlayer/symbolizers';
maptalks.symbolizers = symbolizers;

export default maptalks;
