const data = {
    type : 'FeatureCollection',
    features : [
        { type : 'Feature', geometry : { type : 'LineString', coordinates : [[-1, 0.0], [-0.4, 0.0], [0, -0.5]] }, properties : { type : 1 }},
        { type : 'Feature', geometry : { type : 'LineString', coordinates : [[-1, 0.0], [-0.4, 0.0], [0, -0.5]] }, properties : { type : 2 }}
    ]
};

const style = [
    {
        type: 'line',
        dataConfig: {
            type: 'line'
        },
        sceneConfig: {
        },
        style: [
            {
                filter : ['==', 'type', 1],
                symbol: {
                    lineWidth : 12
                }
            },
            {
                symbol: {
                    lineWidth : 12,
                    lineDx : 20,
                    lineDy : 30
                }
            }
        ]
    }
];

module.exports = {
    style,
    data : data
};
