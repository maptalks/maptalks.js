const maptalks = require('maptalks');

// maptalks/issues#430

const data = [];
for(let i=0;i<2;i++) {
    const marker = new maptalks.Marker([-0.5, i * 1, 0], {
        symbol: {
            markerType: "square",
            markerFill: 'rgba(255,255,0,1)',
            markerLineColor: 'blue',
            markerLineWidth: 0,
            markerHorizontalAlignment: "middle",
            markerVerticalAlignment: "middle",
            markerTextFit: "both",
            markerTextFitPadding: [0, 0, 0, 0],
            textVerticalAlignment: "middle",
            textHorizontalAlignment: "middle",
            // textName: '测试',
            textName: i % 2 === 0 ? '测试' : '',
            textSize: 20,
            textFill: 'blue',
            textWrapWidth: 9999,
        }
    });
    data.push(marker);
}


const marker = new maptalks.Marker([0, 0], {
    symbol: {
        markerType: 'triangle',
        markerWidth: 20,
        markerHeight: 40,
        markerLineWidth: 0
    },
    properties: {
        name: 'test'
    }
});

data.push(marker);

module.exports = {
    data,
    view: {
        center: [0, 0],
        zoom: 6
    }
};
