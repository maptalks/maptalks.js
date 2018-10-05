import * as maptalks from '@maptalks/vt';
import { createPainterPlugin } from '@maptalks/vt-plugin';
import FillPainter from './painters/FillPainter';
import LinePainter from './painters/LinePainter';

const FillPlugin = createPainterPlugin('fill', FillPainter);
FillPlugin.registerAt(maptalks.VectorTileLayer);

const LinePlugin = createPainterPlugin('line', LinePainter);
LinePlugin.registerAt(maptalks.VectorTileLayer);

export {
    LinePlugin,
    FillPlugin,
    // LinePlugin
};
