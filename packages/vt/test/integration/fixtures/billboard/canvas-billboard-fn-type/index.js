const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [40, 40] }, properties: { text: 'hello', width: 12, height: 6, rotationZ: 60 } }
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
                const text = properties.text;
                let { canvas, preText } = context;
                if (text === preText) {
                    return {
                        redraw: false
                    };
                }
                if (!canvas) {
                    canvas = document.createElement('canvas');
                    document.body.appendChild(canvas);
                    canvas.width = 256;
                    canvas.height = 128;
                }
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#f00';
                ctx.fillRect(0, 0, 256, 128);
                ctx.fillStyle = '#fff';
                ctx.font = '64px Arial';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'hanging';
                ctx.fillText(text, 80, 64);
                context.preText = text;
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
