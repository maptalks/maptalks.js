const textWidth = 512, textHeight = 64;

class DebugPainter {
    constructor(regl, map, color) {
        this._regl = regl;
        this._map = map;
        this._color = color || [0, 1, 0];
    }

    draw(debugInfo, transform, tileSize, extent, fbo) {
        if (!this._command) {
            this._init();
        }

        if (!this._data) {
            this._data = this._regl.buffer(getDebugData(extent));
            const scale = extent / tileSize;
            this._textData = this._regl.buffer(getTextData(extent, scale));
        }
        if (extent !== this._extent) {
            const scale = extent / tileSize;
            this._data(getDebugData(extent));
            this._textData(getTextData(extent, scale));
        }
        this._extent = extent;
        let image = this._debugInfoCanvas;
        if (!image) {
            const dpr = this._map.getDevicePixelRatio() > 1 ? 2 : 1;
            image = this._debugInfoCanvas = document.createElement('canvas');
            image.width = textWidth * dpr;
            image.height = textHeight * dpr;
            const ctx = image.getContext('2d');
            ctx.font = '36px monospace';
            ctx.scale(dpr, dpr);
            this._texture = this._regl.texture({
                width: image.width,
                height: image.height,
                data: image
            });
        }
        const ctx = image.getContext('2d');
        ctx.clearRect(0, 0, image.width, image.height);
        ctx.fillStyle = `rgba(${this._color.map(c => c * 255).join()})`;
        ctx.fillText(debugInfo, 20, 36);
        this._texture({
            width: image.width,
            height: image.height,
            data: image
        });
        this._command({
            transform,
            data: this._data,
            texData: this._texCoordData,
            debugLine: 1,
            primitive: 'lines',
            framebuffer: fbo || null,
            image: this._texture,
            count: 8
        });

        this._command({
            transform,
            data: this._textData,
            texData: this._texCoordData,
            debugLine: 0,
            primitive: 'triangle strip',
            framebuffer: fbo || null,
            image: this._texture,
            count: 4
        });
    }

    delete() {
        if (this._texture) {
            this._texture.destroy();
            delete this._texture;
        }
        if (this._texCoordData) {
            this._texCoordData.destroy();
            delete this._texCoordData;
        }
        if (this._data) {
            this._data.destroy();
            this._textData.destroy();
            delete this._data;
            delete this._textData;
        }
        if (this._command) {
            this._command.destroy();
            delete this._command;
        }
    }

    _init() {
        this._texCoordData = this._regl.buffer(new Uint8Array([
            0.0, 0.0,
            0.0, 1.0,
            1.0, 0.0,
            1.0, 1.0,
            //添加额外的一组数据，防止drawArrays out of index错误
            0.0, 0.0,
            0.0, 1.0,
            1.0, 0.0,
            1.0, 1.0
        ]));
        this._command = this._regl({
            vert: `
                attribute vec2 aPosition;
                attribute vec2 aTexCoord;
                uniform mat4 transform;

                varying vec2 vTexCoord;
                void main()
                {
                    gl_Position = transform * vec4(aPosition, 0.0, 1.0);
                    vTexCoord = aTexCoord;
                }
            `,
            frag: `
                precision mediump float;
                uniform sampler2D uImage;
                uniform vec3 uColor;
                uniform float uOpacity;
                uniform float uDebugLine;

                varying vec2 vTexCoord;

                void main()
                {
                    if (uDebugLine == 1.) {
                        gl_FragColor = vec4(uColor, 1.0) * uOpacity;
                    } else {
                        gl_FragColor = texture2D(uImage, vTexCoord) * uOpacity;
                    }
                    gl_FragColor *= gl_FragColor.a;
                }
            `,
            attributes: {
                aPosition: this._regl.prop('data'),
                aTexCoord: this._regl.prop('texData')
            },
            uniforms: {
                transform: this._regl.prop('transform'),
                uColor: this._color,
                uOpacity: 1,
                uDebugLine: this._regl.prop('debugLine'),
                uImage: this._regl.prop('image'),
            },
            count: this._regl.prop('count'),
            primitive: this._regl.prop('primitive'),
            depth: {
                enable: false,
                mask: false
            },
            blend: {
                enable: true,
                func: {
                    src: 'one',
                    dst: 'one minus src alpha'
                },
                equation: 'add'
            },
            viewport: {
                x: 0,
                y: 0,
                width: () => {
                    return this._map.getRenderer().canvas.width;
                },
                height: () => {
                    return this._map.getRenderer().canvas.height;
                }
            },
            framebuffer: this._regl.prop('framebuffer')
        });
    }
}

export default DebugPainter;

function getDebugData(extent) {
    return new Uint16Array([
        0, 0,
        0, extent,
        0, extent,
        extent, extent,
        extent, extent,
        extent, 0,
        extent, 0,
        0, 0
    ]);
}

function getTextData(extent, scale) {
    return new Uint16Array([
        0, extent - textHeight * scale,
        0, extent,
        textWidth * scale, extent - textHeight * scale,
        textWidth * scale, extent
    ]);
}
