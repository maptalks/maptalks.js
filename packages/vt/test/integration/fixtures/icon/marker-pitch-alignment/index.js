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
            markerFile: 'file://' + path.resolve(__dirname, '../../../resources/1.png'),
            markerWidth: 29,
            markerHeight: 41,
            markerOpacity: 1,
            markerPitchAlignment: 'map'
        }
    }
];

module.exports = {
    style,
    data: data.point,
    view: {
        center: [0, 0],
        zoom: 6,
        pitch: 60
    }
};
