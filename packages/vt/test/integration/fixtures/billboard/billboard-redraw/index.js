const data = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [40, 40] }, properties: { boardColor: '#0f0' } }
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
                const boardColor = properties.boardColor;
                let { canvas, preBoardColor } = context;
                const now = performance.now();
                if (!updated && ((now - time) >= limit)) {
                    preBoardColor = null;
                    needRefresh = true;
                }
                if (boardColor === preBoardColor) {
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
                ctx.fillStyle = boardColor;
                ctx.fillRect(0, 0, 256, 128);
                context.preBoardColor = boardColor;
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
