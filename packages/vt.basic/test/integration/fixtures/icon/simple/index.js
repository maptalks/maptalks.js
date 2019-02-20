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
                    markerFile: 'file://' + path.resolve(__dirname, '../../../resources/plane-min.png')
                }
            }
        ]
    }
];

module.exports = {
    style,
    data : data.point
};
