import { createPainterPlugin } from '@maptalks/vt-plugin';
import WireframePainter from './WireframePainter';
import * as maptalks from '@maptalks/vt';

const WireframePlugin = createPainterPlugin('wireframe', WireframePainter);

WireframePlugin.registerAt(maptalks.VectorTileLayer);

export default WireframePlugin;
