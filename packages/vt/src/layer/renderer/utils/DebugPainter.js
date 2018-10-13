//TODO draw tile's xyz
class DebugPainter {
    constructor(regl, canvas, EXTENT, color) {
        this._regl = regl;
        this._canvas = canvas;
        this._data = regl.buffer(new Uint16Array([
            0, 0,
            0, EXTENT,
            EXTENT, EXTENT,
            EXTENT, 0,
        ]));
        this._color = color || [0, 1, 0];
        //LINE_LOOP
        this._init();
    }

    draw(transform) {
        this._command({
            transform
        });
    }

    remove() {
        this._data.destroy();
        //this._command.destroy();
    }

    _init() {
        const canvas = this._canvas;
        const viewport = {
            x : 0,
            y : 0,
            width : () => {
                return canvas ? canvas.width : 1;
            },
            height : () => {
                return canvas ? canvas.height : 1;
            }
        };
        const scissor = {
            enable: true,
            box: {
                x : 0,
                y : 0,
                width : () => {
                    return canvas ? canvas.width : 1;
                },
                height : () => {
                    return canvas ? canvas.height : 1;
                }
            }
        };
        this._command = this._regl({
            vert : `
                attribute vec2 aPosition;
                uniform mat4 transform;
                void main()
                {
                    gl_Position = transform * vec4(aPosition, 0.0, 1.0);
                }
            `,
            frag : `
                precision mediump float;
                uniform vec3 color;
                void main()
                {
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            attributes : {
                aPosition : this._data
            },
            uniforms : {
                transform : this._regl.prop('transform'),
                color : this._color
            },
            count : 4,
            primitive : 'line loop',
            depth : {
                enable : false,
                mask : false
            },
            stencil : {
                enable : false
            },
            viewport, scissor
        });
    }
}

export default DebugPainter;
