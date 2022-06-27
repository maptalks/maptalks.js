import { reshader, mat4 } from '@maptalks/gl';
import * as maptalks from 'maptalks';
import { coordinateToWorld } from './common/Util';
import Analysis from './Analysis';
import ExcavatePass from './pass/ExcavatePass';
import ExcavateExtentPass from './pass/ExcaveteExtentPass';
import earcut from 'earcut';

export default class ExcavateAnalysis extends Analysis {
    constructor(options) {
        super(options);
        this.type = 'excavate';
    }

    addTo(layer) {
        super.addTo(layer);
        const renderer = this.layer.getRenderer();
        this.regl = renderer.regl;
        if (renderer) {
            this._setExcavatePass(renderer);
        } else {
            this.layer.once('renderercreate', e => {
                this._setExcavatePass(e.renderer);
            }, this);
        }
        const map = this.layer.getMap();
        this._renderOptions = {};
        const extent = this._calExtent(this.options.boundary);
        const { extentMap, extentInWorld, extentPolygon } = this._renderExtentMap(extent);
        this._renderOptions['extent'] = extentInWorld;
        this._renderOptions['extentPolygon'] = extentPolygon;
        this._renderOptions['extentMap'] = extentMap;
        this._renderOptions['groundTexture'] = this._createGroundTexture();
        this._renderOptions['projViewMatrix'] = map.projViewMatrix;
        return this;
    }

    _createGroundTexture() {
        const textureUrl = this.options['textureUrl'];
        const image = new Image();
        image.src = textureUrl;
        const regl = this.regl;
        const texture = regl.texture({width: 2, height: 2});
        image.onload = function() {
            this._renderOptions['groundTexture'] = regl.texture(image);
        }.bind(this);
        return texture;
    }

    _calExtent(bound) {
        const map = this.layer.getMap();
        const layer = map.getLayer('v') || new maptalks.VectorLayer('v').addTo(map);
        const polygon = new maptalks.Polygon(bound, {
            symbol: {
                polygonOpacity: 0.2
            }
        }).addTo(layer);
        const extent = polygon.getExtent();
        layer.remove();
        return extent;
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

    _setExcavatePass(renderer) {
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
        const excavateRenderer = new reshader.Renderer(renderer.regl);
        this._pass = this._pass || new ExcavatePass(excavateRenderer, viewport);
        this.layer.addAnalysis(this);
        renderer.setToRedraw();
    }

    _renderExtentMap(extent) {
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
        this._pvMatrix = mat4.copy([], map.projViewMatrix);
        const pointMin = coordinateToWorld(map, [mapExtent.xmin, mapExtent.ymin]);
        const pointMax = coordinateToWorld(map, [mapExtent.xmax, mapExtent.ymax]);
        const extentInWorld = [pointMin[0], pointMin[1], pointMax[0], pointMax[1]];
        const extentPointMin = coordinateToWorld(map, [extent.xmin, extent.ymin]);
        const extentPointMax = coordinateToWorld(map, [extent.xmax, extent.ymax]);
        const extentPolygon = [extentPointMin[0], extentPointMin[1], extentPointMax[0], extentPointMax[1]];
        map.setZoom(prezoom);
        map.setCenter(precenter);
        map.setPitch(prepitch);
        map.setPitch(prebearing);

        const extentRenderer = new reshader.Renderer(this.regl);
        this._extentMeshes = this._createBoundaryMesh(this.options['boundary']);
        this._extentPass = this._extentPass || new ExcavateExtentPass(extentRenderer, this._viewport);
        const extentMap = this._extentPass.render(this._extentMeshes, this._pvMatrix);
        return { extentMap, extentInWorld, extentPolygon };
    }

    _createBoundaryMesh(boundary) {
        const pos = [];
        const map = this.layer.getMap();
        for (let i = 0; i < boundary.length; i++) {
            const point = coordinateToWorld(map, boundary[i]);
            pos.push(point[0]);
            pos.push(point[1]);
            pos.push(0);
        }
        const triangles = earcut(pos, null, 3);
        const geometry = new reshader.Geometry({
            POSITION: pos
        },
        triangles,
        0,
        {
            positionAttribute: 'POSITION'
        });
        const mesh = new reshader.Mesh(geometry);
        return [mesh];
    }

    renderAnalysis(meshes) {
        const uniforms = {};
        this._extentPass.render(this._extentMeshes, this._pvMatrix);
        const excavateMap =  this._pass.render(meshes, this._renderOptions);
        uniforms['excavateMap'] = excavateMap;
        return uniforms;
    }

    getDefines() {
        return {
            HAS_EXCAVATE: 1
        };
    }

    remove() {
        super.remove();
        if (this._insightPass) {
            this._insightPass.dispose();
        }
    }
}
