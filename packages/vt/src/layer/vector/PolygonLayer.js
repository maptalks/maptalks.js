import * as maptalks from 'maptalks';
import { PolygonPack } from '@maptalks/vector-packer';
import { extend } from '../../common/Util';
import Vector3DLayer from './Vector3DLayer';
import Vector3DLayerRenderer from './Vector3DLayerRenderer';
import { fromJSON } from './util/from_json';

class PolygonLayer extends Vector3DLayer {
    /**
     * Reproduce a PolygonLayer from layer's JSON.
     * @param  {Object} layerJSON - layer's JSON
     * @return {PolygonLayer}
     * @static
     * @private
     * @function
     */
    static fromJSON(json) {
        return fromJSON(json, 'PolygonLayer', PolygonLayer);
    }
}

PolygonLayer.registerJSONType('PolygonLayer');

const SYMBOL = {
    polygonFill: {
        type: 'identity',
        default: undefined,
        property: '_symbol_polygonFill'
    },
    polygonPatternFile: {
        type: 'identity',
        default: undefined,
        property: '_symbol_polygonPatternFile'
    },
    polygonOpacity: {
        type: 'identity',
        default: undefined,
        property: '_symbol_polygonOpacity'
    }
};

class PolygonLayerRenderer extends Vector3DLayerRenderer {
    constructor(...args) {
        super(...args);
        this.PackClass = PolygonPack;
        this.GeometryTypes = [maptalks.Polygon, maptalks.MultiPolygon];
    }

    buildMesh(atlas) {
        const { features, center } = this._getFeaturesToRender();
        if (!features.length) {
            return;
        }

        //因为有虚线和没有虚线的line绘制逻辑不同，需要分开创建mesh
        const feas = [];
        const alphaFeas = [];
        for (let i = 0; i < features.length; i++) {
            const f = features[i];
            if (f.properties && f.properties['_symbol_polygonOpacity'] < 1) {
                alphaFeas.push(f);
            } else {
                feas.push(f);
            }
        }

        const symbol = extend({}, SYMBOL);
        const promises = [
            this.createMesh(this.painter, PolygonPack, symbol, feas, atlas && atlas[0], center),
            this.createMesh(this.painter, PolygonPack, symbol, alphaFeas, atlas && atlas[1], center)
        ];

        Promise.all(promises).then(mm => {
            if (this.meshes) {
                this.painter.deleteMesh(this.meshes);
            }
            const meshes = [];
            const atlas = [];
            for (let i = 0; i < mm.length; i++) {
                if (mm[i] && mm[i].mesh) {
                    meshes.push(mm[i].mesh);
                    mm[i].mesh.geometry.properties.originElements = mm[i].mesh.geometry.properties.elements.slice();
                    if (i === 1) {
                        mm[i].mesh.transparent = true;
                    }
                    atlas[i] = mm[i].atlas;
                }
            }
            this.meshes = meshes;
            this.atlas = atlas;
            this.setToRedraw();
        });
    }

    createPainter() {
        const FillPainter = Vector3DLayer.get3DPainterClass('fill');
        this.painterSymbol = extend({}, SYMBOL);
        const painter = new FillPainter(this.regl, this.layer, this.painterSymbol, this.layer.options.sceneConfig, 0);
        return painter;
    }
}

PolygonLayer.registerRenderer('gl', PolygonLayerRenderer);
PolygonLayer.registerRenderer('canvas', null);

export default PolygonLayer;
