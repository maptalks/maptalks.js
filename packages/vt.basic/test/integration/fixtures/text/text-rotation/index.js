const data = require('../../data');

const style = [
    {
        type: 'text',
        dataConfig: {
            type: 'point'
        },
        sceneConfig: {
            collision: false
        },
        style: [
            {
                symbol: {
                    textName : '无为',
                    textRotation : 90
                }
            }
        ]
    }
];

module.exports = {
    style,
    data : data.point
};
