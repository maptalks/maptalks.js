import { reshader } from '@maptalks/gl';
import positionVert from './plugins/painters/includes/position.vert';
import { version } from '../../package.json';
import VectorTileLayer from './layer/VectorTileLayer';
import MapboxVectorTileLayer from './layer/MapboxVectorTileLayer';
import GeoJSONVectorTileLayer from './layer/GeojsonVectorTileLayer';
import VectorTileLayerRenderer from './renderer/VectorTileLayerRenderer';
import Vector3DLayer from './vector/Vector3DLayer';
import PointLayer from './vector/PointLayer';
import LineStringLayer from './vector/LineStringLayer';
import PolygonLayer from './vector/PolygonLayer';
import ExtrudePolygonLayer from './vector/ExtrudePolygonLayer';
import initialize from './initialize';
import { PackUtil, FilterUtil, SYMBOLS_NEED_REBUILD_IN_VT,  SYMBOLS_NEED_REBUILD_IN_VECTOR } from '@maptalks/vector-packer';

reshader.ShaderLib.register('vt_position_vert', positionVert);

VectorTileLayer.VERSION = version;
Vector3DLayer.VERSION = version;

initialize();

export * from './plugins'

export {
    VectorTileLayer,
    MapboxVectorTileLayer,
    GeoJSONVectorTileLayer,
    VectorTileLayerRenderer,
    Vector3DLayer,
    PointLayer,
    LineStringLayer,
    PolygonLayer,
    ExtrudePolygonLayer,
    PackUtil,
    SYMBOLS_NEED_REBUILD_IN_VT,
    SYMBOLS_NEED_REBUILD_IN_VECTOR,
    FilterUtil
};
