const data = require('../../data');

const style = [
    {
        renderPlugin: {
            type: 'text',
            dataConfig: {
                type: 'point',
                altitudeProperty: 'height',
                altitudeScale: 1,
                defaultAltitude: 0
            },
            sceneConfig: {
                collision: false
            }
        },
        symbol: {
            textName: '{height}'
        }
    }
];

module.exports = {
    style,
    data: data.point,
    view: {
        center: [0, 0],
        zoom: 7,
        pitch: 50
    }
};
