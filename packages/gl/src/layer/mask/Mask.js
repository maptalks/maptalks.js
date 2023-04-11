import { Coordinate, Polygon } from "maptalks";
import * as reshader from '@maptalks/reshader.gl';
import { mat4, quat } from 'gl-matrix';
import earcut from 'earcut';
import { coordinateToWorld, normalizeColor, isNumber } from "../util/util";

const MASK_MODES = {
    'clip-inside': 0.1, 'clip-outside': 0.2, 'flat-inside': 0.3, 'flat-outside': 0.4, 'color': 0.5, 'video': 0.6
};
const MAT = [], QUAT = [], SCALE = [1, 1, 1];
const DEFAULT_SYMBOL = {
    polygonFill: [255, 0, 0],
    polygonOpacity: 0.8
};
const TEMP_COORD = new Coordinate(0, 0);
export default class Mask extends Polygon {
    getMode() {
        return this._mode;
    }

    remove() {
        const layer = this.getLayer();
        if (!layer) {
            return this;
        }
        layer.removeMask(this);
        this['_fireEvent']('remove');
        this._dispose();
        delete this._layer;
    }

    getMesh(regl, ratio, minHeight) {
        if (!this.isVisible()) {
            return null;
        }
        if (!this._mesh) {
            this._mesh = this._createMesh(regl, ratio, minHeight);
        }
        this._updateUniforms(this._mesh, ratio, minHeight);
        return this._mesh;
    }

    _createGeometry(regl) {
        const map = this.getMap();
        const geojson = this.toGeoJSON();
        const data = earcut.flatten(geojson.geometry.coordinates);
        for (let ii = 0; ii < data.vertices.length; ii += 2) {
            TEMP_COORD.x = data.vertices[ii];
            TEMP_COORD.y = data.vertices[ii + 1];
            const point = coordinateToWorld(map, TEMP_COORD);
            data.vertices[ii] = point[0];
            data.vertices[ii + 1] = point[1];
        }
        const centerPos = coordinateToWorld(map, this.getCenter());
        const pos = [];
        const len = this.getMode() === 'video' ? 4 : data.vertices.length / 2;
        for (let i = 0; i < len; i++) {
            pos.push(data.vertices[i * 2] - centerPos[0]);
            pos.push(data.vertices[i * 2 + 1] - centerPos[1]);
            pos.push(0);
        }
        const triangles = earcut(pos, data.holes, 3);
        const geometry = new reshader.Geometry({
            POSITION: pos,
            TEXCOORD: this._createTexcoords(data.vertices)
        },
        triangles,
        0,
        {
            positionAttribute: 'POSITION',
            uv0Attribute: 'TEXCOORD'
        });
        geometry.generateBuffers(regl);
        return geometry;
    }

    _createTexcoords(vertices) {
        const texcoords = [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0];
        if (this.hasHoles()) {
            for (let i = texcoords.length / 2 - 1; i < vertices.length; i += 2) {
                texcoords[i] = texcoords[i + 1] = 0.0;
            }
        }
        return texcoords;
    }

    _updateShape() {
        this._dispose();
        delete this._mesh;
    }

    _getMaskMode() {
        return MASK_MODES[this._mode];
    }

    _getMaskColor() {
        const symbol = this.getSymbol();
        const { polygonFill, polygonOpacity } = symbol || DEFAULT_SYMBOL;
        const maskColor = normalizeColor([], polygonFill);
        maskColor[0] /= 255;
        maskColor[1] /= 255;
        maskColor[2] /= 255;
        maskColor[3] = isNumber(polygonOpacity) ? polygonOpacity : DEFAULT_SYMBOL.polygonOpacity;
        return maskColor;
    }

    _altitudeToPoint(altitude = 0) {
        const map = this.getMap();
        const res = map.getGLRes();
        return map.altitudeToPoint(altitude, res);
    }

    _setLocalTransform(mesh) {
        const map = this.getMap();
        const centerPos = coordinateToWorld(map, this.getCenter());
        const mMatrix = mat4.fromRotationTranslationScale(MAT, quat.identity(QUAT), centerPos, SCALE);
        mesh.localTransform = mMatrix;
    }

    _dispose() {
        if (!this._mesh) {
            return; 
        }
        if (this._mesh.material) {
            this._mesh.material.dispose();
        }
        this._mesh.geometry.dispose();
        this._mesh.dispose();
    }
}