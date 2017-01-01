import Browser from 'core/Browser';
import PointExtent from 'geo/PointExtent';
import CanvasTileLayer from 'layer/tile/CanvasTileLayer';
import Canvas2D from 'utils/Canvas';
import TileLayerCanvasRenderer from './TileLayerCanvasRenderer';

export default class CanvasTileLayerRenderer extends TileLayerCanvasRenderer {
    _loadTile(tileId, tile, onTileLoad, onTileError) {
        var tileSize = this.layer.getTileSize(),
            canvasClass = this.canvas.constructor,
            map = this.getMap();
        var r = Browser.retina ? 2 : 1;
        var tileCanvas = Canvas2D.createCanvas(tileSize['width'] * r, tileSize['height'] * r, canvasClass);

        tileCanvas[this.propertyOfTileId] = tileId;
        tileCanvas[this.propertyOfPointOnTile] = tile['viewPoint'];
        tileCanvas[this.propertyOfTileZoom] = tile['zoom'];
        this.layer.drawTile(tileCanvas, {
            'url': tile['url'],
            'viewPoint': tile['viewPoint'],
            'zoom': tile['zoom'],
            'extent': map._pointToExtent(new PointExtent(tile['2dPoint'], tile['2dPoint'].add(tileSize.toPoint())))
        }, function (error) {
            if (error) {
                onTileError.call(tileCanvas);
                return;
            }
            onTileLoad.call(tileCanvas);
        });
    }
}

CanvasTileLayer.registerRenderer('canvas', Canvas);
