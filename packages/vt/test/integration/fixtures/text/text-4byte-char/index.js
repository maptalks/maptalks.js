// https://github.com/maptalks/issues/issues/621

const style = [
    {
        filter: true,
        renderPlugin: {
            type: "text",
            dataConfig: {
                type: "point"
            }
        },
        symbol: {
            textName: "𡰥江"
        }
    }
];

module.exports = {
    style,
    data: {
        type: 'FeatureCollection',
        features: [
            { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] } }
        ]
    }
};
