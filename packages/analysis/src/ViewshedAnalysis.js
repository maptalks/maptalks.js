import { reshader } from '@maptalks/gl';
import Analysis from './Analysis';
import ViewshedPass from './pass/ViewShedPass';
import { coordinateToWorld } from './common/Util';

export default class ViewshedAnalysis extends Analysis {
    constructor(options) {
        super(options);
        this.type = 'viewshed';
    }

    update(name, value) {
        if (name === 'eyePos' || name === 'lookPoint') {
            const map = this.layer.getMap();
            this._renderOptions[name] = coordinateToWorld(map, ...value);
        } else {
            this._renderOptions[name] = value;
        }
        super.update(name, value);
    }

    _prepareRenderOptions() {
        const map = this.layer.getMap();
        this._renderOptions = {};
        this._renderOptions['eyePos'] = coordinateToWorld(map, ...this.options.eyePos);
        this._renderOptions['lookPoint'] = coordinateToWorld(map, ...this.options.lookPoint);
        this._renderOptions['verticalAngle'] = this.options.verticalAngle;
        this._renderOptions['horizontalAngle'] = this.options.horizontalAngle;
        this._renderOptions['visibleColor'] = this.options.visibleColor;
        this._renderOptions['invisibleColor'] = this.options.invisibleColor;
        this._renderOptions['projViewMatrix'] = map.projViewMatrix;
        this._renderOptions['minAltitude'] = 0;
    }

    _setPass(renderer) {
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
        this._prepareRenderOptions();
        const viewshedRenderer = new reshader.Renderer(renderer.device);
        this._pass = new ViewshedPass(viewshedRenderer, viewport) || this._pass;
        this.layer.addAnalysis(this);
        renderer.setToRedraw();
    }

    renderAnalysis(meshes) {
        const uniforms = {};
        const viewshedMap =  this._pass.render(meshes, this._renderOptions);
        uniforms['viewshedMap'] = viewshedMap;
        uniforms['viewshed_visibleColor'] =  this._renderOptions['visibleColor'] || [0.0, 1.0, 0.0, 0.3];
        uniforms['viewshed_invisibleColor'] = this._renderOptions['invisibleColor'] || [1.0, 0.0, 0.0, 0.3];
        return uniforms;
    }

    //获取viewshed棱锥的4个顶点的坐标
    getVertexCoordinates() {
        const map = this.layer.getMap();
        if (!map) {
            return [];
        }
        return this._pass._getVertexCoordinates(map);
    }

    getDefines() {
        return {
            HAS_VIEWSHED: 1
        };
    }
}

