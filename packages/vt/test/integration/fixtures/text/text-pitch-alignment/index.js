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
                fading: false,
                //2020-03-04 增加excludes设为false时的测试
                excludes: false
            }
        },
        symbol: {
            textName: '未来',
            textPitchAlignment: 'map'
        }
    }
];

module.exports = {
    style,
    data: data.point,
    view: {
        center: [0, 0],
        zoom: 6,
        pitch: 50,
        bearing: 30
    }
};
