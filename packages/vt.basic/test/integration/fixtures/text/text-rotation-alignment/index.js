const data = require('../../data');

const style = [
    {
        renderPlugin: {
            type: 'text',
            dataConfig: {
                type: 'point'
            },
            sceneConfig: {
                collision: true,
                fading: false
            }
        },
        symbol: {
            textName: '未来',
            textRotationAlignment: 'map'
        }
    }
];

module.exports = {
    style,
    data: data.point,
    view: {
        center: [0, 0],
        zoom: 6,
        bearing: 90
    }
};
