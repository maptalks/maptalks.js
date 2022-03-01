const style = [
    {
        renderPlugin: {
            type: 'text',
            dataConfig: {
                type: 'point'
            },
            sceneConfig: {
                collision: false
            }
        },
        symbol: {
            textFaceName: {
                property: 'type',
                type: 'categorical',
                default: 'monospace',
                stops: [
                    [2, 'sans-serif']
                ]
            },
            textWeight: {
                property: 'type',
                type: 'categorical',
                default: 'normal',
                stops: [
                    [2, 'bold']
                ]
            },
            textStyle: {
                property: 'type',
                type: 'categorical',
                default: 'normal',
                stops: [
                    [2, 'italic']
                ]
            },
            textName: '貔貅',
            textFill: {
                property: 'type',
                type: 'categorical',
                default: '#000',
                stops: [
                    [2, '#f00']
                ]
            },
            textSize: {
                property: 'type',
                type: 'categorical',
                default: 30,
                stops: [
                    [2, 50]
                ]
            },
            textHaloRadius: {
                property: 'type',
                type: 'categorical',
                default: 0,
                stops: [
                    [2, 1]
                ]
            },
            textHaloFill: {
                property: 'type',
                type: 'categorical',
                default: '#fff',
                stops: [
                    [2, '#000']
                ]
            },
            textDx: {
                property: 'type',
                type: 'categorical',
                default: 0,
                stops: [
                    [2, 10]
                ]
            },
            textDy: {
                property: 'type',
                type: 'categorical',
                default: 0,
                stops: [
                    [2, 50]
                ]
            },
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
    }
};
