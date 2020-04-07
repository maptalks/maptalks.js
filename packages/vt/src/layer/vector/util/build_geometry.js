import * as maptalks from 'maptalks';

const POINT = new maptalks.Point(0, 0);
export const ID_PROP = '_pointlayer_id';

//需要解决精度问题
export function convertToFeature(marker) {
    const map = marker.getMap();
    const glZoom = map.getGLZoom();
    const coordinates = marker.getCoordinates();
    const geometry = [];
    if (marker instanceof maptalks.Marker) {
        map.coordToPoint(coordinates, glZoom, POINT);
        geometry.push([POINT.x, POINT.y]);
    } else {
        for (let i = 0; i < coordinates.length; i++) {
            map.coordToPoint(coordinates[i], glZoom, POINT);
            geometry.push([POINT.x, POINT.y]);
        }
    }
    const properties = marker.getProperties() ? Object.assign({}, marker.getProperties()) : {};
    const symbol = marker.getSymbol();
    for (const p in symbol) {
        if (symbol.hasOwnProperty(p)) {
            properties['_symbol_' + p] = symbol[p];
        }
    }
    return {
        type: 1,
        id: marker[ID_PROP],
        properties,
        visible: marker.isVisible(),
        geometry,
        extent: Infinity
    };
}
