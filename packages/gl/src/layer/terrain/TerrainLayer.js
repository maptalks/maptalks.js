import * as maptalks from 'maptalks';
import TerrainLayerRenderer from './TerrainLayerRenderer';

const COORD0 = new maptalks.Coordinate(0, 0);
const POINT0 = new maptalks.Point(0, 0);

const options = {
    'forceRenderOnMoving': true,
    'forceRenderOnZooming': true,
    'forceRenderOnRotating': true,
    'opacity': 1.0,
    'exaggeration': 1.0,
    'renderer': 'gl',
    'pyramidMode': 1,
    'terrainTileSize': 128
};

export default class TerrainLayer extends maptalks.TileLayer {

    queryAltitide(coordinate) {
        const renderer = this.getRenderer();
        if (!renderer) {
            return 0;
        }
        const map = this.getMap();
        const sr = this.getSpatialReference();
        const zoom = this['_getTileZoom'](map.getZoom());
        const res = sr.getResolution(zoom);
        const repeatWorld = this.options['repeatWorld'];
        const config = this['_getTileConfig']();
        const projection = map.getProjection();
        const projCoord = projection.project(coordinate, COORD0);
        const tileIndex = config.getTileIndex(projCoord, res, repeatWorld);

        const worldPos = map.coordToPoint(coordinate, null, POINT0);
        return renderer._queryAltitide(tileIndex, worldPos, zoom);
    }

    queryTileAltitude(out, tileInfo) {
        const renderer = this.getRenderer();
        if (!renderer) {
            return null;
        }
        return renderer._queryTileAltitude(out, tileInfo);
    }

    queryTileMesh(tile, cb) {
        const renderer = this.getRenderer();
        if (!renderer) {
            return;
        }
        renderer._queryTileMesh(tile, cb);
    }
}

TerrainLayer.include({
    '_getTileId': (x, y, z) => {
        // always assume terrain layer is pyramid mode
        // 由字符串操作改为数值操作，提升性能
        const row = Math.sqrt(Math.pow(4, z));
        return (z === 0 ? 0 : Math.pow(4, z - 1)) + x * row + y;
    }
})

TerrainLayer.mergeOptions(options);
TerrainLayer.registerJSONType('TerrainLayer');

TerrainLayer.registerRenderer('gl', TerrainLayerRenderer);
