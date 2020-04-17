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
            textName: '无为',
            textRotation: 60
        }
    }
];

module.exports = {
    style,
    data: data.point
};
