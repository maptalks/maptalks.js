const data = {
    type: 'FeatureCollection',
    features: [
        // { type : 'Feature', geometry : { type : 'Polygon', coordinates : [[[-1, 0.0], [-0.4, 0.0], [0, -0.5], [-1, 0]]] }, properties : { type : 3 }}
        {
            type: 'Feature', geometry: {
                type: 'Polygon', coordinates: [
                    [[-1., 1.0], [1., 1.0], [1., -1.0], [-1., -1], [-1., 1]]
                ]
            }, properties: { type: 3 }
        }
    ]
};

const style =
{
    background: {
        enable: true,
        color: [0, 1, 0, 1],
        opacity: 0.5
    },
    style: [
        {
            filter: true,
            renderPlugin: {
                type: 'icon',
                dataConfig: {
                    type: 'point'
                },
                sceneConfig: {
                    collision: false,
                    fading: false,
                    renderToPointRenderTarget: false
                }
            },
            symbol: {
                markerType: 'ellipse',
                markerHeight: 20,
                markerWidth: 20
            }
        },
        {
            filter: true,
            renderPlugin: {
                type: 'fill',
                dataConfig: {
                    type: 'fill'
                },
                sceneConfig: {
                }
            },
            symbol: {
                polygonFill: '#f00'
            }
        }

    ]
};

module.exports = {
    style,
    data: data,
    groupSceneConfig: {
        postProcess: {
            enable: true,
            antialias: {
                enable: true
            }
        }
    }
};
