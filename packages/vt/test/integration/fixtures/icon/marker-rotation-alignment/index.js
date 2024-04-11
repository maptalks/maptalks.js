const path = require('path');
const data = require('../../data');

const style = [
    {
        renderPlugin: {
            type: 'icon',
            dataConfig: {
                type: 'point'
            },
            sceneConfig: {
                collision: true,
                fading: false
            }
        },
        symbol: {
            markerFile: 'file://' + path.resolve(__dirname, '../../../resources/plane-min.png'),
            markerWidth: 30,
            markerHeight: 30,
            markerOpacity: 1,
            markerRotationAlignment: 'map'
        }
    }
];

module.exports = {
    style,
    data: data.point,
    view: {
        center: [0, 0],
        zoom: 6,
        bearing: 60
    }
};
