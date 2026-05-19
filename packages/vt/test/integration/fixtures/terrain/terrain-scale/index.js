// 该用例用来测试 zoom 超过terrain的maxAvailableZoom后， terrainlayer能正常剪切生成 heightTexture，供 lit shader 渲染法线阴影
const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Polygon', coordinates: [
            [[91.14478,29.696272], [91.14778,29.696272], [91.14778,29.690272], [91.14478,29.690272], [91.14478,29.696272]]]
        }, properties: { type: 1 } }
    ]

};

const style = [
    {
        filter: true,
        renderPlugin: {
            type: 'fill',
            dataConfig: {
                type: 'fill'
            }
        },
        symbol: {
            polygonFill: '#f00',
            polygonOpacity: 0.5
        }
    }
];

module.exports = {
    style,
    data,
    renderingCount: 10,
    view: {
        center: [91.14478,29.708272],
        zoom: 14,
        pitch: 20,
        bearing: 0,
    },
    lit: true
};
