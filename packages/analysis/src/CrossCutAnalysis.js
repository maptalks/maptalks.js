import Analysis from './Analysis';
import * as maptalks from 'maptalks';
import { reshader, mat4 } from '@maptalks/gl';
import CrossCutPass from './pass/CrossCutPass';
import along from '@turf/along';
import { lineString  } from '@turf/helpers';
import buffer from '@turf/buffer';
import distance from '@turf/distance';

const pickingVert = reshader.ShaderLib.get('mesh_picking_vert');
const pickingWGSLVert = reshader.WgslShaderLib.get('mesh_picking').vert;

const DEFAULT_WATER_COLOR = [0.8451, 0.2588, 0.4863];
const pvMatrix = [], pMatrix = [], vMatrix = [];
export default class CrossCutAnalysis extends Analysis {
    constructor(options) {
        super(options);
        this.type = 'crosscutAnalysis';
        this._needRefreshPicking = true;
    }

    _prepareRenderOptions() {
        const map = this.layer.getMap();
        this._renderOptions = {};
        const { extentMap, extentInWorld } = this._createLine(this.options.cutLine);
        this._renderOptions['extent'] = extentInWorld;
        this._renderOptions['extentMap'] = extentMap;
        this._renderOptions['projMatrix'] = map.projMatrix;
        this._renderOptions['viewMatrix'] = map.viewMatrix;
        this._renderOptions['minAltitude'] = 0;
        const line = new maptalks.LineString(this.options.cutLine)
        this._lineExtent = line.getExtent();
    }

    getAltitudes(count) {
        const line = lineString(this.options.cutLine);
        let len = 0;
        for (let i = 0; i < this.options.cutLine.length - 1; i++) {
            len += distance(this.options.cutLine[i], this.options.cutLine[i + 1]);
        }
        const perLength = len / count;
        const results = [], lineCoords = [];
        for (let i = 0; i < count; i++) {
            const alongPoint = along(line, perLength * (i + 1));
            lineCoords.push(alongPoint.geometry.coordinates);
        }
        const map = this.layer.getMap();
        const dpr = map.getDevicePixelRatio();
        const { projViewMatrix, projMatrix, viewMatrix } = this._prepareProjViewMatrixFromOrtho(lineCoords);
        for (let i = 0; i < lineCoords.length; i++) {
            const point = this._getScreenPoint(lineCoords[i], lineCoords);
            const x = point.x * dpr, y = point.y * dpr;
            const pickedPoint = this._pick(x, y, projViewMatrix, projMatrix, viewMatrix);
            if (!pickedPoint) {
                continue;
            }
            const altitude = map.pointAtResToAltitude(pickedPoint[2], map.getGLRes());
            const coordinate = map.pointAtResToCoordinate(new maptalks.Point(pickedPoint[0], pickedPoint[1]), map.getGLRes());
            results.push({
                coordinate: new maptalks.Coordinate(coordinate.x, coordinate.y, altitude),
                distance: perLength * i
            });
        }
        return results;
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
        this._setPickingFBO(renderer);
        const crosscutRenderer = new reshader.Renderer(renderer.device);
        this._pass = this._pass || new CrossCutPass(crosscutRenderer, viewport);
        this.layer.addAnalysis(this);
    }

    _setPickingFBO(renderer) {
        const map = this.layer.getMap();
        this.pickingFBO = renderer.canvas.pickingFBO || renderer.device.framebuffer(renderer.canvas.width, renderer.canvas.height);
        const pickRenderer = new reshader.Renderer(renderer.device);
        this._picking = new reshader.FBORayPicking(
            pickRenderer,
            {
                vert : pickingVert,
                wgslVert: pickingWGSLVert,
                uniforms : [
                    {
                        name : 'projViewModelMatrix',
                        type : 'function',
                        fn : function (context, props) {
                            return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                        }
                    }
                ]
            },
            this.pickingFBO,
            map
        );
    }

    _prepareProjViewMatrixFromOrtho() {
        if (this._matrix) {
            return this._matrix;
        }
        const map = this.layer.getMap();
        const { precenter, prezoom, prepitch, prebearing } = this._setMapInOrthoState();
        mat4.copy(pvMatrix, map.projViewMatrix);
        mat4.copy(pMatrix, map.projMatrix);
        mat4.copy(vMatrix, map.viewMatrix);
        map.setZoom(prezoom);
        map.setCenter(precenter);
        map.setPitch(prepitch);
        map.setBearing(prebearing);
        this._matrix = { projViewMatrix: pvMatrix, projMatrix: pMatrix, viewMatrix: vMatrix };
        return this._matrix;
    }

    _setMapInOrthoState() {
        const extent = this._lineExtent;
        const map = this.layer.getMap();
        const precenter = map.getCenter(), prezoom = map.getZoom(), prepitch = map.getPitch(), prebearing = map.getBearing();
        const zoom = map.getFitZoom(extent);
        map.setZoom(zoom);
        map.setCenter(extent.getCenter());
        map.setPitch(0);
        return { precenter, prezoom, prepitch, prebearing };
    }

    _getScreenPoint(coordinate) {
        const { precenter, prezoom, prepitch, prebearing } = this._setMapInOrthoState();
        const map = this.layer.getMap();
        const point =  map.coordinateToContainerPoint(new maptalks.Coordinate(coordinate));
        map.setZoom(prezoom);
        map.setCenter(precenter);
        map.setPitch(prepitch);
        map.setBearing(prebearing);
        return point;
    }

    _pick(x, y, projViewMatrix, projMatrix, viewMatrix, options = {}) {
        if (this._needRefreshPicking) {
            if (!this._toRenderMeshes || this._toRenderMeshes.length === 0) {
                return null;
            }
            const meshes = this._toRenderMeshes;
            meshes.forEach(mesh => {
                const defines = mesh.getDefines();
                defines.HAS_PICKING_ID = 2;
                mesh.setDefines(defines);
                mesh.setUniform('uPickingId', 1);
            })
            this._picking.render(meshes, {
                projViewMatrix,
                minAltitude: this._renderOptions['minAltitude']
            }, true);
            this._needRefreshPicking = false;
        }
        const { point } = this._picking.pick(
            x,   // 屏幕坐标 x轴的值
            y,  // 屏幕坐标 y轴的值
            options.tolerance || 3,
            {
                projViewMatrix,
                minAltitude: this._renderOptions['minAltitude']
            },
            {
                viewMatrix,  //viewMatrix和projMatrix用于计算点的世界坐标值
                projMatrix,
                returnPoint : true
            }
        );
        return point;
    }

    update(name, value) {
        super.update(name, value);
        if (name === 'cutLine') {
            const { extentMap, extentInWorld } = this._createLine(value);
            this._renderOptions['extent'] = extentInWorld;
            this._renderOptions['extentMap'] = extentMap;
            const line = new maptalks.LineString(this.options.cutLine)
            this._lineExtent = line.getExtent();
            this._needRefreshPicking = true;
            delete this._matrix;
        } else {
            this._renderOptions[name] = value;
        }
    }

    renderAnalysis(meshes) {
        const uniforms = {};
        this._extentPass.render(this._extentMeshes, this._pvMatrix);
        uniforms['cutLineColor'] = this.options['cutLineColor'] || DEFAULT_WATER_COLOR;
        uniforms['crosscutMap'] = this._pass.render(meshes, this._renderOptions);
        this._toRenderMeshes = meshes;
        return uniforms;
    }

    getDefines() {
        return {
            HAS_CROSSCUT: 1
        };
    }
}
