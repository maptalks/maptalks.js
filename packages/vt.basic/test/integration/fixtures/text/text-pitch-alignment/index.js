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
                    textName : '未来',
                    textPitchAlignment : 'map'
                }
            }
        ]
    }
];

module.exports = {
    style,
    data : data.point,
    view : {
        center : [0, 0],
        zoom : 6,
        pitch : 50
    }
};
