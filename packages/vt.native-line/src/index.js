import * as maptalks from '@maptalks/vt';
import { createPainterPlugin } from '@maptalks/vt-plugin';
import NativeLinePainter from './NativeLinePainter';
import TrailLinePainter from './TrailLinePainter';

const NativeLinePlugin = createPainterPlugin('native-line', NativeLinePainter);

NativeLinePlugin.registerAt(maptalks.VectorTileLayer);

const TrailLinePlugin = createPainterPlugin('native-trail-line', TrailLinePainter);

TrailLinePlugin.registerAt(maptalks.VectorTileLayer);

export { NativeLinePlugin, TrailLinePlugin };
