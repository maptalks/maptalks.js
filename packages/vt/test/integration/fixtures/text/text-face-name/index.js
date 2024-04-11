const style = [
    {
        renderPlugin: {
            type: 'text',
            dataConfig: {
                type: 'point'
            },
            sceneConfig: {
                collision: false
            }
        },
        symbol: {
            textName: '{name}',
            textFaceName: {
                "property": "$type",
                "default": "'Times New Roman',Times,serif",
                "type": "categorical",
                "stops": [
                  [1, "Arial,Helvetica,sans-serif"],
                ]
              },
        }
    }
];

module.exports = {
    style,
    data: {
        type: 'FeatureCollection',
        features: [
            { type: 'Feature', geometry: { type: 'Point', coordinates: [0.5, 0.5] }, properties: { name: 'Hello' } }
        ]
    }
};
