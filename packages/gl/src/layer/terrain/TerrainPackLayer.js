import * as maptalks from 'maptalks';
import TerrainPackLayerRenderer from './TerrainPackLayerRenderer';

const options = {
    renderer: 'gl',
    forceRenderOnMoving: true,
    forceRenderOnZooming: true,
    forceRenderOnRotating: true
};

export default class TerrainPackLayer extends maptalks.GroupTileLayer {
    constructor(id, layers, options) {
        super(id, layers, options);
    }

    setTerrainHelper(helper) {
        this._terrainHelper = helper;
    }

    getTerrainHelper() {
        return this._terrainHelper;
    }
}

TerrainPackLayer.mergeOptions(options);

TerrainPackLayer.registerRenderer('gl', TerrainPackLayerRenderer);
