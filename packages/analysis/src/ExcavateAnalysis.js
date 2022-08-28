import { reshader, mat4 } from '@maptalks/gl';
import { defined } from './common/Util';
import * as maptalks from 'maptalks';
import Analysis from './Analysis';
import ExcavatePass from './pass/ExcavatePass';
import pickingVert from './pass/glsl/picking.vert';

export default class ExcavateAnalysis extends Analysis {
    constructor(options) {
        super(options);
        this.type = 'excavate';
    }

    _createGroundTexture(textureUrl) {
        const regl = this.regl;
        const texture = regl.texture({width: 2, height: 2});
        if (textureUrl) {
            const image = new Image();
            image.src = textureUrl;
            image.onload = function() {
                this._renderOptions['groundTexture'] = regl.texture(image);
                const renderer = this.layer.getRenderer();
                renderer.setToRedraw();
            }.bind(this);
        }
        return texture;
    }

    _pick(x, y, matrix, options = {}) {
        if (!this._picking) {
            return null;
        }
        if (this._needRefreshPicking) {
            const meshes = this._toAnalysisMeshes;
            const uniforms = {
                projViewMatrix: matrix.projViewMatrix
            };
            this._picking.render(meshes, uniforms, true);
            this._needRefreshPicking = false;
        }
        const { meshId, pickingId, point } = this._picking.pick(
            x,   // 屏幕坐标 x轴的值
            y,  // 屏幕坐标 y轴的值
            options.tolerance || 3,
            {
                'projViewMatrix' : matrix.projViewMatrix,
            },
            {
                viewMatrix : matrix.viewMatrix,
                projMatrix : matrix.projMatrix,
                returnPoint : true
            }
        );
        return { meshId, pickingId, point };
    }

    _getAltitude(x, y, matrix) {
        const map = this.layer.getMap();
        const dpr = map.getDevicePixelRatio();
        x = x * dpr, y = y * dpr;
        const picked = this._pick(x, y, matrix);
        const pickedPoint = picked && picked.point;
        if (pickedPoint) {
            const altitude = map.pointAtResToAltitude(pickedPoint[2], map.getGLRes());
            return altitude;
        }
        return 0;
    }

    update(name, value) {
        if (name === 'boundary') {
            const { extentMap, extentInWorld, extentPolygon } = this._calExtent(value);
            this._renderOptions['extent'] = extentInWorld;
            this._renderOptions['extentPolygon'] = extentPolygon;
            this._renderOptions['extentMap'] = extentMap;
            this._needRefreshPicking = true;
        } else if (name === 'textureUrl') {
            this._renderOptions['groundTexture'] = this._createGroundTexture(value);
            this._renderOptions['hasTexture'] = defined(value) ? 1 : 0;
        } else if (name === 'height') {
            const map = this.layer.getMap();
            this._renderOptions['height'] = map.altitudeToPoint(value || 0, map.getGLRes());
        } else {
            this._renderOptions[name] = value;
        }
        super.update(name, value);
    }

    getVolume() {
        this._needRefreshPicking = true;
        let volumes = 0;
        const map = this.layer.getMap();
        const { extentInContainerMax, extentInContainerMin, matrix } = this._calExtentInBoundary();
        const boundaryPolygon = this._getExtentPolygon();
        //以像素为单位，在挖方范围的外接矩形内逐一计算单位立方柱体积
        for (let x = extentInContainerMin.x; x < extentInContainerMax.x; x++) {
            for (let y = extentInContainerMax.y; y < extentInContainerMin.y; y++) {
                const cp = [x, y], cpx = [x + 1, y], cpy = [x, y + 1];
                const p = map.containerPointToCoordinate(new maptalks.Point(cp)), px = map.containerPointToCoordinate(new maptalks.Point(cpx)),
                      py = map.containerPointToCoordinate(new maptalks.Point(cpy));
                if (boundaryPolygon.containsPoint(p)) {
                    const cell = new maptalks.Polygon([[p.x, p.y], [px.x, px.y], [px.x, py.y], [py.x, py.y]]);
                    const area = cell.getArea();
                    const altitude = this._getAltitude(x, y, matrix);
                    const volume = area * (altitude - this.options['height'] || 0);
                    volumes += volume;
                }
            }
        }
        this._removeExtentPolygon();
        return volumes;
    }

