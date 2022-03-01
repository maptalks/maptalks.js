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
            markerHeight: 41,
            markerWidth: 29
        }
    }
];

module.exports = {
    style,
    styleScale: 2,
    data: data.point
};
