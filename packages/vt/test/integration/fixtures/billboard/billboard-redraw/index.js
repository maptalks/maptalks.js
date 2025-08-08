const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [40, 40] }, properties: { text: 'hello' } }
    ]
};

let time = performance.now();
let needRefresh = false;
let updated = false;
const limit = 1000;

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
                const now = performance.now();
                if (!updated && ((now - time) >= limit)) {
                    preText = null;
                    needRefresh = true;
                }
                if (text === preText) {
                    return {
                        redraw: false
                    };
                }
                const color = needRefresh ? '#f00' : '#0f0';
                if (!canvas) {
                    canvas = document.createElement('canvas');
                    document.body.appendChild(canvas);
                    canvas.width = 256;
                    canvas.height = 128;
                }
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = color;
                ctx.fillRect(0, 0, 256, 128);
                ctx.fillStyle = '#fff';
                ctx.font = '64px Arial';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'hanging';
                ctx.fillText(text, 80, 64);
                context.preText = text;
                context.canvas = canvas;
                if (needRefresh) {
                    updated = true;
                }

                return {
                    redraw: true,
                    data: canvas
                };

            },
            'width': 12,
            'height': 6,
            'rotationZ': 60
        }
    }
];

module.exports = {
    style,
    data,
    timeout: 1200,
    containerWidth: 256,
    containerHeight: 256,
    view: {
        center: [40, 40],
        zoom: 20,
        pitch: 70
    }
};
