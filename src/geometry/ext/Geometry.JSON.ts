import { isNil } from '../../core/util';
import GeoJSON from '../GeoJSON';
import Geometry from './../Geometry';

Geometry.fromJSON = function (json: { [key: string]: any } | Array<{ [key: string]: any }>): Geometry | Array<Geometry> {
    if (Array.isArray(json)) {
        let result = [];
        for (let i = 0, len = json.length; i < len; i++) {

            const c = Geometry.fromJSON(json[i]);
            if (Array.isArray(json)) {
                result = result.concat(c);
            } else {
                result.push(c);
            }
        }
        return result;
    }

    if (json && !json['feature']) {
        return GeoJSON.toGeometry(json);
    }
    let geometry;
    if (json['subType']) {
        geometry = (Geometry.getJSONClass(json['subType']) as any).fromJSON(json);
        if (!isNil(json['feature']['id'])) {
            geometry.setId(json['feature']['id']);
        }
    } else {
        //feature可能是GeometryCollection，里面可能包含Circle等
        geometry = GeoJSON.toGeometry(json['feature']);
        if (json['options']) {
            geometry.config(json['options']);
        }
    }
    if (json['symbol']) {
        geometry.setSymbol(json['symbol']);
    }
    if (json['infoWindow']) {
        geometry.setInfoWindow(json['infoWindow']);
    }
    return geometry;
};