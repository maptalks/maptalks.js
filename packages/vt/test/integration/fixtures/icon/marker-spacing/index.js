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
                collision: false
            }
        },
        symbol: {
            markerFile: 'file://' + path.resolve(__dirname, '../../../resources/plane-min.png'),
            markerWidth: 30,
            markerHeight: 30,
            markerOpacity: 1,
            markerSpacing: 40,
            markerPlacement: 'line'
        }
    }
];

module.exports = {
    style,
    data: data.line,
    view: {
        center: [0, 0],
        zoom: 6
    }
};
