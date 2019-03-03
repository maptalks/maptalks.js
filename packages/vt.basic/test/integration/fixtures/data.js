// zoom     px      coordinate
//  6       128      1.2

module.exports = {
    'point': {
        type: 'FeatureCollection',
        features: [
            { type: 'Feature', geometry: { type: 'Point', coordinates: [0.5, 0.5] }, properties: { type: 1 } }
        ]
    },
    'line': {
        type: 'FeatureCollection',
        features: [
            { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-2, 0.5], [2, 0.5]] }, properties: { type: 1 } }
        ]
    }
};
