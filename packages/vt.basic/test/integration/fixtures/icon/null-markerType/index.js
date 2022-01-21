const data = require('../../data');
// fuzhenn/maptalks-ide#2860

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
            "markerBloom": false,
            "markerAllowOverlap": false,
            "markerDx": 0,
            "markerDy": 0,
            "markerFile": null,
            "markerFill": [0.53, 0.77, 0.94, 1],
            "markerFillOpacity": 1,
            "markerHeight": 20,
            "markerWidth": 20,
            "markerHorizontalAlignment": "middle",
            "markerIgnorePlacement": false,
            "markerLineColor": [0.2, 0.29, 0.39, 1],
            "markerLineDasharray": [0, 0, 0, 0],
            "markerLineOpacity": 1,
            "markerLineWidth": 3,
            "markerOpacity": 1,
            "markerPitchAlignment": "viewport",
            "markerPlacement": "point",
            "markerRotationAlignment": "viewport",
            "markerSpacing": 0,
            "markerType": null,
            "markerVerticalAlignment": "middle",
            "visible": true
        }
    }
];

module.exports = {
    style,
    eventName: 'layerload',
    renderingCount: 1,
    data: data.point
};
