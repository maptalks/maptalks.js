//TODO draw tile's xyz
class DebugPainter {
    constructor(regl, canvas, color) {
        this._regl = regl;
        this._canvas = canvas;
        this._color = color || [0, 1, 0];
        //LINE_LOOP
        this._init();
    }

    draw(transform, extent) {
        if (!this._data) {
            this._data = this._regl.buffer(new Uint16Array([
                0, 0,
                0, extent,
                0, extent,
                extent, extent,
                extent, extent,
                extent, 0,
                extent, 0,
                0, 0
            ]));
        }
        this._command({
            transform,
            data : this._data
        });
    }

    remove() {
        if (this._data) {
            this._data.destroy();
        }
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
                aPosition : this._regl.prop('data')
            },
            uniforms : {
                transform : this._regl.prop('transform'),
                color : this._color
            },
            count : 8,
            primitive : 'lines',
            depth : {
                enable : false,
                mask : false
            },
            stencil : {
                enable : false
            },
            viewport
        });
    }
}

export default DebugPainter;
