import * as maptalks from 'maptalks';
import TerrainLayerRenderer from './TerrainLayerRenderer';

const options = {
    'forceRenderOnMoving': true,
    'forceRenderOnZooming': true,
    'forceRenderOnRotating': true,
    'opacity': 1.0,
    'exaggeration': 1.0,
    'renderer': 'gl',
    'pyramidMode': 1
};

export default class TerrainLayer extends maptalks.TileLayer {

    queryAltitide(coordinate) {
        const map = this.getMap();
        const sr = this.getSpatialReference();
        const zoom = Math.round(map.getZoom());
        const res = sr.getResolution(zoom);
        const repeatWorld = this.options['repeatWorld'];
        const config = this._getTileConfig();
        const projection = map.getProjection();
        const projCoord = projection.projectCoords(coordinate);
        const tileIndex = config.getTileIndex(projCoord, res, repeatWorld);
        const renderer = this.getRenderer();
        if (renderer) {
            const worldPos = map.coordinateToPoint(coordinate);
             return renderer._queryAltitide(tileIndex, worldPos, zoom);
        }
    }

    // getAnalysisMeshes() {
    //     const renderer = this.getRenderer();
    //     if (renderer) {
    //         return renderer.getAnalysisMeshes();
    //     }
    //     return [];
    // }

    // identifyAtPoint(point, options) {
    //     const map = this.getMap();
    //     if (!map) {
    //         return [];
    //     }
    //     const dpr = map.getDevicePixelRatio();
    //     const x = point.x * dpr, y = point.y * dpr;
    //     const picked = this._pick(x, y, options);
    //     const pickedPoint = picked && picked.point;
    //     if (pickedPoint) {
    //         const coordinate = map.pointAtResToCoordinate(new maptalks.Point(pickedPoint[0], pickedPoint[1]), map.getGLRes());
    //         return [{ point: new maptalks.Coordinate(coordinate.x, coordinate.y, pickedPoint[2]) }];
    //     } else {
    //         return [];
    //     }
    // }

    // _pick(x, y, options) {
    //     const renderer = this.getRenderer();
    //     if (renderer) {
    //         return renderer._pick(x, y, options);
    //     }
    //     return null;
    // }
}

TerrainLayer.include({
    '_getTileId': (x, y, z) => {
        // always assume terrain layer is pyramid mode
        const row = Math.sqrt(Math.pow(4, z));
        return (z === 0 ? 0 : Math.pow(4, z - 1)) + x * row + y;
    }
})

TerrainLayer.mergeOptions(options);
TerrainLayer.registerJSONType('TerrainLayer');

TerrainLayer.registerRenderer('gl', TerrainLayerRenderer);
