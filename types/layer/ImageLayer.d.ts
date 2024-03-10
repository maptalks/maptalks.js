import CanvasRenderer from '../renderer/layer/CanvasRenderer';
import Layer, { LayerOptionsType } from './Layer';
export type ImageLayerOptionsType = LayerOptionsType & {
    renderer?: string;
    crossOrigin?: string;
};
/**
 * @classdesc
 * A layer used to display images, you can specify each image's geographic extent and opacity
 * @category layer
 * @extends Layer
 * @param {String|Number} id - tile layer's id
 * @param {Object[]} [images=null] - images
 * @param {Object} [options=null] - options defined in [ImageLayer]{@link ImageLayer#options}
 * @example
 * new ImageLayer("images", [{
        url : 'http://example.com/foo.png',
        extent: [xmin, ymin, xmax, ymax],
        opacity : 1
    }])
 */
declare class ImageLayer extends Layer {
    _images: Array<any>;
    _imageData: Array<any>;
    constructor(id: any, images?: Array<any>, options?: ImageLayerOptionsType);
    onAdd(): void;
    /**
     * Set images and redraw
     * @param {Object[]} images - new images
     * @return {ImageLayer} this
     */
    setImages(images: any): this;
    /**
     * Get images
     * @return {Object[]}
     */
    getImages(): any[];
    _prepareImages(images: any): void;
}
export declare class ImageLayerCanvasRenderer extends CanvasRenderer {
    _imageLoaded: boolean;
    isDrawable(): boolean;
    checkResources(): any;
    retireImage(image: any): void;
    refreshImages(): void;
    draw(): void;
    _drawImages(): void;
    _drawImage(image: any, extent: any, opacity: any): void;
    drawOnInteracting(): void;
}
declare const ImageLayerGLRenderer_base: {
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
} & typeof ImageLayerCanvasRenderer;
export declare class ImageLayerGLRenderer extends ImageLayerGLRenderer_base {
    isDrawable(): boolean;
    _drawImage(image: any, extent: any, opacity: any): void;
    createContext(): void;
    resizeCanvas(canvasSize: any): void;
    clearCanvas(): void;
    retireImage(image: any): void;
    onRemove(): void;
}
export default ImageLayer;
