const path = require('path');
const data = require('../../data');

const style = [
    {
        type: 'icon',
        dataConfig: {
            type: 'point'
        },
        sceneConfig: {
            collision: false
        },
        style: [
            {
                symbol: {
                    markerFile: 'file://' + path.resolve(__dirname, '../../../resources/plane-min.png'),
                    markerWidth: 30,
                    markerHeight: 30,
                    markerOpacity: 1,
                    markerDx : 40,
                    markerDy : -50
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
        zoom : 6
    }
};
