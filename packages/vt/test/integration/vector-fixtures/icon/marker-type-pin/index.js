const maptalks = require('maptalks');


const symbol = {
    "markerType": "pin",
    "markerFill": "rgb(60, 60, 60)",
    "markerFillOpacity": 0.8,
    "markerLineColor": "#fff",
    "markerLineWidth": 1,
    "markerWidth": 60,
    "markerHeight": 30
};

const marker = new maptalks.Marker([0, 0], {
    symbol
});
const centerMarker = new maptalks.Marker([0, 0], {
    symbol: {
        markerType: 'ellipse',
        markerFill: '#00f',
        markerVerticalAlignment: "middle",
        markerWidth: 5,
        markerHeight: 5
    }
});

module.exports = {
    data: [marker, centerMarker],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
