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
            markerTextFitPadding: [0, 0, 20, 20],
            textName: 'hello',
            textFill: '#fff',
            textFaceName: '微软雅黑',
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
            { type: 'Feature', geometry: { type: 'Point', coordinates: [0.5, 0.5] }, properties: { type: 1 } },
            { type: 'Feature', geometry: { type: 'Point', coordinates: [0.5, 0.5] }, properties: { type: 2 } }
        ]
    },
    view: {
        center: [0, 0],
        zoom: 6
    }
};
