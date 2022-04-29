import Point from '@mapbox/point-geometry';

const TYPES = {
    'Point': 1,
    'LineString': 2,
    'Polygon': 3,
    'MultiPoint': 4,
    'MultiLineString': 5,
    'MultiPolygon': 6
};

export default function convert(data, options = {}) {
    var features = [];
    if (data.type === 'FeatureCollection') {
        for (var i = 0; i < data.features.length; i++) {
            convertFeature(features, data.features[i], options, i);
        }

    } else if (data.type === 'Feature') {
        convertFeature(features, data, options);

    } else {
        // single geometry or a geometry collection
        convertFeature(features, { geometry: data }, options);
    }

    return features;
}

function convertFeature(features, geojson, options, index) {
    if (!geojson.geometry || !geojson.geometry.geometry) return;

    var coords = geojson.geometry.coordinates;
    var type = geojson.geometry.type;
    var geometry = [];
    var id = geojson.id;
    if (options.promoteId) {
        id = geojson.properties[options.promoteId];
    } else if (options.generateId) {
        id = index || 0;
    }
    if (type === 'Point') {
        convertPoint(coords, geometry);

    } else if (type === 'MultiPoint') {
        for (var i = 0; i < coords.length; i++) {
            convertPoint(coords[i], geometry);
        }

    } else if (type === 'LineString') {
        convertLines([coords], geometry, false);

    } else if (type === 'MultiLineString') {
        if (options.lineMetrics) {
            // explode into linestrings to be able to track metrics
            for (i = 0; i < coords.length; i++) {
                geometry = [];
                convertLine(coords[i], geometry, false);
                features.push(createFeature(id, 'LineString', geometry, geojson.properties));
            }
            return;
        } else {
            convertLines(coords, geometry, false);
        }

    } else if (type === 'Polygon') {
        convertLines(coords, geometry, true);

    } else if (type === 'MultiPolygon') {
        for (i = 0; i < coords.length; i++) {
            var polygon = [];
            convertLines(coords[i], polygon, true);
            geometry.push(polygon);
        }
    } else if (type === 'GeometryCollection') {
        for (i = 0; i < geojson.geometry.geometries.length; i++) {
            convertFeature(features, {
                id: id,
                geometry: geojson.geometry.geometries[i],
                properties: geojson.properties
            }, options, index);
        }
        return;
    } else {
        console.warn(`Input data type(${type}) is not a valid GeoJSON geometry type.`);
        return;
    }

    features.push(createFeature(id, type, geometry, geojson.properties));
}

export function convertPoint(coords, out) {
    const point = new Point(coords[0], coords[1]);
    // meter to centimeter
    point.z = (coords[2] || 0) * 100;
    out.push([point]);
}

export function convertLine(ring, out) {
    // var x0, y0;
    // var size = 0;

    for (let j = 0; j < ring.length; j++) {
        const x = ring[j][0];
        const y = ring[j][1];

        // out.push(x);
        // out.push(y);
        // out.push(0);
        const point = new Point(x, y);
        // meter to centimeter
        point.z = (ring[j][2] || 0) * 100;
        out.push(point);

        // if (j > 0) {
        //     if (isPolygon) {
        //         size += (x0 * y - x * y0) / 2; // area
        //     } else {
        //         size += Math.sqrt(Math.pow(x - x0, 2) + Math.pow(y - y0, 2)); // length
        //     }
        // }
        // x0 = x;
        // y0 = y;
    }

    // var last = out.length - 3;
    // out[2] = 1;
    // out[last + 2] = 1;

    // out.size = Math.abs(size);
    // out.start = 0;
    // out.end = out.size;
}

export function convertLines(rings, out, tolerance, isPolygon) {
    for (var i = 0; i < rings.length; i++) {
        var geom = [];
        convertLine(rings[i], geom, tolerance, isPolygon);
        out.push(geom);
    }
}
function createFeature(id, type, geom, tags) {
    var feature = {
        id: typeof id === 'undefined' ? null : id,
        type: TYPES[type],
        geometry: geom,
        properties: tags
    };
    return feature;
}


