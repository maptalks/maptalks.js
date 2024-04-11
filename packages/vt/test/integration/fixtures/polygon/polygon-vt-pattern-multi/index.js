const path = require('path');

const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[-1, 0.0], [-0.4, 0.0], [0, -0.5], [-1, 0]]] }, properties: { type: 3 } },
        {
            type: 'Feature',
            geometry: {
                type: 'Polygon', coordinates: [
                    [[-1., 1.0], [1., 1.0], [1., -1.0], [-1., -1], [-1., 1]],
                    [[-0.5, 0.5], [0.5, 0.5], [0.5, -0.5], [-0.5, -0.5], [-0.5, 0.5]]
                ]
            }, properties: { type: 2 }
        }
    ]
};

const style = {
    $root: 'file://' + path.resolve(__dirname, '../../../resources'),
    style: [
        {
            renderPlugin: {
                type: 'fill',
                dataConfig: {
                    type: 'fill'
                },
                sceneConfig: {
                }
            },
            symbol: {
                polygonPatternFile: {
                    property: 'type',
                    type: 'categorical',
                    default: '{$root}/1.png',
                    stops: [
                        //geojson的默认layer是'0'
                        [2, '{$root}/avatar.jpg']
                    ]
                }
            }
        }
    ]
};

module.exports = {
    style,
    data: data
};
