//https://github.com/maptalks/issues/issues/822
const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[91.14278,29.658272, 4000], [91.14678, 29.658272, 4000]] }, properties: { type: 1 } }
    ]
};

const style = [
    {
        filter: true,
        renderPlugin: {
            type: 'line',
            dataConfig: {
                type: 'line'
            }
        },
        symbol: {
            lineWidth: 6,
            lineColor: '#f00',
            lineOpacity: 0.5
        }
    }
];

module.exports = {
    style,
    data,
    awareOfTerrain: false
};
