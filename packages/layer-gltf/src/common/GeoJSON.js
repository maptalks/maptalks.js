import { Util, Geometry } from 'maptalks';
import GLTFMarker from '../GLTFMarker';
import EffectMarker from '../EffectMarker';

export const GEOJSON_TYPES = [
    // geometries
    'Point',
    'Polygon',
    'LineString',
    'MultiPoint',
    'MultiPolygon',
    'MultiLineString',
    'GeometryCollection',
    'Feature',
    'FeatureCollection']
    .reduce((memo, t) => {
        memo[t] = true;
        return memo;
    }, {});

export const GeoJSON = {
    toGeometry: function (geoJSON, layerType) {
        if (Util.isString(geoJSON)) {
            geoJSON = Util.parseJSON(geoJSON);
        }
        if (Array.isArray(geoJSON)) {
            const resultGeos = [];
            for (let i = 0, len = geoJSON.length; i < len; i++) {
                const geo = GeoJSON._convert(geoJSON[i], layerType);
                if (Array.isArray(geo)) {
                    Util.pushIn(resultGeos, geo);
                } else {
                    resultGeos.push(geo);
                }
            }
            return resultGeos;
        } else {
            const resultGeo = GeoJSON._convert(geoJSON, layerType);
            return resultGeo;
        }
    },

    _convert: function (json, layerType) {
        if (!json || Util.isNil(json['type'])) {
            return null;
        }
        const type = json['type'];
        if (type === 'Feature') {
            const g = json['geometry'];
            const geometry = GeoJSON._convert(g, layerType);
            if (!geometry) {
                return null;
            }
            geometry.setId(json['id']);
            geometry.setProperties(json['properties']);
            return geometry;
        } else if (type === 'FeatureCollection') {
            const features = json['features'];
            if (!features) {
                return null;
            }
            const result = GeoJSON.toGeometry(features, layerType);
            return result;
        } else if (type === 'Point') {
            return createMarker(json['coordinates'], layerType);
        } else if (type === 'GeometryCollection') {
            const geometries = json['geometries'];
            const mGeos = [];
            const len = geometries.length;
            for (let i = 0; i < len; i++) {
                mGeos.push(GeoJSON._convert(geometries[i], layerType));
            }
            return mGeos;
        } else {
            throw new Error('geometry\'s type is invalid, only support type of Point');
        }
    },

    isGeoJSON : function (geoJSON) {
        if (!geoJSON || typeof geoJSON !== 'object') return false;
        if (!geoJSON.type) return false;
        if (!GEOJSON_TYPES[geoJSON.type]) return false;
        if (geoJSON instanceof Geometry) return false;
        return true;
    }
};

function createMarker(coordinates, type) {
    if (type === 'EffectLayer') {
        return new EffectMarker(coordinates);
    }
    return new GLTFMarker(coordinates);
}