    //计算挖方范围的外接矩形extent
    _calExtentInBoundary() {
        const map = this.layer.getMap();
        const extent = this._getExtentPolygon().getExtent();
        this._removeExtentPolygon();
        const precenter = map.getCenter();
        const prezoom = map.getZoom();
        const prepitch = map.getPitch();
        const prebearing = map.getBearing();
        const zoom = map.getFitZoom(extent) - 1;
        const center = extent.getCenter();
        map.setZoom(zoom);
        map.setCenter(center);
        map.setPitch(0);
        map.setBearing(0);
        const projViewMatrix = mat4.copy([], map.projViewMatrix);
        const viewMatrix = mat4.copy([], map.viewMatrix);
        const projMatrix = mat4.copy([], map.projMatrix);
        const extentInContainerMin = map.coordinateToContainerPoint(new maptalks.Coordinate(extent.xmin, extent.ymin));
        const extentInContainerMax = map.coordinateToContainerPoint(new maptalks.Coordinate(extent.xmax, extent.ymax));
        map.setZoom(prezoom);
        map.setCenter(precenter);
        map.setPitch(prepitch);
        map.setBearing(prebearing);
        return { extentInContainerMax, extentInContainerMin, matrix: { projViewMatrix, projMatrix, viewMatrix }};
    }

    _getExtentPolygon() {
        const map = this.layer.getMap();
        const boundary = this.options.boundary;
        const layer = map.getLayer('analysis-extent-layer') || new maptalks.VectorLayer('analysis-extent-layer').addTo(map);
        const polygon = new maptalks.Polygon(boundary, {
            symbol: {
                polygonOpacity: 0.2
            }
        }).addTo(layer);
        return polygon;
    }

    _removeExtentPolygon() {
        const map = this.layer.getMap();
        const layer = map.getLayer('analysis-extent-layer');
        if (layer) {
            layer.remove();
        }
    }

    _prepareRenderOptions() {
        const map = this.layer.getMap();
        const { extentMap, extentInWorld, extentPolygon } = this._calExtent(this.options.boundary);
        this._renderOptions = {};
        this._renderOptions['height'] = map.altitudeToPoint(this.options['height'] || 0, map.getGLRes());
        this._renderOptions['extent'] = extentInWorld;
        this._renderOptions['extentPolygon'] = extentPolygon;
        this._renderOptions['extentMap'] = extentMap;
        this._renderOptions['groundTexture'] = this._createGroundTexture(this.options['textureUrl']);
        this._renderOptions['hasTexture'] = defined(this.options['textureUrl']) ? 1 : 0;
        this._renderOptions['projViewMatrix'] = map.projViewMatrix;
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
        this._prepareRenderOptions();
        const excavateRenderer = new reshader.Renderer(renderer.regl);
        this._pass = this._pass || new ExcavatePass(excavateRenderer, viewport);
        this.layer.addAnalysis(this);
        this._preparePickingContext(renderer);
        renderer.setToRedraw();
    }

    renderAnalysis(meshes) {
        const uniforms = {};
        this._extentPass.render(this._extentMeshes, this._pvMatrix);
        this._updateDefines(meshes);
        const excavateMap =  this._pass.render(meshes, this._renderOptions);
        this._toAnalysisMeshes = meshes;
        uniforms['excavateMap'] = excavateMap;
        return uniforms;
    }

    _updateDefines(meshes) {
        meshes.forEach(mesh => {
            const material = mesh.getMaterial();
            const defines = mesh.getDefines();
            if (material.get('baseColorTexture')) {
                defines['HAS_MODELTEXTURE'] = 1;
            } else if (material.get('baseColorFactor')) {
                defines['HAS_BASECOLOR'] = 1;
            }
            mesh.setDefines(defines);
        });
    }

    _preparePickingContext(renderer) {
        this.pickingFBO = renderer.regl.framebuffer(renderer.canvas.width, renderer.canvas.height);
        this.renderer = new reshader.Renderer(renderer.regl);
        this._picking = new reshader.FBORayPicking(
            this.renderer,
            {
                vert : pickingVert,
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
            this.pickingFBO
        );
    }

    getDefines() {
        return {
            HAS_EXCAVATE: 1
        };
    }

    remove() {
        super.remove();
        if (this.pickingFBO) {
            this.pickingFBO.destroy();
            delete this.pickingFBO;
        }
        if (this._picking) {
            this._picking.dispose();
            delete this._picking;
        }
    }
}
