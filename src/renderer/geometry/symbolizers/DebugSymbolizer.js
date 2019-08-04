import {
    isNil
} from '../../../core/util';
import Point from '../../../geo/Point';
import Canvas from '../../../core/Canvas';
import PointSymbolizer from './PointSymbolizer';
import VectorMarkerSymbolizer from './VectorMarkerSymbolizer';

export default class DebugSymbolizer extends PointSymbolizer {

    getPlacement() {
        return 'point';
    }

    getDxDy() {
        return new Point(0, 0);
    }

    symbolize(ctx) {
        const geometry = this.geometry,
            layer = geometry.getLayer();
        if (!geometry.options['debug'] && (layer && !layer.options['debug'])) {
            return;
        }
        const map = this.getMap();
        if (!map || map.isZooming()) {
            return;
        }
        const color = layer.options['debugOutline'],
            op = 1;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;

        //outline
        const outline = this.getPainter().getContainerExtent().toArray();
        Canvas.polygon(ctx, [outline], op, 0);

        //center cross and id if have any.
        const points = this._getRenderContainerPoints(),
            id = this.geometry.getId(),
            cross = VectorMarkerSymbolizer._getVectorPoints('cross', 10, 10);
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            if (!isNil(id)) {
                Canvas.fillText(ctx, id, p.add(8, -4), color);
            }
            const c = [];
            for (let ii = 0; ii < cross.length; ii++) {
                c.push(cross[ii].add(p));
            }
            Canvas.path(ctx, c.slice(0, 2), op);
            Canvas.path(ctx, c.slice(2, 4), op);
        }
    }

}
