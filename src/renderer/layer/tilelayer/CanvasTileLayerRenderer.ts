import CanvasTileLayer from '../../../layer/tile/CanvasTileLayer';
import Canvas2D from '../../../core/Canvas';
import TileLayerCanvasRenderer from './TileLayerCanvasRenderer';
import TileLayerGLRenderer from './TileLayerGLRenderer';
import Extent from '../../../geo/Extent';
import Point from '../../../geo/Point';

function loadTile(tile: any) {
    const tileSize = this.layer.getTileSize();
    const canvasClass = this.canvas.constructor;
    const map = this.getMap();
    const r = map.getDevicePixelRatio();
    const tileCanvas = Canvas2D.createCanvas(tileSize['width'] * r, tileSize['height'] * r, canvasClass);
    tileCanvas['layer'] = this.layer;
    const point = new Point(tile['extent2d'].xmin, tile['extent2d'].ymax);
    const extent = new Extent(map.pointToCoordinate(point), map.pointToCoordinate(point.add(tileSize.width, tileSize.height)), map.getProjection());
    this.layer.drawTile(tileCanvas, {
        'url': tile['url'],
        'point': point,
        'center' : map.pointToCoordinate(point.add(tileSize['width'] / 2, tileSize['height'] / 2)),
        'extent' : extent,
        'z': tile['z'],
        'x' : tile['x'],
        'y' : tile['y']
    }, (error: any) => {
        if (error) {
            this.onTileError(tileCanvas, tile);
            return;
        }
        this.onTileLoad(tileCanvas, tile);
    });
    return tileCanvas;
}

class CanvasRenderer extends TileLayerCanvasRenderer {
    loadTile(...args: any[]) {
        return loadTile.apply(this, args);
    }
}

class GLRenderer extends TileLayerGLRenderer {
    loadTile(...args: any[]) {
        return loadTile.apply(this, args);
    }
}

CanvasTileLayer.registerRenderer<typeof CanvasRenderer>('canvas', CanvasRenderer);
CanvasTileLayer.registerRenderer<typeof GLRenderer>('gl', GLRenderer);

export {
    CanvasRenderer as CanvasTileLayerCanvasRenderer,
    GLRenderer as CanvasTileLayerGLRenderer
};
