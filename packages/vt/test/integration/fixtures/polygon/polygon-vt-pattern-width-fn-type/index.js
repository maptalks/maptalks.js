const path = require('path');

const data = {
    type: 'FeatureCollection',
    features: [
        // { type : 'Feature', geometry : { type : 'Polygon', coordinates : [[[-1, 0.0], [-0.4, 0.0], [0, -0.5], [-1, 0]]] }, properties : { type : 3 }}
        {
            type: 'Feature',
            geometry: {
                type: 'Polygon', coordinates: [
                    [[-1., 1.0], [1., 1.0], [1., -1.0], [-1., -1], [-1., 1]],
                    [[-0.5, 0.5], [0.5, 0.5], [0.5, -0.5], [-0.5, -0.5], [-0.5, 0.5]]
                ]
            }, properties: { type: 3, width: 100 }
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
                // polygonPatternFile: '{$root}/1.png',
                polygonPatternFile: '{$root}/avatar.jpg',
                polygonPatternFileWidth: {
                    type: 'identity',
                    property: 'width'
                },
                // polygonPatternFileWidth: 100,
                polygonPatternFileOrigin: [1, 0]
            }
        }
    ]
};

module.exports = {
    style,
    data: data,
    view: {
        center: [0.61090629, -0.54981564],
        zoom: 9.6
    }

};
