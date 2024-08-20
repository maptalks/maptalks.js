import { extend, hasOwn } from '../../../common/Util';
import * as maptalks from 'maptalks';
import { KEY_IDX } from '../../../common/Constant';
import { LINE_GRADIENT_PROP_KEY } from './symbols';
import { PackUtil } from '../../../packer';

const POINT = new maptalks.Point(0, 0);
export const ID_PROP = '_vector3dlayer_id';
const GRADIENT_PROP_KEY = (LINE_GRADIENT_PROP_KEY + '').trim();

//需要解决精度问题
// currentFeature 是geometry已经存在的feature，则沿用老的kid
export function convertToFeature(geo, kidGen, currentFeature) {
    const keyName = (KEY_IDX + '').trim();
    const map = geo.getMap();
    const glRes = map.getGLRes();
    let coordinates = geo.getCoordinates();
    const geometry = [];
    const coords = [];
    let type = 1;
    if (geo instanceof maptalks.Marker || geo instanceof maptalks.MultiPoint) {
        if (geo instanceof maptalks.Marker) {
            coordinates = [coordinates];
        }
        for (let i = 0; i < coordinates.length; i++) {
            map.coordToPointAtRes(coordinates[i], glRes, POINT);
            geometry.push([POINT.x, POINT.y, (coordinates[i].z || 0)]);
            coords.push([coordinates[i].x, coordinates[i].y]);
        }
    } else if (geo instanceof maptalks.LineString || geo instanceof maptalks.MultiLineString) {
        type = 2;
        if (geo instanceof maptalks.LineString) {
            coordinates = [coordinates];
        }
        for (let i = 0; i < coordinates.length; i++) {
            geometry[i] = [];
            coords[i] = [];
            for (let ii = 0; ii < coordinates[i].length; ii++) {
                map.coordToPointAtRes(coordinates[i][ii], glRes, POINT);
                geometry[i].push([POINT.x, POINT.y, (coordinates[i][ii].z || 0)]);
                coords[i].push([coordinates[i][ii].x, coordinates[i][ii].y]);
            }
        }
    } else if (geo instanceof maptalks.Polygon || geo instanceof maptalks.MultiPolygon) {
        type = 3;
        if (geo instanceof maptalks.Circle || geo instanceof maptalks.Rectangle || geo instanceof maptalks.Ellipse || geo instanceof maptalks.Sector) {
            coordinates = [[geo.getShell()]];
        } else if (geo instanceof maptalks.Polygon) {
            coordinates = [coordinates];
        }
        let ringIndex = 0;
        for (let i = 0; i < coordinates.length; i++) {
            let shellIsClockwise = false;
            for (let ii = 0; ii < coordinates[i].length; ii++) {
                geometry[ringIndex] = [];
                coords[ringIndex] = [];
                if (shellIsClockwise) {
                    for (let iii = coordinates[i][ii].length - 1; iii >= 0; iii--) {
                        map.coordToPointAtRes(coordinates[i][ii][iii], glRes, POINT);
                        geometry[ringIndex].push([POINT.x, POINT.y, (coordinates[i][ii][iii].z || 0)]);
                        coords[ringIndex].push([coordinates[i][ii][iii].x, coordinates[i][ii][iii].y]);
                    }
                } else {
                    for (let iii = 0; iii < coordinates[i][ii].length; iii++) {
                        map.coordToPointAtRes(coordinates[i][ii][iii], glRes, POINT);
                        geometry[ringIndex].push([POINT.x, POINT.y, (coordinates[i][ii][iii].z || 0)]);
                        coords[ringIndex].push([coordinates[i][ii][iii].x, coordinates[i][ii][iii].y]);
                    }
                }
                if (ii === 0) {
                    shellIsClockwise = PackUtil.calculateSignedArea(geometry[ringIndex]) < 0;
                    if (shellIsClockwise) {
                        geometry[ringIndex] = geometry[ringIndex].reverse();
                        coords[ringIndex] = coords[ringIndex].reverse();
                    }
                }
                ringIndex++;
            }
        }
    }
    const properties = geo.getProperties() ? Object.assign({}, geo.getProperties()) : {};
    const symbol = geo['_getInternalSymbol']() || getDefaultSymbol(geo);
    const kid = currentFeature ? (Array.isArray(currentFeature) ? currentFeature[0]['id'] : currentFeature['id']) : kidGen.id++;
    if (Array.isArray(symbol) && symbol.length) {
        // symbol为数组时，则重复添加相同的Feature
        const features = [];
        const len = symbol.length;
        for (let i = 0; i < len; i++) {
            const props = i === len - 1 ? properties : extend({}, properties);
            const lineGradientProperty = fillGradientProperties(symbol[i], props);
            for (const p in symbol[i]) {
                if (hasOwn(symbol[i], p)) {
                    const keyName = ('_symbol_' + p).trim();
                    props[keyName] = symbol[i][p];
                }
            }
            if (lineGradientProperty) {
                symbol[i]['lineGradientProperty'] = lineGradientProperty;
            }
            const pickingId = (currentFeature && currentFeature[i]) ? currentFeature[i][keyName] : kidGen.pickingId++;
            const fea = {
                type,
                id: kid,
                properties: props,
                visible: geo.isVisible(),
                geometry,
                coordinates: coords,
                extent: Infinity
            };
            fea[keyName] = pickingId;
            features.push(fea);
        }
        return features;
    } else if (symbol) {
        const lineGradientProperty = fillGradientProperties(symbol, properties);
        for (const p in symbol) {
            if (hasOwn(symbol, p)) {
                const keyName = ('_symbol_' + p).trim();
                properties[keyName] = symbol[p];
            }
        }
        if (lineGradientProperty) {
            symbol['lineGradientProperty'] = lineGradientProperty;
        }
    }

    const pickingId = currentFeature ? currentFeature.id : kidGen.pickingId++;
    const feature = {
        type,
        id: kid,
        properties,
        visible: geo.isVisible(),
        geometry,
        coordinates: coords,
        extent: Infinity
    };
    feature[keyName] = pickingId;
    return feature;
}

function fillGradientProperties(symbol, props) {
    const lineGradientProperty = symbol['lineGradientProperty'];
    if (lineGradientProperty) {
        props[GRADIENT_PROP_KEY] = props[lineGradientProperty];
        props['mapbox_clip_start'] = 0;
        props['mapbox_clip_end'] = 1;
        delete props[lineGradientProperty];
    }
    return lineGradientProperty;
}

function getDefaultSymbol(geo) {
    if (geo instanceof maptalks.Marker || geo instanceof maptalks.MultiPoint) {
        return {
            markerType: 'ellipse',
            markerWidth: 8,
            markerHeight: 0,
            markerFill: '#000'
        };
    } else if (geo instanceof maptalks.LineString || geo instanceof maptalks.MultiLineString) {
        return {
            lineColor: '#000',
            lineWidth: 1
        };
    } else if (geo instanceof maptalks.Polygon || geo instanceof maptalks.MultiPolygon) {
        return {
            polygonFill: '#fff',
            lineColor: '#000',
            lineWidth: 1
        };
    }
}
