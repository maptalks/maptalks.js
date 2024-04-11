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
                property: '$type',
                default: 'none',
                stops: [
                    [1, 'both']
                ]
            },
            markerTextFitPadding: [0, 0, 20, 20],
            textName: 'hello',
            textFill: '#fff',
            textSize: {
                stops: [
                    [1, 10],
                    [10, 20]
                ]
            },
            textHaloRadius: {
                "property": "$type",
                "default": 0,
                "type": "categorical",
                "stops": [[1, 2]]
            },
            "textHaloFill": {
                "property": "$type",
                "default": "rgba(0,0,0,1)",
                "type": "categorical",
                "stops": [[1, "rgba(248,231,28,1)"]]
            },
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
