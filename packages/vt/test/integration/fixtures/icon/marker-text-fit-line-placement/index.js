const style = [
    {
        filter: true,
        renderPlugin: {
            type: 'icon',
            dataConfig: {
                type: 'point'
            },
            sceneConfig: {
                collision: true
            }
        },
        symbol: {
            markerType: 'square',
            markerWidth: 20,
            markerHeight: 20,
            markerLineWidth: 0,
            markerTextFit: 'both',
            markerPlacement: 'line',
            markerSpacing: 30,
            markerTextFitPadding: [0, 0, 0, 0],
            textName: 'h',
            textFill: '#fff',
            textSize: {
                type: 'categorical',
                property: 'type',
                default: 0,
                stops: [
                    [1, 16],
                    [3, 14]
                ]
            }
        }
    }
];

module.exports = {
    style,
    data: {
        type: 'FeatureCollection',
        features: [
            { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-4, 0], [2, 0]] }, properties: { type: 2 } },
            { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-4, -0.1], [2, -0.1]] }, properties: { type: 1 } },
            { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-4, 0.1], [2, 0.1]] }, properties: { type: 3 } },
        ]
    },
    view: {
        center: [0, 0],
        zoom: 9
    }
};
