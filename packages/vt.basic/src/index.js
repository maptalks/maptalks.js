import { VectorTileLayer } from '@maptalks/vt';
import { createPainterPlugin } from '@maptalks/vt-plugin';
import FillPainter from './painters/FillPainter';
import LinePainter from './painters/LinePainter';
import LineGlowPainter from './painters/LineGlowPainter';
import IconPainter from './painters/IconPainter';
import TextPainter from './painters/TextPainter';
import NativePointPainter from './painters/NativePointPainter';
import NativeLinePainter from './painters/NativelinePainter';
// import TrailLinePainter from './painters/TrailLinePainter';
import PBRPainter from './painters/pbr/PBRPainter';
import PhongPainter from './painters/PhongPainter';
import WireframePainter from './painters/WireframePainter';

import LitPainter from './painters/pbr/LitPainter';
import ClothPainter from './painters/pbr/ClothPainter';
import SubsurfacePainter from './painters/pbr/SubsurfacePainter';

const FillPlugin = createPainterPlugin('fill', FillPainter);
FillPlugin.registerAt(VectorTileLayer);

const LinePlugin = createPainterPlugin('line', LinePainter);
LinePlugin.registerAt(VectorTileLayer);

const IconPlugin = createPainterPlugin('icon', IconPainter);
IconPlugin.registerAt(VectorTileLayer);

const TextPlugin = createPainterPlugin('text', TextPainter);
TextPlugin.registerAt(VectorTileLayer);

const LineGlowPlugin = createPainterPlugin('line-glow', LineGlowPainter);
LineGlowPlugin.registerAt(VectorTileLayer);

const NativeLinePlugin = createPainterPlugin('native-line', NativeLinePainter);
NativeLinePlugin.registerAt(VectorTileLayer);

const NativePointPlugin = createPainterPlugin('native-point', NativePointPainter);
NativePointPlugin.registerAt(VectorTileLayer);

// const TrailLinePlugin = createPainterPlugin('native-trail-line', TrailLinePainter);
// TrailLinePlugin.registerAt(VectorTileLayer);

const PBRPlugin = createPainterPlugin('pbr', PBRPainter);
PBRPlugin.registerAt(VectorTileLayer);

const PhongPlugin = createPainterPlugin('phong', PhongPainter);
PhongPlugin.registerAt(VectorTileLayer);

const WireframePlugin = createPainterPlugin('wireframe', WireframePainter);
WireframePlugin.registerAt(VectorTileLayer);

const LitPlugin = createPainterPlugin('lit', LitPainter);
LitPlugin.registerAt(VectorTileLayer);

const ClothPlugin = createPainterPlugin('cloth', ClothPainter);
ClothPlugin.registerAt(VectorTileLayer);

const SubsurfacePlugin = createPainterPlugin('subsurface', SubsurfacePainter);
SubsurfacePlugin.registerAt(VectorTileLayer);

export {
    LinePlugin,
    FillPlugin,
    IconPlugin,
    TextPlugin,
    LineGlowPlugin,
    NativeLinePlugin,
    // TrailLinePlugin,
    PBRPlugin,
    PhongPlugin,
    WireframePlugin,

    LinePainter,
    FillPainter,
    IconPainter,
    TextPainter,
    LineGlowPainter,
    NativeLinePainter,
    NativePointPainter,
    // TrailLinePainter,
    PBRPainter,
    PhongPainter,
    WireframePainter,

    //pbr plugins
    LitPlugin,
    ClothPlugin,
    SubsurfacePlugin
};
