const data = require('../../data');

const style = [
    {
        renderPlugin: {
            type: 'icon',
            dataConfig: {
                type: 'point'
            },
            sceneConfig: {
                collision: true,
                fading: false
            }
        },
        symbol: {
            markerFile: null,
            markerHeight: 41,
            markerWidth: 29
        }
    }
];

module.exports = {
    style,
    eventName: 'layerload',
    renderingCount: 1,
    data: data.point
};
