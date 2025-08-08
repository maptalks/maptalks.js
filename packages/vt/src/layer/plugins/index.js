import VectorTileLayer from '../layer/VectorTileLayer';
import Vector3DLayer from '../vector/Vector3DLayer';
import createPainterPlugin from './PainterPlugin';
import FillPainter from './painters/FillPainter';
import LinePainter from './painters/LinePainter';
import LineGradientPainter from './painters/LineGradientPainter';
// import LineGlowPainter from './painters/LineGlowPainter';
import IconPainter from './painters/IconPainter';
import TextPainter from './painters/TextPainter';
import NativePointPainter from './painters/NativePointPainter';
import NativeLinePainter from './painters/NativelinePainter';
// import TrailLinePainter from './painters/TrailLinePainter';
// import PBRPainter from './painters/pbr/PBRPainter';
import PhongPainter from './painters/PhongPainter';
import WireframePainter from './painters/WireframePainter';

import StandardPainter from './painters/pbr/StandardPainter';
// import ClothPainter from './painters/pbr/ClothPainter';
// import SubsurfacePainter from './painters/pbr/SubsurfacePainter';

import TubePainter from './painters/TubePainter';

import GLTFPhongPainter from './painters/GLTFPhongPainter';
import GLTFStandardPainter from './painters/GLTFStandardPainter';
import HeatmapPainter from './painters/HeatmapPainter';
import WaterPainter from './painters/WaterPainter';
import BillBoardPainter from './painters/BillBoardPainter';

const FillPlugin = createPainterPlugin('fill', FillPainter);
FillPlugin.registerAt(VectorTileLayer);

const LinePlugin = createPainterPlugin('line', LinePainter);
LinePlugin.registerAt(VectorTileLayer);

const LineGradientPlugin = createPainterPlugin('line-gradient', LineGradientPainter);
LineGradientPlugin.registerAt(VectorTileLayer);

const IconPlugin = createPainterPlugin('icon', IconPainter);
IconPlugin.registerAt(VectorTileLayer);

const TextPlugin = createPainterPlugin('text', TextPainter);
TextPlugin.registerAt(VectorTileLayer);

/*const LineGlowPlugin = createPainterPlugin('line-glow', LineGlowPainter);
LineGlowPlugin.registerAt(VectorTileLayer);*/
const NativeLinePlugin = createPainterPlugin('native-line', NativeLinePainter);
NativeLinePlugin.registerAt(VectorTileLayer);

const NativePointPlugin = createPainterPlugin('native-point', NativePointPainter);
NativePointPlugin.registerAt(VectorTileLayer);

// const TrailLinePlugin = createPainterPlugin('native-trail-line', TrailLinePainter);
// TrailLinePlugin.registerAt(VectorTileLayer);

// const PBRPlugin = createPainterPlugin('pbr', PBRPainter);
// PBRPlugin.registerAt(VectorTileLayer);

const PhongPlugin = createPainterPlugin('phong', PhongPainter);
PhongPlugin.registerAt(VectorTileLayer);

const WireframePlugin = createPainterPlugin('wireframe', WireframePainter);
WireframePlugin.registerAt(VectorTileLayer);

const LitPlugin = createPainterPlugin('lit', StandardPainter);
LitPlugin.registerAt(VectorTileLayer);

const TubePlugin = createPainterPlugin('tube', TubePainter);
TubePlugin.registerAt(VectorTileLayer);

/*const ClothPlugin = createPainterPlugin('cloth', ClothPainter);
ClothPlugin.registerAt(VectorTileLayer);*/

/*const SubsurfacePlugin = createPainterPlugin('subsurface', SubsurfacePainter);
SubsurfacePlugin.registerAt(VectorTileLayer);*/

const GLTFPhongPlugin = createPainterPlugin('gltf-phong', GLTFPhongPainter);
GLTFPhongPlugin.registerAt(VectorTileLayer);

const GLTFStandardPlugin = createPainterPlugin('gltf-lit', GLTFStandardPainter);
GLTFStandardPlugin.registerAt(VectorTileLayer);

const HeatmapPlugin = createPainterPlugin('heatmap', HeatmapPainter);
HeatmapPlugin.registerAt(VectorTileLayer);

const WaterPlugin = createPainterPlugin('water', WaterPainter);
WaterPlugin.registerAt(VectorTileLayer);

const BillBoardPlugin = createPainterPlugin('billboard', BillBoardPainter);
BillBoardPlugin.registerAt(VectorTileLayer);

Vector3DLayer.registerPainter('lit', StandardPainter);
Vector3DLayer.registerPainter('icon', IconPainter);
Vector3DLayer.registerPainter('fill', FillPainter);
Vector3DLayer.registerPainter('line', LinePainter);
Vector3DLayer.registerPainter('line-gradient', LineGradientPainter);
Vector3DLayer.registerPainter('water', WaterPainter);
Vector3DLayer.registerPainter('tube', TubePainter);
Vector3DLayer.registerPainter('billboard', BillBoardPainter);

export {
    LinePlugin,
    LineGradientPlugin,
    FillPlugin,
    IconPlugin,
    TextPlugin,
    // LineGlowPlugin,
    NativeLinePlugin,
    // TrailLinePlugin,
    // PBRPlugin,
    PhongPlugin,
    WireframePlugin,
    BillBoardPlugin,

    LinePainter,
    FillPainter,
    IconPainter,
    TextPainter,
    // LineGlowPainter,
    NativeLinePainter,
    NativePointPainter,
    // TrailLinePainter,
    // PBRPainter,
    PhongPainter,
    WireframePainter,
    BillBoardPainter,

    //pbr plugins
    LitPlugin,
    TubePlugin,
    // ClothPlugin,
    // SubsurfacePlugin,

    //gltf plugins
    GLTFPhongPlugin,
    GLTFStandardPlugin,

    HeatmapPlugin,
    WaterPlugin
};
