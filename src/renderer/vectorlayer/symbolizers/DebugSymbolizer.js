import {
    isNil
} from 'core/util';
import Point from 'geo/Point';
import Canvas from 'utils/Canvas';
import PointSymbolizer from './PointSymbolizer';
import VectorMarkerSymbolizer from './VectorMarkerSymbolizer';

const styles = {
    'lineColor': '#000',
    'lineOpacity': 1,
    'lineWidth': 1
};

export default class DebugSymbolizer extends PointSymbolizer {

    constructor(symbol, geometry, painter) {
        super();
        this.symbol = symbol;
        this.geometry = geometry;
        this.painter = painter;
    }

    getPlacement() {
        return 'point';
    }

    getDxDy() {
        return new Point(0, 0);
    }

    symbolize(ctx) {
        var geometry = this.geometry,
            layer = geometry.getLayer();
        if (!geometry.options['debug'] && (layer && !layer.options['debug'])) {
            return;
        }
        var map = this.getMap();
        if (!map || map._zooming) {
            return;
        }
        Canvas.prepareCanvas(ctx, styles);
        var op = styles['lineOpacity'];

        //outline
        var pixelExtent = this.getPainter().getContainerExtent();
        var nw = pixelExtent.getMin(),
            size = pixelExtent.getSize();
        Canvas.rectangle(ctx, nw, size, op, 0);

        //center cross and id if have any.
        var points = this._getRenderContainerPoints();

        var id = this.geometry.getId();
        var cross = VectorMarkerSymbolizer._getVectorPoints('cross', 10, 10);
        for (var i = 0; i < points.length; i++) {
            var p = points[i];
            if (!isNil(id)) {
                Canvas.fillText(ctx, id, p.add(8, -4), 'rgba(0,0,0,1)');
            }
            var c = [];
            for (var ii = 0; ii < cross.length; ii++) {
                c.push(cross[ii].add(p));
            }
            Canvas.path(ctx, c.slice(0, 2), op);
            Canvas.path(ctx, c.slice(2, 4), op);
        }
    }

}
