import { reshader, HeatmapProcess } from '@maptalks/gl';
import BasicPainter from './BasicPainter';
import { interpolated } from '@maptalks/function-type';
import { prepareFnTypeData } from './util/fn_type_util';
import { setUniformFromSymbol } from '../Util';

export default class HeatmapPainter extends BasicPainter {
    constructor(regl, layer, symbol, sceneConfig, pluginIndex) {
        super(regl, layer, symbol, sceneConfig, pluginIndex);

        this._fnTypeConfig = this._getFnTypeConfig();
    }

    _getFnTypeConfig() {
        const map = this.getMap();
        const symbolDef = this.symbolDef;
        const heatWeightFn = interpolated(symbolDef['heatWeight']);
        const u8 = new Int16Array(1);
        return [
            {
                attrName: 'aWeight',
                symbolName: 'heatWeight',
                type: Uint8Array,
                size: 1,
                evaluate: properties => {
                    const x = heatWeightFn(map.getZoom(), properties);
                    u8[0] = x;
                    return u8[0];
                }
            }
        ];
    }

    createGeometry(glData, features) {
        const geometry = super.createGeometry(glData, features);
        prepareFnTypeData(geometry, this.symbolDef, this._fnTypeConfig);
        return geometry;
    }

    createMesh(geometry, transform) {
        const symbol = this.getSymbol();
        const uniforms = {
            tileRatio: geometry.properties.tileRatio,
            dataResolution: geometry.properties.tileResolution
        };
        setUniformFromSymbol(uniforms, 'heatmapIntensity', symbol, 'heatmapIntensity', 1);
        setUniformFromSymbol(uniforms, 'heatmapRadius', symbol, 'heatmapRadius', 6);
        setUniformFromSymbol(uniforms, 'heatmapWeight', symbol, 'heatmapWeight', 1);
        setUniformFromSymbol(uniforms, 'heatmapOpacity', symbol, 'heatmapOpacity', 1);
        geometry.generateBuffers(this.regl);
        const material = new reshader.Material(uniforms);
        const mesh = new reshader.Mesh(geometry, material, {
            transparent: true,
            castShadow: false,
            picking: true
        });
        const defines = {};
        if (geometry.data.aWeight) {
            defines['HAS_HEAT_WEIGHT'] = 1;
        }
        mesh.setDefines(defines);
        mesh.setLocalTransform(transform);
        return mesh;
    }

    callRenderer(uniforms, context) {
        this._process.render(this.scene, uniforms, this.getRenderFBO(context));
    }

    getUniformValues(map) {
        const { projViewMatrix } = map;
        return {
            glScale: 1 / map.getGLScale(),
            resolution: map.getResolution(),
            projViewMatrix
        };
    }

    getHeatmapMeshes() {
        return this.scene.getMeshes();
    }

    delete() {
        super.delete(...arguments);
        this._process.dispose();
        delete this._process;
    }

    init() {
        const regl = this.regl;
        this.renderer = new reshader.Renderer(regl);
        const enableStencil = this.layer.getRenderer().isEnableTileStencil();
        const stencil = {
            enable: true,
            mask: 0xFF,
            func: {
                cmp: () => {
                    return enableStencil ? '=' : '<=';
                },
                ref: (context, props) => {
                    return enableStencil ? props.stencilRef : props.level;
                },
                mask: 0xFF
            },
            op: {
                fail: 'keep',
                zfail: 'keep',
                zpass: 'replace'
            }
        };
        const polygonOfffset = this.getPolygonOffset();
        const symbol = this.getSymbol();
        this._process = new HeatmapProcess(this.regl, this.sceneConfig, this.layer, symbol.heatmapColor, stencil, polygonOfffset);
    }
}
