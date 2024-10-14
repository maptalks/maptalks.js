const nameKey = "中文,剪紙の継承者, 정저우, 루쉰 박물관 구경하는 관람객,الصين";

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
            textName: `{${nameKey}}`,
            textSize: 12
        }
    }
];

const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0.5, 0.5] }, properties: { name: 'data 0' } },
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0.5, 0.3] }, properties: { name: 'data 1' } }
    ]
}
data.features.forEach(feature => {
    feature.properties[nameKey] = feature.properties.name;
});

module.exports = {
    style,
    // eventName: 'layerload',
    // renderingCount: 12,
    data
};
