import { version } from '../../package.json';
import VectorTileLayer from './layer/VectorTileLayer';
import GeoJSONVectorTileLayer from './layer/GeojsonVectorTileLayer';
import VectorTileLayerRenderer from './renderer/VectorTileLayerRenderer';
import initialize from './initialize';

VectorTileLayer.VERSION = version;

initialize();

export {
    VectorTileLayer,
    GeoJSONVectorTileLayer,
    VectorTileLayerRenderer
};
