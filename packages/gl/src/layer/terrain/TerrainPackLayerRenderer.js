import * as maptalks from 'maptalks';
import { createREGL } from '@maptalks/regl';


class TerrainPackLayerRenderer extends maptalks.renderer.TileLayerGLRenderer {

    onDrawTileStart() {

    }

    onDrawTileEnd() {

    }

    drawTile(tileInfo, tileImage, parentContext) {
        const map = this.getMap();
        if (!tileInfo || !map || !tileImage) {
            return;
        }
        const { neighborImages, complete } = this._terrainHelper.getNeighborTiles(tileInfo);
        if (complete) {
            this._
        }

    }

    _bindGLBuffer(image, w, h) {
        if (!image.glBuffer) {
            image.glBuffer = this.bufferTileData(0, 0, w, h);
        }
    }

    loadTileImage(tileImage, url) {
        //image must set cors in webgl
        const crossOrigin = this.layer.options['crossOrigin'];
        tileImage.crossOrigin = crossOrigin !== null ? crossOrigin : '';
        tileImage.src = url;
        return;
    }

    // prepare gl, create program, create buffers and fill unchanged data: image samplers, texture coordinates
    onCanvasCreate() {
        //not in a GroupGLLayer
        if (!this.canvas.gl || !this.canvas.gl.wrap) {
            this.createCanvas2();
        }
    }

    createContext() {
        const inGroup = this.canvas.gl && this.canvas.gl.wrap;
        if (inGroup) {
            this.gl = this.canvas.gl.wrap();
            this.regl = this.canvas.gl.regl;
        } else {
            this._createREGLContext();
        }
    }

    _createREGLContext() {
        const layer = this.layer;

        const attributes = layer.options.glOptions || {
            alpha: true,
            depth: true,
            antialias: this.layer.options['antialias']
            // premultipliedAlpha : false
        };
        attributes.preserveDrawingBuffer = true;
        attributes.stencil = true;
        this.glOptions = attributes;
        this.gl = this.gl || this._createGLContext(this.canvas, attributes);
        // console.log(this.gl.getParameter(this.gl.MAX_VERTEX_UNIFORM_VECTORS));
        this.regl = createREGL({
            gl: this.gl,
            attributes,
            extensions: [
                'OES_element_index_uint'
            ],
            optionalExtensions: layer.options['glExtensions'] ||
                [
                    'OES_vertex_array_object'
                ]
        });
    }

    _createGLContext(canvas, options) {
        const names = ['webgl', 'experimental-webgl'];
        let context = null;
        /* eslint-disable no-empty */
        for (let i = 0; i < names.length; ++i) {
            try {
                context = canvas.getContext(names[i], options);
            } catch (e) { }
            if (context) {
                break;
            }
        }
        return context;
        /* eslint-enable no-empty */
    }

    resizeCanvas(canvasSize) {
        if (!this.canvas) {
            return;
        }
        super.resizeCanvas(canvasSize);
        this.resizeGLCanvas();
    }

    clearCanvas() {
        if (!this.canvas) {
            return;
        }
        super.clearCanvas();
        this.clearGLCanvas();
    }

    getCanvasImage() {
        if (!this._gl() || !this.canvas2) {
            return super.getCanvasImage();
        }
        const img = super.getCanvasImage();
        if (img) {
            img.image = this.canvas2;
        }
        return img;
    }

    // decide whether the layer is renderer with gl.
    // when map is pitching, or fragmentShader is set in options
    _gl() {
        if (this.canvas.gl && this.canvas.gl.wrap) {
            //in GroupGLLayer
            return true;
        }
        const map = this.getMap();
        return map && (map.getPitch() || map.getBearing()) || this.layer && !!this.layer.options['fragmentShader'];
    }

    deleteTile(tile) {
        super.deleteTile(tile);
        if (tile && tile.image) {
            this.disposeImage(tile.image);
        }
        delete tile.image;
    }

    onRemove() {
        super.onRemove();
        this.removeGLCanvas();
    }
}

TerrainPackLayer.registerRenderer('gl', TerrainPackLayerRenderer);
