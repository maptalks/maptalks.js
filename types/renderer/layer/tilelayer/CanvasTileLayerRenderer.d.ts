import TileLayerCanvasRenderer from './TileLayerCanvasRenderer';
import TileLayerGLRenderer from './TileLayerGLRenderer';
declare class CanvasRenderer extends TileLayerCanvasRenderer {
    loadTile(): any;
}
declare class GLRenderer extends TileLayerGLRenderer {
    loadTile(): any;
}
export { CanvasRenderer as CanvasTileLayerCanvasRenderer, GLRenderer as CanvasTileLayerGLRenderer };
