const path = require('path');
const maptalks = require('maptalks');

const polygon0 = new maptalks.Polygon([
    [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]
], {
    properties: {
        type: 0
    }
});

const polygon1 = new maptalks.Polygon([
    [1, 1], [2, 1], [2, 2], [1, 2], [1, 1]
], {
    properties: {
        type: 1
    }
});

module.exports = {
    data: [polygon0, polygon1],
    view: {
        center: [1, 1],
        zoom: 6
    },
    options: {
        style: {
            $root: 'file://' + path.resolve(__dirname, '../../../resources'),
            style: [
                {
                    filter: ['==', 'type', 1],
                    symbol: {
                        polygonPatternFile: '{$root}/avatar.jpg',
                        polygonOpacity: 1
                    }
                },
                {
                    filter: ['==', 'type', 0],
                    symbol: {
                        polygonPatternFile: '{$root}/1.png',
                        polygonOpacity: 1
                    }
                },
            ]
        },
    }
};
