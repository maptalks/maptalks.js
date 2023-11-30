const path = require('path');

const data = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            geometry: {
                type: 'Polygon', coordinates: [
                    [[-1., 1.0], [1., 1.0], [1., -1.0], [-1., -1], [-1., 1]]
                ]
            }, properties: { type: 3, width: 8000, origin: [1, 0] }
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
                polygonPatternFile: '{$root}/avatar.jpg',
                polygonPatternFileWidth: {
                    type: 'identity',
                    property: 'width'
                },
                polygonPatternFileOrigin: {
                    type: 'identity',
                    property: 'origin'
                },
            }
        }
    ]
};

module.exports = {
    style,
    data: data,
    view: {
        center: [0.5, 0],
        zoom: 9.6
    }

};
