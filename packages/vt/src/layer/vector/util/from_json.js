import * as maptalks from 'maptalks';

export function fromJSON(json, type, clazz) {
    if (!json || json['type'] !== type) {
        return null;
    }
    const layer = new clazz(json['id'], json['options']);
    const jsons = json['geometries'];
    const geometries = [];
    for (let i = 0; i < jsons.length; i++) {
        const geo = maptalks.Geometry.fromJSON(jsons[i]);
        if (geo) {
            geometries.push(geo);
        }
    }
    layer.addGeometry(geometries);
    return layer;
}
