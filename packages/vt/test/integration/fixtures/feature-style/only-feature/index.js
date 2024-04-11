const data = require('../country.js');

const featureStyle = [
    {
        'id': 16,
        'style': [
            {
                'renderPlugin': {
                    'dataConfig': {
                        'type': 'fill'
                    },
                    'sceneConfig': {},
                    'type': 'fill'
                },
                'symbol': {
                    'bloom': false,
                    'polygonFill': [
                        0.3568627450980392,
                        0.4196078431372549,
                        0.42745098039215684,
                        1
                    ],
                    'polygonOpacity': 0.5,
                    'polygonPatternFile': null,
                    'visible': true
                },
                'filter': true,
                'studio': {
                    'mode': '2d-polygon',
                    'title': '中华人民共和国'
                }
            },
            {
                'renderPlugin': {
                    'dataConfig': {
                        'type': 'line'
                    },
                    'sceneConfig': {},
                    'type': 'line'
                },
                'symbol': {
                    'bloom': false,
                    'lineCap': 'butt',
                    'lineColor': [
                        0.9764705882352941,
                        0.03137254901960784,
                        0.03137254901960784,
                        1
                    ],
                    'lineDasharray': [
                        0,
                        0,
                        0,
                        0
                    ],
                    'lineDashColor': [
                        1,
                        1,
                        1,
                        0
                    ],
                    'lineDx': 0,
                    'lineDy': 0,
                    'lineStrokeWidth': 0,
                    'lineJoin': 'miter',
                    'lineOpacity': 1,
                    'linePatternAnimSpeed': 0,
                    'linePatternFile': null,
                    'lineWidth': 3,
                    'visible': true
                },
                'filter': true,
                'studio': {
                    'mode': '2d-polygon',
                    'title': '中华人民共和国'
                }
            }
        ]
    }
];

module.exports = {
    style: {
        featureStyle
    },
    data: data,
    view: {
        center: {
            x: 111.69338809069029,
            y: 30.81976022571419
        },
        zoom: 4
    }
};
