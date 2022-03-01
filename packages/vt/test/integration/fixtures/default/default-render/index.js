const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0.5, 0.5] }, properties: { type: 1 } },
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0.6, 0.6] }, properties: { type: 2 } }
    ]
};

const style = null;

module.exports = {
    style,
    data,
    view: {
        center: [0, 0],
        zoom: 6
    }
};
