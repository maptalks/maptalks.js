const data = {
    type: 'FeatureCollection',
    features: [
        // { type : 'Feature', geometry : { type : 'Polygon', coordinates : [[[-1, 0.0], [-0.4, 0.0], [0, -0.5], [-1, 0]]] }, properties : { type : 3 }}
        {
            type: 'Feature', geometry: {
                type: 'Polygon', coordinates: [
                    [[-1., 1.0], [1., 1.0], [1., -1.0], [-1., -1], [-1., 1]],
                    [[-0.5, 0.5], [0.5, 0.5], [0.5, -0.5], [-0.5, -0.5], [-0.5, 0.5]]
                ]
            }, properties: { class: 3 }
        }
    ]
};

const style = [
    {
        renderPlugin: {
            type: 'fill',
            dataConfig: {
                type: 'fill'
            },
            sceneConfig: {
            }
        },
        symbol: {
            polygonFill: [
              "match",
              ["get", "class"],
              "snow",
              "hsl(35, 14%, 100%)",
              "hsl(81, 38%, 81%)"
            ],
            polygonOpacity: 1
        }
    }
];

module.exports = {
    style,
    data: data
};
