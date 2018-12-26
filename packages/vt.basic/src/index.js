import * as maptalks from '@maptalks/vt';
import { createPainterPlugin } from '@maptalks/vt-plugin';
import FillPainter from './painters/FillPainter';
import LinePainter from './painters/LinePainter';
import LineGlowPainter from './painters/LineGlowPainter';
import IconPainter from './painters/IconPainter';
import TextPainter from './painters/TextPainter';

const FillPlugin = createPainterPlugin('fill', FillPainter);
FillPlugin.registerAt(maptalks.VectorTileLayer);

const LinePlugin = createPainterPlugin('line', LinePainter);
LinePlugin.registerAt(maptalks.VectorTileLayer);

const IconPlugin = createPainterPlugin('icon', IconPainter);
IconPlugin.registerAt(maptalks.VectorTileLayer);

const TextPlugin = createPainterPlugin('text', TextPainter);
TextPlugin.registerAt(maptalks.VectorTileLayer);

const LineGlowPlugin = createPainterPlugin('line-glow', LineGlowPainter);
LineGlowPlugin.registerAt(maptalks.VectorTileLayer);

export {
    LinePlugin,
    FillPlugin,
    IconPlugin,
    TextPlugin,
    LineGlowPlugin
};
