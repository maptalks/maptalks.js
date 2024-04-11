const style = [
    {
        filter: true,
        renderPlugin: {
            type: 'icon',
            dataConfig: {
                type: 'point'
            },
            sceneConfig: {
                collision: false
            }
        },
        symbol: {
            markerType: 'pie',
            markerFill: [1, 0, 0, 1],
            markerFillOpacity: 1,
            markerLineColor: [0, 1, 0, 1],
            markerLineWidth: 8,
            markerWidth: 40,
            markerHeight: 40,
            markerOpacity: 1
        }
    }
];

module.exports = {
    style,
    data: {
        type: 'FeatureCollection',
        features: [
            { type: 'Feature', geometry: { type: 'Point', coordinates: [0.5, 0.5] }, properties: { type: 1 } }
        ]
    },
    view: {
        center: [0, 0],
        zoom: 6
    }
};
