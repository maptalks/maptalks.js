import { Coordinate, Polygon, Point } from "maptalks";
import * as reshader from '@maptalks/reshader.gl';
import { mat4, quat } from '@maptalks/reshader.gl';
import { earcut } from '@maptalks/reshader.gl';
import { coordinateToWorld, normalizeColor, isNumber } from "../util/util";

const MASK_MODES = {
    'clip-inside': 0.1, 'clip-outside': 0.2, 'flat-inside': 0.3, 'flat-outside': 0.4, 'color': 0.5, 'video': 0.6, 'elevate': 0.7
};
const QUAT = [], SCALE = [1, 1, 1];
const DEFAULT_SYMBOL = {
    polygonFill: [255, 0, 0],
    polygonOpacity: 0.8
};
const TRIANGLE_POINT_A = new Coordinate(0, 0), TRIANGLE_POINT_B = new Coordinate(0, 0), TRIANGLE = [];
const TEMP_COORD = new Coordinate(0, 0), TEMP_POINT0 = new Point(0, 0), TEMP_POINT1 = new Point(0, 0), TEMP_POINT2 = new Point(0, 0);
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
        this._dispose();
        super.remove();
        return this;
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
        const dimension = data.dimensions;
        for (let ii = 0; ii < data.vertices.length; ii += dimension) {
            TEMP_COORD.x = data.vertices[ii];
            TEMP_COORD.y = data.vertices[ii + 1];
            const point = coordinateToWorld(map, TEMP_COORD);
            data.vertices[ii] = point[0];
            data.vertices[ii + 1] = point[1];
        }
        const centerPos = coordinateToWorld(map, this.getCenter());
        const pos = [];
        const idx = this.getLayer().getMasks().indexOf(this);
        const heightOffset = idx * 0.01;
        const len = this.getMode() === 'video' ? 4 : data.vertices.length / dimension;
        for (let i = 0; i < len; i++) {
            pos.push(data.vertices[i * dimension] - centerPos[0]);
            pos.push(data.vertices[i * dimension + 1] - centerPos[1]);
            pos.push(heightOffset);
        }
        const triangles = earcut(pos, data.holes, 3);
        const geometry = new reshader.Geometry({
            POSITION: pos,
            TEXCOORD: this._createTexcoords(data.vertices, dimension)
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

    _createTexcoords(vertices, dimension) {
        const texcoords = [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0];
        if (this.hasHoles()) {
            const count = vertices.length / dimension * 2;
            for (let i = texcoords.length / 2 - 1; i < count; i += 2) {
                texcoords[i] = texcoords[i + 1] = 0.0;
            }
        }
        return texcoords;
    }

    clearMesh() {
        this._dispose();
        delete this._mesh;
        if (this.maskGeoJSON) {
            this.maskGeoJSON = null;
        }
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
        const mMatrix = mat4.fromRotationTranslationScale(mesh.localTransform, quat.identity(QUAT), centerPos, SCALE);
        mesh.localTransform = mMatrix;
    }

    _dispose() {
        if (!this._mesh) {
            return;
        }
        if (this._mesh.material) {
            this._mesh.material.dispose();
        }
        if (this._mesh.geometry) {
            this._mesh.geometry.dispose();
        }
        this._mesh.dispose();
        delete this._mesh;
    }

    containsPoint(coordinate) {
        const extent = this.getExtent();
        TEMP_COORD.set(coordinate[0], coordinate[1]);
        if (!extent || !extent.contains(TEMP_COORD)) {
            return false;
        }
        const holes = this.getHoles();
        for (let i = 0; i < holes.length; i++) {
            if (this._contains(holes[i], coordinate)) {
                return false;
            }
        }
        const coordinates = this.getShell();
        return this._contains(coordinates, coordinate);
    }

    _contains(coordinates, coordinate) {
        const area = this._calArea(coordinates);
        let totalArea = 0;
        for (let i = 0; i < coordinates.length; i++) {
            TRIANGLE_POINT_A.x = coordinates[i].x;
            TRIANGLE_POINT_A.y = coordinates[i].y;
            const index = i + 1 >= coordinates.length ? 0 : i + 1;
            TRIANGLE_POINT_B.x = coordinates[index].x;
            TRIANGLE_POINT_B.y = coordinates[index].y;
            TEMP_COORD.x = coordinate[0];
            TEMP_COORD.y = coordinate[1];
            TRIANGLE[0] = TEMP_COORD;
            TRIANGLE[1] = TRIANGLE_POINT_A;
            TRIANGLE[2] = TRIANGLE_POINT_B;
            const area = this._calArea(TRIANGLE);
            totalArea += area;
        }
        if (Math.abs(totalArea - area) > 1e-8) {
            return false;
        }
        return true;
    }

    _calArea(coordinates) {
        const map = this.getMap();
        let area = 0;
        const glRes = map.getGLRes();
        const point0 = map.coordToPointAtRes(coordinates[0], glRes, TEMP_POINT0);
        for (let i = 1; i < coordinates.length - 1; i++) {
            const point1 = map.coordToPointAtRes(coordinates[i], glRes, TEMP_POINT1);
            const point2 = map.coordToPointAtRes(coordinates[i + 1], glRes, TEMP_POINT2);
            area += det(point0, point1, point2) / 2;
        }
        return area;
    }
}

//叉乘
function det(p0, p1, p2) {
    return (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);
}
