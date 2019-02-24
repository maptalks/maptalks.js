const data = {
    type : 'FeatureCollection',
    features : [
        { type : 'Feature', geometry : { type : 'LineString', coordinates : [[-1, 0.0], [-0.4, 0.0], [0, -0.5]] }, properties : { type : 3 }}
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
                symbol: {
                    lineWidth : 12,
                    lineOpacity : 0.6
                }
            }
        ]
    }
];

module.exports = {
    style,
    data : data
};
