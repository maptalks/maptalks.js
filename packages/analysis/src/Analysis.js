import { reshader, mat4, quat, earcut } from '@maptalks/gl';
import { Class, Eventable, Handlerable, Polygon } from 'maptalks';
import ExtentPass from './pass/ExtentPass';
import { coordinateToWorld } from './common/Util';

export default class Analysis extends Eventable(Handlerable(Class)) {

    constructor(options) {
        super(options);
        this._enable = true;
    }

    addTo(layer) {
        const map = layer.getMap();
        if (map) {
            this.layer = layer;
            this._setAnalysisPass();
        } else {
            layer.once('add', () => {
                this.addTo(layer);
            }, this);
        }
        return this;
    }

    _setAnalysisPass() {
        const renderer = this.layer.getRenderer();
        if (renderer && renderer.device) {
            this.device = renderer.device;
            this._setPass(renderer);
        } else {
            this.layer.once('contextinit', e => {
                this.device = e.context.device;
                this._setPass(e.target.getRenderer());
            }, this);
        }
    }

    enable() {
        this._enable = true;
        const renderer = this.layer.getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
    }

    disable() {
        this._enable = false;
        const renderer = this.layer.getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
    }

    isEnable() {
        return this._enable;
    }

    remove() {
        if (this.layer) {
            const layer = this.layer;
            delete this.layer;
            layer.removeAnalysis(this);
            if (this._pass) {
                this._pass.dispose();
                delete this._pass;
            }
            if (this._extentPass) {
                this._extentPass.dispose();
                delete this._extentPass;
            }
            if (this._extentMeshes) {
                this._extentMeshes.forEach(mesh => {
                    mesh.geometry.dispose();
                    mesh.dispose();
                });
                delete this._extentMeshes;
            }
            if (this._picking) {
                this._picking.dispose();
                delete this._picking;
            }
        }
    }

    update(name, value) {
        this.options[name] = value;
        const renderer = this.layer.getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
    }

    getExcludeLayers() {
        return this.options.excludeLayers || [];
    }

    setExcludeLayers(layerIds) {
        this.options.excludeLayers = layerIds;
    }

    exportAnalysisMap(meshes) {
        if (!this.isEnable()) {
            return null;
        }
        let fbo = this._pass.render(meshes, this._renderOptions);
        fbo = fbo.meshesMap ? fbo.meshesMap : fbo;
        const renderer = this.layer.getRenderer();
        if (fbo && renderer) {
            const regl = renderer.device;
            const width = fbo.width, height = fbo.height;
            const data = new Uint8Array(4 * width * height);
            regl.read({
                data,
                x: 0, y: 0,
                framebuffer : fbo,
                width,
                height
            });
            return data;
        }
        return null;
    }

    getAnalysisType() {
        return this.type;
    }

    _calExtent(bound) {
        const polygon = new Polygon(bound, {
            symbol: {
                polygonOpacity: 0.2
            }
        });
        const extent = polygon.getExtent();
        return this._renderExtentMap(extent, bound);
    }

    _renderExtentMap(extent, boundary) {
        const map = this.layer.getMap();
        const precenter = map.getCenter();
        const prezoom = map.getZoom();
        const prepitch = map.getPitch();
        const prebearing = map.getBearing();
        const zoom = map.getFitZoom(extent);
        const center = extent.getCenter();
        map.setZoom(zoom);
        map.setCenter(center);
        map.setPitch(0);
        map.setBearing(0);
        const mapExtent = map.getExtent();
        this._pvMatrix = this._pvMatrix || [];
        mat4.copy(this._pvMatrix, map.projViewMatrix);
        const pointMin = coordinateToWorld(map, mapExtent.xmin, mapExtent.ymin);
        const pointMax = coordinateToWorld(map, mapExtent.xmax, mapExtent.ymax);
        const extentInWorld = [pointMin[0], pointMin[1], pointMax[0], pointMax[1]];
        const extentPointMin = coordinateToWorld(map, extent.xmin, extent.ymin);
        const extentPointMax = coordinateToWorld(map, extent.xmax, extent.ymax);
        const extentPolygon = [extentPointMin[0], extentPointMin[1], extentPointMax[0], extentPointMax[1]];
        map.setZoom(prezoom);
        map.setCenter(precenter);
        map.setPitch(prepitch);
        map.setBearing(prebearing);
        this._extentMeshes = this._createBoundaryMesh(boundary, center);
        if (!this._extentPass) {
            const extentRenderer = new reshader.Renderer(this.device);
            this._extentPass = new ExtentPass(extentRenderer, this._viewport);
        }
        const extentMap = this._extentPass.render(this._extentMeshes, this._pvMatrix);
        return { extentMap, extentInWorld, extentPolygon };
    }


    _createBoundaryMesh(boundary,center) {
        const pos = [];
        const map = this.layer.getMap();
        const centerPos = coordinateToWorld(map, center.x, center.y, 0);
        for (let i = 0; i < boundary.length; i++) {
            const point = coordinateToWorld(map, ...boundary[i]);
            pos.push(point[0] - centerPos[0]);
            pos.push(point[1] - centerPos[1]);
            pos.push(0);
        }
        const triangles = earcut(pos, null, 3);
        if (this._extentMeshes) {
            this._extentMeshes[0].geometry.dispose();
            this._extentMeshes[0].dispose();
        }
        const geometry = new reshader.Geometry({
            POSITION: pos
        },
        triangles,
        0,
        {
            positionAttribute: 'POSITION'
        });
        geometry.generateBuffers(this.device);
        const mesh = new reshader.Mesh(geometry);
        const mMatrix = mat4.fromRotationTranslationScale([], quat.identity([]), centerPos, [1, 1, 1]);
        mesh.localTransform = mMatrix;
        this._extentMeshes = [mesh];
        return this._extentMeshes;
    }
}
