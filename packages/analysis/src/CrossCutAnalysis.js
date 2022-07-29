import Analysis from './Analysis';
import * as maptalks from 'maptalks';
import { reshader } from '@maptalks/gl';
import CrossCutPass from './pass/CrossCutPass';
import along from '@turf/along';
import { lineString  } from '@turf/helpers';
import buffer from '@turf/buffer';
import distance from '@turf/distance';

const DEFAULT_WATER_COLOR = [0.8451, 0.2588, 0.4863];
export default class CrossCutAnalysis extends Analysis {
    constructor(options) {
        super(options);
        this.type = 'crosscutAnalysis';
    }

    _prepareRenderOptions() {
        const map = this.layer.getMap();
        this._renderOptions = {};
        const { extentMap, extentInWorld } = this._createLine(this.options.cutLine);
        this._renderOptions['extent'] = extentInWorld;
        this._renderOptions['extentMap'] = extentMap;
        this._renderOptions['projMatrix'] = map.projMatrix;
        this._renderOptions['viewMatrix'] = map.viewMatrix;
    }

    getAltitudes(count) {
        const line = lineString(this.options.cutLine);
        let len = 0;
        for (let i = 0; i < this.options.cutLine.length - 1; i++) {
            len += distance(this.options.cutLine[i], this.options.cutLine[i + 1]);
        }
        const perLength = len / count;
        const results = [];
        for (let i = 0; i < count; i++) {
            const alongPoint = along(line, perLength * (i + 1));
            const coordinate = new maptalks.Coordinate(alongPoint.geometry.coordinates);
            const picked = this._getPickedCoordinate(coordinate);
            if (picked) {
                results.push({
                    point: [coordinate.x, coordinate.y, picked.z],
                    distance: perLength * i
                });
            }
        }
        return results;
    }

    _getPickedCoordinate(coordinate) {
        const map = this.layer.getMap();
        const identifyData = this.layer.identify(coordinate)[0];
        const pickedPoint = identifyData && identifyData.point;
        if (pickedPoint) {
            const altitude = map.pointAtResToAltitude(pickedPoint[2], map.getGLRes());
            const coordinate = map.pointAtResToCoordinate(new maptalks.Point(pickedPoint[0], pickedPoint[1]), map.getGLRes());
            return new maptalks.Coordinate(coordinate.x, coordinate.y, altitude);
        } else {
            return coordinate;
        }
    }


    _createLine(cutLine) {
        const line = lineString(cutLine);
        const buffered = buffer(line, 0.001);
        return this._calExtent(buffered.geometry.coordinates[0]);
    }

    _setPass(renderer) {
        const viewport = this._viewport = {
            x : 0,
            y : 0,
            width : () => {
                return renderer.canvas ? renderer.canvas.width : 1;
            },
            height : () => {
                return renderer.canvas ? renderer.canvas.height : 1;
            }
        };
        this._prepareRenderOptions(renderer);
        const crosscutRenderer = new reshader.Renderer(renderer.regl);
        this._pass = this._pass || new CrossCutPass(crosscutRenderer, viewport);
        this.layer.addAnalysis(this);
    }

    update(name, value) {
        if (name === 'cutLine') {
            const { extentMap, extentInWorld } = this._createLine(value);
            this._renderOptions['extent'] = extentInWorld;
            this._renderOptions['extentMap'] = extentMap;
        } else {
            this._renderOptions[name] = value;
        }
        super.update(name, value);
    }

    renderAnalysis(meshes) {
        const uniforms = {};
        this._extentPass.render(this._extentMeshes, this._pvMatrix);
        uniforms['cutLineColor'] = this.options['cutLineColor'] || DEFAULT_WATER_COLOR;
        uniforms['crosscutMap'] = this._pass.render(meshes, this._renderOptions);
        return uniforms;
    }

    getDefines() {
        return {
            HAS_CROSSCUT: 1
        };
    }
}
