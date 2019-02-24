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
                    textName : '未来'
                }
            }
        ]
    }
];

module.exports = {
    style,
    data : data.point
};
