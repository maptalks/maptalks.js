const maptalks = require('maptalks');

const marker = new maptalks.Marker([0, 0], {
    symbol: {
        markerType: "ellipse",
        markerFill: "#f00",
        markerWidth: 30,
        markerHeight: 30,
        markerOpacity: 1
    }
});

module.exports = {
    data: [marker],
    view: {
        center: [0, 0],
        zoom: 6
    },
    options: {
        enableBloom: true
    }
};
