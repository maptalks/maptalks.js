import * as maptalks from 'maptalks';

export default class TerrainPackLayer extends maptalks.GroupTileLayer {
    constructor(id, terrainLayer, layers, options) {
        super(id, layers, options);
        this._terrainLayer = terrainLayer;
    }

    getTerrainLayer() {
        return this._terrainLayer;
    }
}
