import TileLayerCanvasRenderer from './TileLayerCanvasRenderer';
import Point from '../../../geo/Point';
import Layer from '../../../layer/Layer'
declare const TileLayerGLRenderer_base: {
    new (...args: any[]): {
        gl: any;
        program: any;
        canvas: any;
        layer: any;
        canvas2: any;
        _textures: any[];
        _imageBuffers: any[];
        _debugBuffer: any;
        _buffers: any;
        _debugInfoCanvas: any;
        drawGLImage(image: any, x: any, y: any, w: any, h: any, scale: any, opacity: any, debug?: any, baseColor?: any): void;
        drawDebug(uMatrix: any, x: any, y: any, w: any, h: any, debugInfo: any): void;
        bufferTileData(x: any, y: any, w: any, h: any, buffer?: any): any;
        drawTinImage(image: any, vertices: any, texCoords: any, indices: any, opacity: any): void;
        createCanvas2(): void;
        createGLContext(): void;
        resizeGLCanvas(): void;
        clearGLCanvas(): void;
        disposeImage(image: any): void;
        _createTexture(image: any): any;
        getTexture(): any;
        saveTexture(texture: any): void;
        loadTexture(image: any): any;
        getImageBuffer(): any;
        saveImageBuffer(buffer: any): void;
        loadImageBuffer(data: any, glBuffer: any): any;
        createImageBuffer(): any;
        removeGLCanvas(): void;
        createBuffer(): any;
        enableVertexAttrib(attributes: any): void;
        createProgram(vert: any, frag: any): any;
        useProgram(program: any): any;
        enableSampler(sampler: any, texIdx: any): any;
        _initUniforms(program: any, uniforms: any): void;
        _getUniform(program: any, uniformName: any): any;
    };
} & typeof TileLayerCanvasRenderer;
/**
 * @classdesc
 * Renderer class based on HTML5 WebGL for TileLayers
 * @class
 * @protected
 * @memberOf renderer
 * @extends {renderer.TileLayerCanvasRenderer}
 * @param {TileLayer} layer - TileLayer to render
 */
declare class TileLayerGLRenderer extends TileLayerGLRenderer_base {
    isDrawable(): boolean;
    needToRedraw(): boolean;
    onDrawTileStart(context: any, parentContext: any): void;
    onDrawTileEnd(context: any, parentContext: any): void;
    drawTile(tileInfo: any, tileImage: any, parentContext: any): void;
    _bindGLBuffer(image: any, w: any, h: any): void;
    loadTileImage(tileImage: any, url: any): void;
    onCanvasCreate(): void;
    createContext(): void;
    resizeCanvas(canvasSize: any): void;
    clearCanvas(): void;
    getCanvasImage(): {
        image: any;
        layer: Layer;
        point: Point;
    };
    _gl(): number | boolean;
    deleteTile(tile: any): void;
    onRemove(): void;
}
export default TileLayerGLRenderer;
