const data = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [
                    [
                        [-1., 1.0],
                        [1., 1.0],
                        [1., -1.0],
                        [-1., -1],
                        [-1., 1]
                    ]
                ]
            },
            properties: {
                name: 'Hello'
            }
        }
    ]
};
const style = [
    {
        'renderPlugin': {
            'type': 'icon',
            'dataConfig': {
                'type': 'point',
                'only2D': true
            },
            'sceneConfig': {
                collision: false,
                blendSrc: 'one'
            }
        },
        'symbol': {
            'markerBloom': 1,
            'textBloom': 1,
            'visible': true,
            'markerType': 'square',
            'markerFill': '#0ff',
            'markerWidth': 27,
            'markerHeight': 26,
            'markerOpacity': 1,
            'markerPlacement': 'point',
            'markerHorizontalAlignment': 'middle',
            'markerVerticalAlignment': 'middle',
            'markerPitchAlignment': 'viewport',
            'markerRotationAlignment': 'viewport',
            'markerAllowOverlap': false,
            'markerIgnorePlacement': false,
            'markerDx': 0,
            'markerDy': 0,
            'markerTextFit': 'none',
            'markerTextFitPadding': [
                0,
                0,
                0,
                0,
            ],
            'textName': 'hello',
            'textSize': 16,
            'textFill': '#f00'
        },
    }
];
module.exports = {
    style,
    data: data,
    view: {
        pitch: 70,
        bearing: 60,
        center: [0, 0],
        zoom: 6.5
    },
    sceneConfig: {
        postProcess: {
            enable: true,
            bloom: {
                enable: true
            }
        }
    }
};
