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
            markerWidth: 20
            // markerHeight: 28
        }
    }
];

module.exports = {
    style,
    data: data.point
};
