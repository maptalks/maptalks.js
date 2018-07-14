import Browser from '../../../core/Browser';
import CanvasTileLayer from '../../../layer/tile/CanvasTileLayer';
import Canvas2D from '../../../core/Canvas';
import TileLayerCanvasRenderer from './TileLayerCanvasRenderer';
import TileLayerGLRenderer from './TileLayerGLRenderer';
import Extent from '../../../geo/Extent';

function loadTile(tile) {
    const tileSize = this.layer.getTileSize(),
        canvasClass = this.canvas.constructor,
        map = this.getMap();
    const r = Browser.retina ? 2 : 1;
    const tileCanvas = Canvas2D.createCanvas(tileSize['width'] * r, tileSize['height'] * r, canvasClass);
    tileCanvas['layer'] = this.layer;
    const me = this;
    const extent = new Extent(map.pointToCoordinate(tile['point']), map.pointToCoordinate(tile['point'].add(tileSize.toPoint())), map.getProjection());
    this.layer.drawTile(tileCanvas, {
        'url': tile['url'],
        'point': tile['point'],
        'center' : map.pointToCoordinate(tile['point'].add(tileSize['width'] / 2, tileSize['height'] / 2)),
        'extent' : extent,
        'z': tile['z'],
        'x' : tile['x'],
        'y' : tile['y']
    }, error => {
        if (error) {
            me.onTileError(tileCanvas, tile);
            return;
        }
        me.onTileLoad(tileCanvas, tile);
    });
    return tileCanvas;
}

class CanvasRenderer extends TileLayerCanvasRenderer {
    loadTile() {
        return loadTile.apply(this, arguments);
    }
}

class GLRenderer extends TileLayerGLRenderer {
    loadTile() {
        return loadTile.apply(this, arguments);
    }
}

CanvasTileLayer.registerRenderer('canvas', CanvasRenderer);
CanvasTileLayer.registerRenderer('gl', GLRenderer);

export {
    CanvasRenderer as CanvasTileLayerCanvasRenderer,
    GLRenderer as CanvasTileLayerGLRenderer
};
