const maptalks = require('maptalks');

const marker = new maptalks.Marker([0, 0], {
    symbol: {
        markerType: 'ellipse',
        markerFill: '#f00',
        markerFillOpacity: 0.5,
        markerWidth: 30,
        markerHeight: 30,
        markerOpacity: 1
    }
});

const invalidMarker = new maptalks.Marker([-1.8E108, -1.8E108], {
    symbol: {
        markerType: 'ellipse',
        markerFill: '#0f0',
        markerFillOpacity: 0.5,
        markerWidth: 30,
        markerHeight: 30,
        markerOpacity: 1
    }
});

module.exports = {
    data: [marker, invalidMarker],
    view: {
        center: [0, 0],
        zoom: 6
    }
};
