const path = require('path');
const maptalks = require('maptalks');

const polygon0 = new maptalks.Polygon([
    [[-1., 1.0], [1., 1.0], [1., -1.0], [-1., -1], [-1., 1]]
], {
    properties: {
        type: 0
    }
});

module.exports = {
    data: [polygon0],
    view: {
        center: [0, 0],
        zoom: 9.6
    },
    options: {
        style: {
            $root: 'file://' + path.resolve(__dirname, '../../../resources'),
            style: [
                {
                    filter: ['==', 'type', 0],
                    symbol: {
                        polygonPatternFile: '{$root}/avatar.jpg',
                        polygonPatternFileWidth: 8000,
                        polygonPatternFileOrigin: [0, 0],
                        polygonOpacity: 1
                    }
                }
            ]
        },
    }
};
