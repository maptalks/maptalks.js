import { reshader, mat4, vec4 } from '@maptalks/gl';
import { Util } from '@maptalks/map';
import HeightmapPass from './pass/HeightmapPass';
import { coordinateToWorld, altitudeToDistance } from './common/Util';
import { ExtrudePolygonLayer } from '@maptalks/vt';

const ExtrudePolygonLayerRenderer = ExtrudePolygonLayer.getRendererClass('gl');
export default class ExcavateRenderer extends ExtrudePolygonLayerRenderer {

    draw(timestamp, context) {
        if (!this.layer.getExcavatedLayers() || !this.layer.isEnable()) {
            return;
        }
        this._renderUniforms();
        super.draw(timestamp, context);
    }

    _renderUniforms() {
        if (!this._pvMatrix || !this._excavateExtent) {
            this._updateExtentMatrix();
        }
        this._heightmap = this._heightmap || this._updateHeightMap();
        const map = this.getMap();
        const meshes = this.meshes;
        if (!meshes || !this._heightmap) {
            return;
        }
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            const defines = mesh.getDefines();
            defines['HAS_EXCAVATE_ANALYSIS'] = 1;
            mesh.setDefines(defines);
            mesh.setUniform('heightmap', this._heightmap);
            mesh.setUniform('excavateExtent', this._excavateExtent);
            mesh.setUniform('excavateHeight', altitudeToDistance(map, this.options['height']));
        }
        this.setToRedraw();
    }

    _updateHeightMap() {
        const excavatedLayers = this.layer.getExcavatedLayers();
        this._toExcavateMeshes = [];
        for (let i = 0; i < excavatedLayers.length; i++) {
            const excavatedLayer = excavatedLayers[i];
            const excavateLayerRenderer = excavatedLayer.getRenderer();
            if (!excavateLayerRenderer.getAnalysisMeshes) {
                continue;
            }
            const meshes = excavateLayerRenderer.getAnalysisMeshes();
            Util.pushIn(this._toExcavateMeshes, meshes);
        }
        if (!this._toExcavateMeshes.length) {
            return null;
        }
        this._pass = this._pass || this._setPass();
        const heightmap = this._pass.render(this._toExcavateMeshes, this._pvMatrix);
        return heightmap;
    }

    _updateExtentMatrix() {
        const map = this.layer.getMap();
        const extent = this.layer.getExtent();
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
        this._excavateExtent = vec4.set(this._excavateExtent || [], pointMin[0], pointMin[1], pointMax[0], pointMax[1]);
        map.setZoom(prezoom);
        map.setCenter(precenter);
        map.setPitch(prepitch);
        map.setBearing(prebearing);
    }

    _setPass() {
        this._viewport = {
            x : 0,
            y : 0,
            width : () => {
                return this.canvas ? this.canvas.width : 1;
            },
            height : () => {
                return this.canvas ? this.canvas.height : 1;
            }
        };
        const heightMapRenderer = new reshader.Renderer(this.regl);
        this._pass = this._pass || new HeightmapPass(heightMapRenderer, this._viewport);
        return this._pass;
    }

    _onGeometryUpdate() {
        this._updateExtentMatrix();
        this.setToRedraw();
    }

    onGeometryAdd(geometries) {
        super.onGeometryAdd(geometries);
        this._onGeometryUpdate();
    }

    onGeometryRemove() {
        super.onGeometryRemove();
        this._onGeometryUpdate();
    }

    remove() {
        super.remove();
        if (this._pass) {
            this._pass.dispose();
        }
    }
}
