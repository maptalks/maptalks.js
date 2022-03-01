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
            markerWidth: 128,
            markerHeight: 128,
            markerLineWidth: 0,
            markerTextFit: {
                property: 'type',
                default: 'none',
                stops: [
                    [1, 'both']
                ]
            },
            markerTextFitPadding: [5, 5, 5, 5],
            textName: '{label}',
            textFill: '#fff',
            textSize: {
                stops: [
                    [1, 10],
                    [10, 20]
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
            { type: 'Feature', geometry: { type: 'Point', coordinates: [0.5, 0.5] }, properties: { label: '1' } },
            { type: 'Feature', geometry: { type: 'Point', coordinates: [0.5, 0.5] }, properties: { label: '' } }
        ]
    },
    view: {
        center: [0, 0],
        zoom: 6
    }
};
