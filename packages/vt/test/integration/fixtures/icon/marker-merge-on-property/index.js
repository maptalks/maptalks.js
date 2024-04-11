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
            markerType: 'square',
            markerWidth: 20,
            markerHeight: 20,
            markerLineWidth: 0,
            markerTextFit: 'both',
            markerPlacement: 'line',
            markerSpacing: 70,
            markerTextFitPadding: [0, 0, 0, 0],
            mergeOnProperty: {
                type: 'categorical',
                property: 'key',
                default: null,
                stops: [
                    [1, 'name'],
                    [2, 'type']
                ]
            },
            textName: '{key}',
            textFill: '#fff',
            textSize: 16
        }
    }
];

module.exports = {
    style,
    data: {
        type: 'FeatureCollection',
        features: [
            { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-4, -0.6], [-3, -0.6]] }, properties: { key: 1, name: 1 } },
            { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-3, -0.6], [0, -0.6]] }, properties: { key: 1, name: 1 } },
            { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, -0.6], [2, -0.6]] }, properties: { key: 1, name: 1 } },

            { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-4, -0], [-3, -0]] }, properties: { key: 0 } },
            { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-3, -0], [0, -0]] }, properties: { key: 0 } },
            { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, -0], [2, -0]] }, properties: { key: 0 } },

            { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-4, 0.6], [-3, 0.6]] }, properties: { type: 2, key: 2 } },
            { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-3, 0.6], [0, 0.6]] }, properties: { type: 2, key: 2 } },
            { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0.6], [2, 0.6]] }, properties: { type: 2, key: 2 } },
        ]
    },
    view: {
        center: [0, 0],
        zoom: 6
    }
};
