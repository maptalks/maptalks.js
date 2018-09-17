import { createPainterPlugin } from '@maptalks/vt-plugin';
import PBRPainter from './PBRPainter';
import * as maptalks from '@maptalks/vt';

const PBRPlugin = createPainterPlugin('pbr', PBRPainter);

PBRPlugin.registerAt(maptalks.VectorTileLayer);

export default PBRPlugin;
