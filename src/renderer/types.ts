export type TileRenderingCanvas = {
    gl?: TileRenderingContext;
    texture?: TileImageTexture;
    _parentTileTimestamp?: number;
} & HTMLCanvasElement;

export type TileRenderingContext = {
    program: TileRenderingProgram,
    wrap: () => TileRenderingContext
} & (WebGLRenderingContext | WebGL2RenderingContext);

export type TileRenderingProgram = {
    fragmentShader: string,
    vertexShader: string
} & WebGLProgram;

export type ImageType = HTMLImageElement | ImageBitmap | HTMLCanvasElement;

export type TileImageType = {
    glBuffer?: TileImageBuffer,
    texture?: TileImageTexture
} & ImageType;

export type TileImageBuffer = {
    width?: number,
    height?: number,
    type?: string
} & WebGLBuffer;

export type TileImageTexture = WebGLTexture;

export type VertexAttrib = [name: string, stride: number, type?: string];
