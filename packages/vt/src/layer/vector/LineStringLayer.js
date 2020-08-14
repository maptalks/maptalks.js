import * as maptalks from 'maptalks';
import { LinePack } from '@maptalks/vector-packer';
import { extend } from '../../common/Util';
import Vector3DLayer from './Vector3DLayer';
import Vector3DLayerRenderer from './Vector3DLayerRenderer';
import Promise from '../../common/Promise';

class LineStringLayer extends Vector3DLayer {

}

LineStringLayer.registerJSONType('LineStringLayer');

const SYMBOL = {
    lineWidth: {
        type: 'identity',
        default: undefined,
        property: '_symbol_lineWidth'
    },
    lineColor: {
        type: 'identity',
        default: 20,
        property: '_symbol_lineColor'
    },
    lineDx: {
        type: 'identity',
        default: 20,
        property: '_symbol_lineDx'
    },
    lineDy: {
        type: 'identity',
        default: undefined,
        property: '_symbol_lineDy'
    },
    linePatternFile: {
        type: 'identity',
        default: undefined,
        property: '_symbol_linePatternFile'
    },
    lineOpacity: {
        type: 'identity',
        default: 1,
        property: '_symbol_lineOpacity'
    },
    lineJoin: {
        type: 'identity',
        default: undefined,
        property: '_symbol_lineJoin'
    },
    lineCap: {
        type: 'identity',
        default: undefined,
        property: '_symbol_lineCap'
    },
    lineDasharray: {
        type: 'identity',
        default: undefined,
        property: '_symbol_lineDasharray'
    }
};

class LineStringLayerRenderer extends Vector3DLayerRenderer {
    constructor(...args) {
        super(...args);
        this.PackClass = LinePack;
        this.GeometryTypes = [maptalks.LineString, maptalks.MultiLineString];
    }

    buildMesh(atlas) {
        //TODO 更新symbol的优化
        //1. 如果只影响texture，则只重新生成texture
        //2. 如果不影响Geometry，则直接调用painter.updateSymbol
        //3. Geometry和Texture全都受影响时，则全部重新生成
        const { features, center } = this._getFeaturesToRender();
        if (!features.length) {
            return;
        }

        const feas = [];
        const dashFeas = [];
        for (let i = 0; i < features.length; i++) {
            const f = features[i];
            if (f.properties && f.properties['lineDasharray']) {
                dashFeas.push(f);
            } else {
                feas.push(f);
            }
        }

        const promises = [];
        if (feas.length) {
            promises.push(this.createMesh(feas, atlas, center));
        }
        if (dashFeas.length) {
            promises.push(this.createMesh(dashFeas, atlas, center));
        }

        Promise.all(promises).then(meshes => {
            if (this.meshes) {
                this.painter.deleteMesh(this.meshes);
            }
            this.meshes = meshes;
            this.setToRedraw();
        });
    }

    createPainter() {
        const LinePainter = Vector3DLayer.getPainterClass('line');
        this.painterSymbol = extend({}, SYMBOL);
        const painter = new LinePainter(this.regl, this.layer, this.painterSymbol, this.layer.options.sceneConfig, 0);
        if (this.layer.getGeometries()) {
            this.onGeometryAdd(this.layer.getGeometries());
        }
        return painter;
    }
}

LineStringLayer.registerRenderer('gl', LineStringLayerRenderer);
LineStringLayer.registerRenderer('canvas', null);

export default LineStringLayer;
