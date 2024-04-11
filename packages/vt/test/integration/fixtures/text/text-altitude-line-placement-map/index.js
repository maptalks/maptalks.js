const data = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [1, 1, 0],
                    [40, 40, 800000]
                ]
            }
        }
    ]
};

const style = [
    {
        filter: true,
        renderPlugin: {
            type: 'line',
            dataConfig: {
                type: 'line'
            },
            sceneConfig: {
                // excludes : ['!has', 'levels']
            }
        },
        symbol: {
            lineOpacity: 1,
            lineWidth: 8,
            lineColor: '#f00'
        }
    },
    {
        filter: true,
        renderPlugin: {
            type: 'text',
            dataConfig: {
                type: 'point'
            },
            sceneConfig: {
                collision: true,
                fading: false
            }
        },
        symbol: {
            textName: 'a大秦帝国',
            textSize: 18,
            textFill: '#000',
            textPitchAlignment: 'map',
            textPlacement: 'line'
        }
    }
];

module.exports = {
    style,
    data,
    view: {
        center: [2, 2],
        zoom: 5,
        bearing: 0,
        pitch: 80
    }
};
