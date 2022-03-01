const maptalks = require('maptalks');

const marker = new maptalks.Marker([0, 0], {
    symbol: {
        markerType: "ellipse",
        markerFill: "rgb(216,115,149)",
        markerFillOpacity: {
          property: "heat",
          type: "identity",
        },
        markerLineWidth: 0,
        markerLineOpacity: 1,
        markerWidth: {
          property: "width",
          type: "identity",
        },
        markerHeight: 40,
    },
    properties: {
        width: 40,
        heat: 0.3,
    }
});

module.exports = {
    data: [marker],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
