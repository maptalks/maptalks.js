const maptalks = require('maptalks');

const marker = new maptalks.Marker([0, 0], {
    symbol: {
        markerType: "path",
        markerPath: "M8 23l0 0 0 0 0 0 0 0 0 0c-4,-5 -8,-10 -8,-14 0,-5 4,-9 8,-9l0 0 0 0c4,0 8,4 8,9 0,4 -4,9 -8,14z M3,9 a5,5 0,1,0,0,-0.9Z",
        markerFill: "rgb(216,115,149)",
        markerLineColor: "#fff",
        markerPathWidth: 16,
        markerPathHeight: 23,
        markerWidth: 30,
        markerHeight: 42,
        markerRotation: 60
    }
});

module.exports = {
    data: [marker],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
