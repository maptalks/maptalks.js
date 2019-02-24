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
                symbol: {
                    textName : '貔貅',
                    textSize : 30,
                    textHaloRadius : 1,
                    textHaloFill : '#f00',
                    textHaloOpacity : 0.4
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
            { type : 'Feature', geometry : { type : 'Point', coordinates : [0.5, 0.5] }}
        ]
    }
};
