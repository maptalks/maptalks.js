import { createPainterPlugin } from '@maptalks/vt.base';
import WireframePainter from './WireframePainter';
import * as maptalks from '@maptalks/vt';

const WireframePlugin = createPainterPlugin('wireframe', WireframePainter);

WireframePlugin.registerAt(maptalks.VectorTileLayer);

export default WireframePlugin;
