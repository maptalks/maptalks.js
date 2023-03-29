import { reshader } from '@maptalks/gl';
import { coordinateToWorld } from './common/Util';
import Analysis from './Analysis';
import InSightPass from './pass/InSightPass';
import RayCaster from './RayCaster';

export default class InSightAnalysis extends Analysis {
    constructor(options) {
        super(options);
        this._inSightLineList = options.inSightLineList || [];
        this._raycaster = new RayCaster();
        this.type = 'insight';
    }

    update(name, value) {
        if (name === 'inSightLineList') {
            this.setInSightLines(value);
        } else {
            this._renderOptions[name] = value;
        }
        super.update(name, value);
    }

    addInSightLine(inSightLine) {
        const { eyePos, lookPoint } = inSightLine;
        if (eyePos && lookPoint) {
            this._inSightLineList.push(inSightLine);
        }
        this._updateRenderOptions();
    }

    removeInSightLine(inSightLine) {
        const index = this._inSightLineList.indexOf(inSightLine);
        if (index > -1) {
            this._inSightLineList.splice(index, 1);
        }
        this._updateRenderOptions();
    }

    getInSightLines() {
        return this._inSightLineList;
    }

    setInSightLines(inSightLineList) {
        this._inSightLineList = inSightLineList;
        this._updateRenderOptions();
    }

    clearInSightLines() {
        this._inSightLineList = [];
        this._updateRenderOptions();
    }

    /**
     * Get objects intersecting with all inSight lines
     * The structure of data bellow here:
     * [{
     *    intersects: [{
     *        data: maptalks object, like gltfmarker、polygon...,
     *        coordinate: intersect coordinate
     *    }],
     *    inSightLine
     * }]
     * @return {Object}
     * @function
     */
    getIntersetctResults() {
        const results = [];
        if (!this._meshes) {
            return results;
        }
        const map = this.layer.getMap();
        for (let i = 0; i < this._inSightLineList.length; i++) {
            const { eyePos, lookPoint } = this._inSightLineList[i];
            this._raycaster.setFromTo(eyePos, lookPoint);
            const data = this._raycaster.test(this._meshes, map);
            if (data && data.length) {
                const intersectResult = {
                    inSightLine: this._inSightLineList[i],
                    intersects: []
                };
                data.forEach(item => {
                    const dataItem = this._getRayCastData(item);
                    intersectResult.intersects.push(dataItem);
                });
                results.push(intersectResult);
            }
        }
        return results;
    }

    _getRayCastData(data) {
        const results = [];
        const layer = this.layer;
        if (!layer) {
            return results;
        }
        const { mesh, indices, coordinate } = data;
        const excludeLayers = this.getExcludeLayers();
        layer.getLayers().forEach(childLayer => {
            const id = childLayer.getId();
            const renderer = childLayer.getRenderer();
            if (excludeLayers.indexOf(id) < 0 && renderer && renderer.getRayCastData) {
                const raycastData = renderer.getRayCastData(mesh, indices[0]);
                results.push({
                    data: raycastData,
                    coordinate
                });
            }
        });
        return results;
    }

    _updateRenderOptions() {
        this._prepareRenderOptions();
        const renderer = this.layer.getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
    }

    _prepareRenderOptions() {
        const map = this.layer.getMap();
        this._renderOptions = {};
        this._renderOptions['inSightLineList'] = this._inSightLineList.map(inSightLine => {
            const { eyePos, lookPoint } = inSightLine;
            const eyePosition = coordinateToWorld(map, ...eyePos);
            const lookPosition = coordinateToWorld(map, ...lookPoint);
            return {
                eyePos: eyePosition,
                lookPoint: lookPosition
            };
        });
        this._renderOptions['visibleColor'] = this.options.visibleColor;
        this._renderOptions['invisibleColor'] = this.options.invisibleColor;
        this._renderOptions['projViewMatrix'] = map.projViewMatrix;
        this._renderOptions['horizontalAngle'] = 45;
        this._renderOptions['verticalAngle'] = 45;
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
        const insightRenderer = new reshader.Renderer(renderer.regl);
        this._pass = this._pass || new InSightPass(insightRenderer, viewport);
        this.layer.addAnalysis(this);
        renderer.setToRedraw();
    }

    renderAnalysis(meshes) {
        const uniforms = {};
        this._meshes = meshes;
        const insightMap =  this._pass.render(meshes, this._renderOptions);
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
}
