import Browser from 'core/Browser';
import CanvasTileLayer from 'layer/tile/CanvasTileLayer';
import Canvas2D from 'core/Canvas';
import TileLayerCanvasRenderer from './TileLayerCanvasRenderer';

export default class CanvasTileLayerRenderer extends TileLayerCanvasRenderer {
    _loadTile(tileId, tile, onTileLoad, onTileError) {
        var tileSize = this.layer.getTileSize(),
            canvasClass = this.canvas.constructor,
            map = this.getMap();
        var r = Browser.retina ? 2 : 1;
        var tileCanvas = Canvas2D.createCanvas(tileSize['width'] * r, tileSize['height'] * r, canvasClass);
        tileCanvas['layer'] = this.layer;
        tileCanvas[this.propertyOfTileId] = tileId;
        tileCanvas[this.propertyOfPointOnTile] = tile['point'];
        tileCanvas[this.propertyOfTileZoom] = tile['z'];
        this.layer.drawTile(tileCanvas, {
            'url': tile['url'],
            'point': tile['point'],
            'center' : map.pointToCoordinate(tile['point'].add(tileSize['width'] / 2, tileSize['height'] / 2)),
            'z': tile['z'],
            'x' : tile['x'],
            'y' : tile['y']
        }, function (error) {
            if (error) {
                onTileError.call(tileCanvas);
                return;
            }
            onTileLoad.call(tileCanvas);
        });
    }
}

CanvasTileLayer.registerRenderer('canvas', CanvasTileLayerRenderer);
