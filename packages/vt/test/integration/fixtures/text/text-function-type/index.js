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
            textName: '未来',
            textSize: 40,
            textFill: {
                type: 'interval',
                stops: [[1, '#f00'], [14, '#000']]
            }
        }
    }
];

module.exports = {
    style,
    data: data.point
};
