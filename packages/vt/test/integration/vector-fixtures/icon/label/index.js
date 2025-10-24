const maptalks = require('maptalks');

const options = {
    "id": "label1",
    "boxStyle": {
        "padding": [
            15,
            6
        ],
        "verticalAlignment": "top",
        "horizontalAlignment": "left",
        "minWidth": 150,
        "minHeight": 30,
        "symbol": {
            "markerType": "square",
            "markerFill": "rgb(60, 60, 60)",
            "markerFillOpacity": 0.8,
            "markerLineColor": "#fff",
            "markerLineWidth": 1,
            // "textDx": -110
        }
    },
    "textSymbol": {
        "textFill": "#fff",
        "textSize": 16,
        "textVerticalAlignment": "center"
    }
};

const marker = new maptalks.Label('' ,[0, 0], options);
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
