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
            textName: '未来'
        }
    }
];

module.exports = {
    style,
    styleScale: 2,
    data: data.point
};
