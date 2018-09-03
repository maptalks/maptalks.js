import { createPainterPlugin } from '@maptalks/vt.base';
import PBRScenePainter from './PBRScenePainter';
import * as maptalks from '@maptalks/vt';

const PBRPlugin = createPainterPlugin('pbr', PBRScenePainter);

PBRPlugin.registerAt(maptalks.VectorTileLayer);

export default PBRPlugin;
