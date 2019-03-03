const data = require('../../data');

const style = [
    {
        renderPlugin: {
            type: 'text',
            dataConfig: {
                type: 'point'
            },
            sceneConfig: {
                collision: false
            }
        },
        symbol: {
            textName: '无为',
            textRotation: 90
        }
    }
];

module.exports = {
    style,
    data: data.point
};
