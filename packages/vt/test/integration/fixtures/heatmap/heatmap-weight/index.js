const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0.5, 0.5] }, properties: { type: 1, weight: 0.9 } },
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0.6, 0.6] }, properties: { type: 1, weight: 0.5 } },
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0.5, 0.6] }, properties: { type: 1, weight: 0.4 } },
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0.6, 0.6] }, properties: { type: 1, weight: 0.1 } }
    ]
};

const style = [
    {
        filter: true,
        renderPlugin: {
            type: 'heatmap',
            dataConfig: {
                type: 'circle',
            }
        },
        symbol: {
            heatmapOpacity: 1,
            heatmapIntensity: 1,
            heatmapRadius: 8,
            heatmapWeight: {
                type: 'identity',
                property: 'weight'
            },
            heatmapColor: [
                [0, 'rgba(0,0,255,0)'],
                [0.4, 'blue'],
                [0.65, 'lime'],
                [1, 'red'],
            ]
        }
    }
];

module.exports = {
    style,
    data,
    features: true,
    renderingCount: 2,
    view: {
        center: [0, 0],
        zoom: 6
    }
};
