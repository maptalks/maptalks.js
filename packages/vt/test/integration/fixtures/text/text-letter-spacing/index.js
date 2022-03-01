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
            textLetterSpacing: 50
        }
    }
];

module.exports = {
    style,
    data: data.point
};
