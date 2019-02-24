const style = [
    {
        type: 'text',
        dataConfig: {
            type: 'point'
        },
        sceneConfig: {
            collision: false
        },
        style: [
            {
                filter : ['==', 'type', 1],
                symbol: {
                    textName : '貔貅',
                    textSize : 30,
                    textHorizontalAlignment : 'right',
                    textVerticalAlignment : 'top'
                }
            },
            {
                symbol: {
                    textName : '貔貅',
                    textSize : 30
                }
            }
        ]
    }
];

module.exports = {
    style,
    data : {
        type : 'FeatureCollection',
        features : [
            { type : 'Feature', geometry : { type : 'Point', coordinates : [0.5, 0.5] }, properties : { type : 1 }},
            { type : 'Feature', geometry : { type : 'Point', coordinates : [0.5, 0.5] }, properties : { type : 2 }}
        ]
    }
};
