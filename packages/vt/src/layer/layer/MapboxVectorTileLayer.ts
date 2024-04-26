import VectorTileLayer from "./VectorTileLayer";

export default class MapboxVectorTileLayer extends VectorTileLayer {
  getTileUrl(x: number, y: number, z: number) {
    const res = this.getMap().getResolution(z);
    return super.getTileUrl(x, y, getMapBoxZoom(res));
  }

  static fromJSON(layerJSON: object) {
    if (!layerJSON || layerJSON["type"] !== "MapboxVectorTileLayer") {
      return null;
    }

    return new MapboxVectorTileLayer(layerJSON["id"], layerJSON["options"]);
  }
}

MapboxVectorTileLayer.registerJSONType("MapboxVectorTileLayer");

const MAX_RES = (2 * 6378137 * Math.PI) / (256 * Math.pow(2, 20));

function getMapBoxZoom(res: number) {
  return 19 - Math.log(res / MAX_RES) / Math.LN2;
}
