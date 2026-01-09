const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [40, 40] }, properties: { boardColor: '#0f0', width: 12, height: 6, rotationZ: 60 } }
    ]
};


const style = [
    {
        'filter': true,
        'renderPlugin': {
            'dataConfig': {
                'type': 'native-point'
            },
            'sceneConfig': {},
            'type': 'billboard'
        },
        'symbol': {
            // context 是每个billboard的独立上下文对象
            // properties 是feature的属性对象
            'source': (context, properties) => {
                const boardColor = properties.boardColor;
                let { canvas, preBoardColor } = context;
                if (boardColor === preBoardColor) {
                    return {
                        redraw: false
                    };
                }
                if (!canvas) {
                    canvas = document.createElement('canvas');
                    // document.body.appendChild(canvas);
                    canvas.width = 256;
                    canvas.height = 128;
                    context.canvas = canvas;
                }
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = boardColor;
                ctx.fillRect(0, 0, 256, 128);
                context.preBoardColor = boardColor;
                return {
                    redraw: true,
                    data: canvas
                };

            },
            'width': {
                type: 'identity',
                property: 'width'
            },
            'height': {
                type: 'identity',
                property: 'height'
            },
            'rotationZ': {
                type: 'identity',
                property: 'rotationZ'
            }
        }
    }
];

module.exports = {
    style,
    data,
    containerWidth: 256,
    containerHeight: 256,
    view: {
        center: [40, 40],
        zoom: 20,
        pitch: 70
    }
};
