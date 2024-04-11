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
            markerType: {
                type: 'categorical',
                property: 'type',
                default: 'ellipse',
                stops: [
                    [2, 'square']
                ]
            },
            markerFill: {
                type: 'categorical',
                property: 'type',
                default: '#00f',
                stops: [
                    [2, [1, 0, 0, 1]]
                ]
            },
            markerFillOpacity: {
                type: 'categorical',
                property: 'type',
                default: 1,
                stops: [
                    [2, 0.5]
                ]
            },
            markerLineColor: {
                type: 'categorical',
                property: 'type',
                default: '#ff0',
                stops: [
                    [2, [1, 1, 1]]
                ]
            },
            markerLineWidth: {
                type: 'categorical',
                property: 'type',
                default: 3,
                stops: [
                    [2, 6]
                ]
            },
            markerLineDasharray: {
                type: 'categorical',
                property: 'type',
                default: null,
                stops: [
                    [2, [5, 5]]
                ]
            },
            markerLineOpacity: {
                type: 'categorical',
                property: 'type',
                default: 0.8,
                stops: [
                    [2, 1]
                ]
            },
            markerWidth: {
                type: 'categorical',
                property: 'type',
                default: 30,
                stops: [
                    [2, { stops: [[7, 40], [20, 100]] }]
                ]
            },
            markerHeight: {
                type: 'categorical',
                property: 'type',
                default: 30,
                stops: [
                    [2, 40]
                ]
            },
            markerOpacity: 1,
            markerDx: {
                type: 'categorical',
                property: 'type',
                default: 0,
                stops: [
                    [2, 20]
                ]
            },
            markerDy: {
                type: 'categorical',
                property: 'type',
                default: 0,
                stops: [
                    [2, -30]
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
