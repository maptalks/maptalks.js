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
            textName: 'aAg.%',
            textSize: 18
        }
    }
];

module.exports = {
    style,
    data: data.point
};
