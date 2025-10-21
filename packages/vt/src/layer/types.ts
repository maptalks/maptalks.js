import * as maptalks from 'maptalks';
import VectorTileLayer from './layer/VectorTileLayer';
import MapboxVectorTileLayer from './layer/MapboxVectorTileLayer';
import GeoJSONVectorTileLayer from './layer/GeojsonVectorTileLayer';
import VectorTileLayerRenderer from './renderer/VectorTileLayerRenderer';
import Vector3DLayer from './vector/Vector3DLayer';
import { default as PointLayer, PointLayerRenderer } from './vector/PointLayer';
import LineStringLayer from './vector/LineStringLayer';
import PolygonLayer from './vector/PolygonLayer';
import ExtrudePolygonLayer from './vector/ExtrudePolygonLayer';
export { VectorTileLayer, MapboxVectorTileLayer, GeoJSONVectorTileLayer, VectorTileLayerRenderer,
    Vector3DLayer, PointLayer, PointLayerRenderer, LineStringLayer, PolygonLayer, ExtrudePolygonLayer };

maptalks.DrawToolLayer.setLayerClass(PointLayer, LineStringLayer, PolygonLayer);
