const path = require('path');
const data = require('../../data');

const style = {
    $root: 'file://' + path.resolve(__dirname, '../../../resources/'),
    style: [
        {
            renderPlugin: {
                type: 'icon',
                dataConfig: {
                    type: 'point'
                },
                sceneConfig: {
                    collision: false
                }
            },
            symbol: {
                markerFile: {
                    property: 'type',
                    type: 'categorical',
                    stops: [
                        [1, '{$root}/plane-min.png'],
                        [2, '{$root}/plane-min.png'],
                    ]
                },
                markerWidth: 15,
                markerHeight: 15
            }
        }
    ]
};

module.exports = {
    style,
    data: data.point
};
