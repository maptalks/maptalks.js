import { version } from '../../package.json';
import VectorTileLayer from './layer/VectorTileLayer';
import MapboxVectorTileLayer from './layer/MapboxVectorTileLayer';
import GeoJSONVectorTileLayer from './layer/GeojsonVectorTileLayer';
import VectorTileLayerRenderer from './renderer/VectorTileLayerRenderer';
import Vector3DLayer from './vector/Vector3DLayer';
import Point3DLayer from './vector/Point3DLayer';
import initialize from './initialize';

VectorTileLayer.VERSION = version;
Vector3DLayer.VERSION = version;

initialize();

export {
    VectorTileLayer,
    MapboxVectorTileLayer,
    GeoJSONVectorTileLayer,
    VectorTileLayerRenderer,
    Vector3DLayer,
    Point3DLayer
};
