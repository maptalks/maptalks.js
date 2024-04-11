const path = require('path');

const data = {
    type: 'FeatureCollection',
    features: [
        // { type : 'Feature', geometry : { type : 'Polygon', coordinates : [[[-1, 0.0], [-0.4, 0.0], [0, -0.5], [-1, 0]]] }, properties : { type : 3 }}
        {
            type: 'Feature',
            geometry: {
                type: 'Polygon', coordinates: [
                    [[-1., 51.0], [1., 51.0], [1., 49.0], [-1., 49], [-1., 51]]
                ]
            }, properties: { type: 3 }
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
                polygonPatternFile: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IArs4c6QAAAEhJREFUKFN1zsEJADAIA8C4W4ZzKHdrUWoRWwU/csQIgIUzJOFrZrE+UoEfOnpAR0JyZVy+qkhUNcCEIqEXq0nR4dc+0S05oQ0xTTUxw39W/AAAAABJRU5ErkJggg=='
            }
        }
    ]
};

module.exports = {
    style,
    data: data,
    view: {
        center: [0.2, 50],
        zoom: 20
    }
};
