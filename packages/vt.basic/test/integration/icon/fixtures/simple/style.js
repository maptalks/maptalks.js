const path = require('path');

module.exports = [
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
                    //   markerPitchAlignment : 'map',
                    markerRotationAlignment: 'map'
                }
            }
        ]
    }
];

