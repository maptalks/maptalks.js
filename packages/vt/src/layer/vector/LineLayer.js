import { LinePack } from '@maptalks/vector-packer';
import { extend } from '../../common/Util';
import Vector3DLayer from './Vector3DLayer';
import Vector3DLayerRenderer from './Vector3DLayerRenderer';

class LineLayer extends Vector3DLayer {

}

LineLayer.registerJSONType('LineLayer');

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
        default: undefined,
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

class LineLayerRenderer extends Vector3DLayerRenderer {
    constructor(...args) {
        super(...args);
        this.PackClass = LinePack;
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

LineLayer.registerRenderer('gl', LineLayerRenderer);
LineLayer.registerRenderer('canvas', null);

export default LineLayer;
