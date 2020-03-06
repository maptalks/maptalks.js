import { reshader, HeatmapProcess } from '@maptalks/gl';
import BasicPainter from './BasicPainter';
import { interpolated } from '@maptalks/function-type';
import { prepareFnTypeData } from './util/fn_type_util';
import { setUniformFromSymbol } from '../Util';

const DEFAULT_UNIFORMS = {
    // heatmapOpacity: 1,
    heatmapIntensity: 1,
    heatmapRadius: 6
};

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
        prepareFnTypeData(geometry, geometry.properties.features, this.symbolDef, this._fnTypeConfig);
        return geometry;
    }

    createMesh(geometry, transform) {
        const symbol = this.getSymbol();
        const uniforms = {
            tileRatio: geometry.properties.tileRatio,
            dataResolution: geometry.properties.tileResolution
        };
        setUniformFromSymbol(uniforms, 'heatmapIntensity', symbol, 'heatmapIntensity');
        setUniformFromSymbol(uniforms, 'heatmapRadius', symbol, 'heatmapRadius');
        if (!geometry.data.aWeight) {
            setUniformFromSymbol(uniforms, 'heatmapWeight', symbol, 'heatmapWeight');
        }
        geometry.generateBuffers(this.regl);
        const material = new reshader.Material(uniforms, DEFAULT_UNIFORMS);
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
        const symbol = this.getSymbol();
        return {
            glScale: 1 / map.getGLScale(),
            resolution: map.getResolution(),
            projViewMatrix,
            heatmapWeight: symbol.heatmapWeight || 1,
            heatmapOpacity: symbol.heatmapOpacity === undefined ? 1 : symbol.heatmapOpacity
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
        const polygonOfffset = {
            factor: () => -1,
            units: () => { return -(this.layer.getPolygonOffset() + this.pluginIndex + 1); }
        };
        const symbol = this.getSymbol();
        this._process = new HeatmapProcess(this.regl, this.sceneConfig, this.layer, symbol.heatmapColor, stencil, polygonOfffset);
    }
}
