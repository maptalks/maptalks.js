import * as reshader from '@maptalks/reshader.gl';
import * as maptalks from 'maptalks';
import Analysis from './Analysis';

export default class InSightAnalysis extends Analysis {
    constructor(options) {
        super(options);
        this.type = 'insight';
    }

    addTo(layer) {
        super.addTo(layer);
        const renderer = this.layer.getRenderer();
        const map = this.layer.getMap();
        this._renderOptions = {};
        this._renderOptions['eyePos'] = coordinateToWorld(map, this.options.eyePos);
        this._renderOptions['lookPoint'] = coordinateToWorld(map, this.options.lookPoint);
        this._renderOptions['visibleColor'] = this.options.visibleColor;
        this._renderOptions['invisibleColor'] = this.options.invisibleColor;
        this._renderOptions['projViewMatrix'] = map.projViewMatrix;
        if (renderer) {
            this._setInSightPass(renderer);
        } else {
            this.layer.once('renderercreate', e => {
                this._setInSightPass(e.renderer);
            }, this);
        }
        return this;
    }

    update(name, value) {
        if (name === 'eyePos' || name === 'lookPoint') {
            const map = this.layer.getMap();
            this._renderOptions[name] = coordinateToWorld(map, value);
        } else {
            this._renderOptions[name] = value;
        }
        super.update(name, value);
    }

    _setInSightPass(renderer) {
        const viewport = {
            x : 0,
            y : 0,
            width : () => {
                return renderer.canvas ? renderer.canvas.width : 1;
            },
            height : () => {
                return renderer.canvas ? renderer.canvas.height : 1;
            }
        };
        const insightRenderer = new reshader.Renderer(renderer.regl);
        this._insightPass = this._insightPass || new reshader.InSightPass(insightRenderer, viewport);
        this.layer.addAnalysis(this);
        renderer.setToRedraw();
    }

    renderAnalysis(meshes) {
        const uniforms = {};
        const insightMap =  this._insightPass.render(meshes, this._renderOptions);
        uniforms['insightMap'] = insightMap;
        uniforms['insight_visibleColor'] =  this._renderOptions['visibleColor'] || [0.0, 1.0, 0.0, 1.0];
        uniforms['insight_invisibleColor'] = this._renderOptions['invisibleColor'] || [1.0, 0.0, 0.0, 1.0];
        return uniforms;
    }

    getDefines() {
        return {
            HAS_INSIGHT: 1
        };
    }

    remove() {
        super.remove();
        if (this._insightPass) {
            this._insightPass.dispose();
        }
    }
}

function coordinateToWorld(map, coordinate) {
    if (!map || !coordinate) {
        return null;
    }
    const p = map.coordinateToPointAtRes(new maptalks.Coordinate(coordinate[0], coordinate[1]), map.getGLRes());
    return [p.x, p.y, coordinate[2]];
}
