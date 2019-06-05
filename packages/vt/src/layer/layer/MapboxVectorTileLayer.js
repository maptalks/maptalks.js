import VectorTileLayer from './VectorTileLayer';

export default class MapboxVectorTileLayer extends VectorTileLayer {

    getTileUrl(x, y, z) {
        const res = this.getMap().getResolution(z);
        return super.getTileUrl(x, y, getMapBoxZoom(res));
    }
}


const MAX_RES = 2 * 6378137 * Math.PI / (256 * Math.pow(2, 20));
function getMapBoxZoom(res) {
    return 19 - Math.log(res / MAX_RES) / Math.LN2;
}
