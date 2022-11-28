const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-1, 0.0], [-0.4, 0.0], [0, -0.5]] }, properties: { type: 3 } }
    ]
};

const style = [
    {
        renderPlugin: {
            type: 'line',
            dataConfig: {
                type: 'line'
            },
            sceneConfig: {
                maxZoom: 5
            }
        },
        symbol: {
            lineColor: '#000',
            lineWidth: 12,
            lineBlur: 5
        }
    }
];

module.exports = {
    style,
    data: data,
    view: {
        center: [0, 0],
        zoom: 6
    }
};
