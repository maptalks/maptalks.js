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
            textName: 'A',
            // textSize : 24,
            textSpacing: 20,
            textPlacement: 'line'
        }
    }
];

module.exports = {
    style,
    data: data.line
};
