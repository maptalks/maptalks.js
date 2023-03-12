const maptalks = require('maptalks');

const polygon = new maptalks.Polygon([
    [[121.85667440111013,31.1288787049632,0],[121.85772382672712,31.1288787049632,0],[121.85772382672712,31.1288787049632,300],[121.85667440111013,31.1288787049632,300],[121.85667440111013,31.1288787049632,0]]
], {
    symbol: {
        polygonFill: '#f00',
        polygonOpacity: 1
    }
});

module.exports = {
    data: [polygon],
    view: {
        center: [121.85667440111013, 31.1288787049632],
        zoom: 14,
        pitch: 80
    }
};
