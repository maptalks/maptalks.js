const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0.5, 0.5] }, properties: { type: 1, height: 20000, name: 'foo', name_en: 'en' } }
    ]
};

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
            textName: '{name_cn|name_en|name} is {name}'
        }
    }
];

module.exports = {
    style,
    data
};
