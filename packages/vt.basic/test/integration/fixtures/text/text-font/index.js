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
                    textName : 'Aa',
                    textFaceName : 'Arial',
                    textWeight : 'bold',
                    textStyle : 'italic',
                    textSize : 40,
                    textFill : '#f00',
                    textOpacity : 0.5
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
