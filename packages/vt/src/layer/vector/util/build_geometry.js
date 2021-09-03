import { extend, hasOwn } from '../../../common/Util';
import * as maptalks from 'maptalks';
import { KEY_IDX } from '../../../common/Constant';

const POINT = new maptalks.Point(0, 0);
export const ID_PROP = '_vector3dlayer_id';

//需要解决精度问题
// currentFeature 是geometry已经存在的feature，则沿用老的kid
export function convertToFeature(geo, kidGen, currentFeature) {
    const keyName = (KEY_IDX + '').trim();
    const map = geo.getMap();
    const glZoom = map.getGLZoom();
    let coordinates = geo.getCoordinates();
    const geometry = [];
    let type = 1;
    if (geo instanceof maptalks.Marker || geo instanceof maptalks.MultiPoint) {
        if (geo instanceof maptalks.Marker) {
            coordinates = [coordinates];
        }
        for (let i = 0; i < coordinates.length; i++) {
            map.coordToPoint(coordinates[i], glZoom, POINT);
            geometry.push([POINT.x, POINT.y]);
        }
    } else if (geo instanceof maptalks.LineString || geo instanceof maptalks.MultiLineString) {
        type = 2;
        if (geo instanceof maptalks.LineString) {
            coordinates = [coordinates];
        }
        for (let i = 0; i < coordinates.length; i++) {
            geometry[i] = [];
            for (let ii = 0; ii < coordinates[i].length; ii++) {
                map.coordToPoint(coordinates[i][ii], glZoom, POINT);
                geometry[i].push([POINT.x, POINT.y]);
            }
        }
    } else if (geo instanceof maptalks.Polygon || geo instanceof maptalks.MultiPolygon) {
        type = 3;
        if (geo instanceof maptalks.Polygon) {
            coordinates = [coordinates];
        }
        let ringCount = 0;
        for (let i = 0; i < coordinates.length; i++) {
            for (let ii = 0; ii < coordinates[i].length; ii++) {
                geometry[ringCount] = [];
                for (let iii = 0; iii < coordinates[i][ii].length; iii++) {
                    map.coordToPoint(coordinates[i][ii][iii], glZoom, POINT);
                    geometry[ringCount].push([POINT.x, POINT.y]);
                }
                ringCount++;
            }
        }
    }
    const properties = geo.getProperties() ? Object.assign({}, geo.getProperties()) : {};
    const symbol = geo['_getInternalSymbol']();
    const kid = currentFeature ? (Array.isArray(currentFeature) ? currentFeature[0][keyName] : currentFeature[keyName]) : kidGen.id++;
    if (Array.isArray(symbol) && symbol.length) {
        // symbol为数组时，则重复添加相同的Feature
        const features = [];
        const len = symbol.length;
        for (let i = 0; i < len; i++) {
            const props = i === len - 1 ? properties : extend({}, properties);
            for (const p in symbol[i]) {
                if (hasOwn(symbol[i], p)) {
                    props['_symbol_' + p] = symbol[i][p];
                }
            }
            const pickingId = (currentFeature && currentFeature[i]) ? currentFeature[i].id : kidGen.pickingId++;
            const fea = {
                type,
                id: kid,
                properties: props,
                visible: geo.isVisible(),
                geometry,
                extent: Infinity
            };
            fea[keyName] = pickingId;
            features.push(fea);
        }
        return features;
    } else {
        for (const p in symbol) {
            if (hasOwn(symbol, p)) {
                properties['_symbol_' + p] = symbol[p];
            }
        }
    }
    const pickingId = currentFeature ? currentFeature.id : kidGen.pickingId++;
    const feature = {
        type,
        id: kid,
        properties,
        visible: geo.isVisible(),
        geometry,
        extent: Infinity
    };
    feature[keyName] = pickingId;
    return feature;
}
