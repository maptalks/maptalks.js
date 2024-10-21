import { reshader, RayCaster } from '@maptalks/gl';
import { coordinateToWorld } from './common/Util';
import Analysis from './Analysis';
import InSightPass from './pass/InSightPass';

export default class InSightAnalysis extends Analysis {
    constructor(options) {
        super(options);
        this._lines = options.lines || [];
        this._raycaster = new RayCaster();
        this.type = 'insight';
    }

    update(name, value) {
        if (name === 'lines') {
            this.setLines(value);
        } else {
            this._renderOptions[name] = value;
        }
        super.update(name, value);
    }

    addLine(inSightLine) {
        const { from, to } = inSightLine;
        if (from && to) {
            this._lines.push(inSightLine);
        }
        this._updateRenderOptions();
    }

    removeLine(inSightLine) {
        const index = this._lines.indexOf(inSightLine);
        if (index > -1) {
            this._lines.splice(index, 1);
        }
        this._updateRenderOptions();
    }

    getLines() {
        return this._lines;
    }

    setLines(lines) {
        this._lines = lines;
        this._updateRenderOptions();
    }

    clearLines() {
        this._lines = [];
        this._updateRenderOptions();
    }

    /**
     * Get objects intersecting with all inSight lines
     * The structure of data bellow here:
     * [{
     *    intersects: [{
     *        data: maptalks object, like gltfmarker、polygon...,
     *        coordinates: [{
     *            coordinate: maptalks.Coordinate,
     *            indices: [0, 1, 2]
     *        },]
     *    }],
     *    inSightLine
     * }]
     * @return {Object}
     * @function
     */
    getIntersetction() {
        const results = [];
        if (!this._meshes) {
            return results;
        }
        const map = this.layer.getMap();
        for (let i = 0; i < this._lines.length; i++) {
            const { from, to } = this._lines[i];
            this._raycaster.setFromPoint(from);
            this._raycaster.setToPoint(to);
            const data = this._raycaster.test(this._meshes, map);
            if (data && data.length) {
                const intersectResult = {
                    inSightLine: this._lines[i],
                    intersects: []
                };
                data.forEach(item => {
                    const dataItem = this._getRayCastData(item);
                    if (dataItem) {
                        intersectResult.intersects.push(dataItem);
                    }
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
        const { mesh, coordinates } = data;//对于某个mesh，可能有多个交点
        const excludeLayers = this.getExcludeLayers();
        layer.getLayers().forEach(childLayer => {
            const id = childLayer.getId();
            const renderer = childLayer.getRenderer();
            if (excludeLayers.indexOf(id) < 0 && renderer && renderer.getRayCastData && coordinates.length) {
                const indices = coordinates[0].indices;
                const raycastData = renderer.getRayCastData(mesh, indices[0]);
                if (raycastData) {
                    results.push({
                        data: raycastData,
                        coordinates
                    });
                }
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
        this._renderOptions['lines'] = this._lines.map(inSightLine => {
            const { from, to } = inSightLine;
            const fromition = coordinateToWorld(map, from.x || from[0], from.y || from[1], from.z || from[2]);
            const lookPosition = coordinateToWorld(map, to.x || to[0], to.y || to[1], to.z || to[2]);
            return {
                from: fromition,
                to: lookPosition
            };
        });
        this._renderOptions['visibleColor'] = this.options.visibleColor;
        this._renderOptions['invisibleColor'] = this.options.invisibleColor;
        this._renderOptions['projViewMatrix'] = map.projViewMatrix;
        this._renderOptions['horizontalAngle'] = 45;
        this._renderOptions['verticalAngle'] = 45;
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
