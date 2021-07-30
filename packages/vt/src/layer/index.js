import { version } from '../../package.json';
import VectorTileLayer from './layer/VectorTileLayer';
import MapboxVectorTileLayer from './layer/MapboxVectorTileLayer';
import GeoJSONVectorTileLayer from './layer/GeojsonVectorTileLayer';
import VectorTileLayerRenderer from './renderer/VectorTileLayerRenderer';
import Vector3DLayer from './vector/Vector3DLayer';
import PointLayer from './vector/PointLayer';
import LineStringLayer from './vector/LineStringLayer';
import PolygonLayer from './vector/PolygonLayer';
import initialize from './initialize';
import { PackUtil } from '@maptalks/vector-packer';

VectorTileLayer.VERSION = version;
Vector3DLayer.VERSION = version;

initialize();

export {
    VectorTileLayer,
    MapboxVectorTileLayer,
    GeoJSONVectorTileLayer,
    VectorTileLayerRenderer,
    Vector3DLayer,
    PointLayer,
    LineStringLayer,
    PolygonLayer,
    PackUtil
};
