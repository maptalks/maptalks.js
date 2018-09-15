import { createPainterPlugin } from '@maptalks/vt-plugin';
import PhongPainter from './PhongPainter';
import * as maptalks from '@maptalks/vt';

const PhongPlugin = createPainterPlugin('phong', PhongPainter);

PhongPlugin.registerAt(maptalks.VectorTileLayer);

export default PhongPlugin;
