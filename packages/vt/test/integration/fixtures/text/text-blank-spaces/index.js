// https://github.com/maptalks/issues/issues/462
const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0.5, 0.5] }, properties: { name: '  ' } },
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0.6, 0.6] }, properties: { name: 'myname' } }
    ]
};

const style = [
    {
        filter: true,
        renderPlugin: {
            type: 'text',
            dataConfig: {
                type: 'point'
            },
            sceneConfig: {
                collision: false,
                fading: false
            }
        },
        symbol: {
            textName: '{name}',
            textSize: 30
        }
    }
];

module.exports = {
    style,
    data: data
};
