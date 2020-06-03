import * as reshader from '@maptalks/reshader.gl';
import * as maptalks from 'maptalks';
import Analysis from './Analysis';

export default class ViewshedAnalysis extends Analysis {
    constructor(options) {
        super(options);
        this.type = 'viewshed';
    }

    addTo(layer) {
        super.addTo(layer);
        const renderer = this.layer.getRenderer();
        const map = this.layer.getMap();
        this._renderOptions = {};
        this._renderOptions['eyePos'] = coordinateToWorld(map, this.options.eyePos);
        this._renderOptions['lookPoint'] = coordinateToWorld(map, this.options.lookPoint);
        this._renderOptions['verticalAngle'] = this.options.verticalAngle;
        this._renderOptions['horizonAngle'] = this.options.horizonAngle;
        if (renderer) {
            this._setViewshedPass(renderer);
        } else {
            this.layer.once('renderercreate', e => {
                this._setViewshedPass(e.renderer);
            }, this);
        }
        return this;
    }

    update(name, value) {
        if (value.length > 0) {
            const map = this.layer.getMap();
            this._renderOptions[name] = coordinateToWorld(map, value);
        } else {
            this._renderOptions[name] = value;
        }
        super.update(name, value);
    }

    _setViewshedPass(renderer) {
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
        const viewshedRenderer = new reshader.Renderer(renderer._regl);
        this._viewshedPass = new reshader.ViewshedPass(viewshedRenderer, viewport) || this._viewshedPass;
        this.layer.addAnalysis(this);
    }

    renderAnalysis(context, toAnalyseMeshes) {
        super.renderAnalysis(context);
        const analysisType = this.getAnalysisType();
        const renderUniforms = {};
        const uniforms =  this._viewshedPass.render(toAnalyseMeshes, this._renderOptions);
        renderUniforms['viewshed_depthMapFromViewpoint'] = uniforms.depthMap;
        renderUniforms['viewshed_projViewMatrixFromViewpoint'] = uniforms.projViewMatrixFromViewpoint;
        renderUniforms['viewshed_visibleColor'] = this._renderOptions['visibleColor'] || [0.0, 1.0, 0.0, 1.0];
        renderUniforms['viewshed_invisibleColor'] = this._renderOptions['invisibleColor'] || [1.0, 0.0, 0.0, 1.0];
        context[analysisType]['renderUniforms'] = renderUniforms;
    }

    getDefines() {
        return {
            HAS_VIEWSHED: 1
        };
    }

    remove() {
        super.remove();
        if (this._viewshedPass) {
            this._viewshedPass.dispose();
        }
    }
}

function coordinateToWorld(map, coordinate) {
    if (!map) {
        return null;
    }
    const p = map.coordinateToPoint(new maptalks.Coordinate(coordinate[0], coordinate[1]), map.getGLZoom());
    return [p.x, p.y, coordinate[2]];
}
