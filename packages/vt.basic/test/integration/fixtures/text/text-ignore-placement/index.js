const data = {
    type : 'FeatureCollection',
    features : [
        { type : 'Feature', geometry : { type : 'Point', coordinates : [0.5, 0.5] }, properties : { type : 1 }},
        { type : 'Feature', geometry : { type : 'Point', coordinates : [0.6, 0.6] }, properties : { type : 2 }}
    ]
};

const style = [
    {
        type: 'text',
        dataConfig: {
            type: 'point'
        },
        sceneConfig: {
            collision: true,
            fading : false
        },
        style: [
            {
                filter : ['==', 'type', 1],
                symbol: {
                    textName : '未来',
                    textSize : 30,
                    textIgnorePlacement : true
                }
            },
            {
                symbol: {
                    textName : '未来',
                    textSize : 30
                }
            }
        ]
    }
];

module.exports = {
    style,
    data : data
};
