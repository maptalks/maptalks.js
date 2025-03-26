import MultiGLTFMarker from "./MultiGLTFMarker";
import { Coordinate, Util } from "maptalks";
import { vec3 } from '@maptalks/gl';

const options = {
    direction: 0, //指定模型拉伸方向, 0, 1, 2分别代表x,y,z轴
    gapLength: 0,
    scaleVertex: true
};
const TEMP_VEC = [];

export default class GLTFLineString extends MultiGLTFMarker {
    constructor(coordinates, options) {
        super(null, options);
        this.on('load', () => {
            this.setCoordinates(coordinates);
        });
    }

    static fromJSON(json) {
        return new GLTFLineString(json.data, json.options);
    }

    setCoordinates(coordinates) {
        this._coordinates = coordinates;
        this._updateData();
    }

    getCoordinates() {
        return this._coordinates;
    }

    toJSON() {
        const json = JSON.parse(JSON.stringify({
            coordinates : this._coordinates,
            options: this.options,
            type: 'GLTFLineString'
        }));
        const id = this.getId();
        if (!Util.isNil(id)) {
            json.options['id'] = id;
        }
        const properties = this.getProperties();
        if (json.options) {
            json.options['properties'] = properties;
        }
        return json;
    }

    _updateData() {
        const coordinates = this._coordinates;
        if (!coordinates) {
            return;
        }
        this.removeAllData();
        for (let i = 0; i < coordinates.length - 1; i++) {
            const from = this._toCoordinate(coordinates[i]), to = this._toCoordinate(coordinates[i + 1]);
            const dataArr = this._generateData(from, to);
            dataArr.forEach(item => {
                this.addData(item);
            });
        }
        this._dirty = true;
    }

    _generateData(from, to) {
        const items = [];
        const map = this.getMap();
        if (!map || !this.isLoaded()) {
            return items;
        }
        const dist = map.getProjection().measureLenBetween(from, to);
        const boxWidth = this._calBoxWidth(from, to);
        const times = Math.floor(dist / boxWidth);
        const rotationZ = this._getRotation(from, to);
        //取余缩放
        if (times >= 1) {
            for (let i = 1; i <= times; i++) {
                const t = boxWidth * (i - 0.5) / dist;
                const item = {
                    coordinates: this._calItemCenter(from, to, t),
                    scale: [1, 1, 1],
                    rotation: [0, 0, rotationZ]
                }
                items.push(item);
            }
            //尾巴
            if (this.options['scaleVertex']) {
                const t = (boxWidth * times + (dist - boxWidth * times) / 2) / dist;
                const scale = (dist - boxWidth * times) / boxWidth;
                const item = {
                    coordinates: this._calItemCenter(from, to, t),
                    scale: [scale, 1, 1],
                    rotation: [0, 0, rotationZ]
                }
                items.push(item);
            }
        } else if (this.options['scaleVertex']) {
            const scale = dist / boxWidth;
            const item = {
                coordinates: this._calItemCenter(from, to, 0.5),
                scale: [scale, 1, 1],
                rotation: [0, 0, rotationZ]
            }
            items.push(item);
        }
        return items;
    }

    _calItemCenter(from, to, t) {
        const x = lerp(from.x, to.x, t);
        const y = lerp(from.y, to.y, t);
        const z1 = from.z || 0;
        const z2 = to.z || 0;
        const z = lerp(z1, z2, t);
        return new Coordinate(x, y, z);
    }

    _calBoxWidth(from, to) {
        const map = this.getMap();
        const glRes = map.getGLRes();
        const center = new Coordinate(0, (from.y + to.y) / 2);
        const ratio = map.altitudeToPoint(100, glRes, center) / map.altitudeToPoint(100, glRes);
        const gltfmodelBBox = this.getGLTFBBox();
        const direction = this.options.direction || 0;
        const scale = [1, 1, 1];
        const modelHeight = this.getModelHeight();
        if (modelHeight) {
            this._calModelHeightScale(scale, modelHeight);
        } else {
            const symbol = this.getSymbol();
            vec3.set(scale, symbol.scaleX || 1, symbol.scaleY || 1, symbol.scaleZ || 1);
        }
        const boxExtent = vec3.sub(TEMP_VEC, gltfmodelBBox.max, gltfmodelBBox.min);
        vec3.multiply(boxExtent, boxExtent, scale);
        const gapLength = this.options['gapLength'];
        return boxExtent[direction] / ratio + gapLength;
    }

    _getRotation(from, to) {
        const map = this.getMap();
        const res = map.getGLRes();
        const vp = map.coordinateToPointAtRes(from, res);
        const vp1 = map.coordinateToPointAtRes(to, res);
        const degree = Util.computeDegree(
            vp1.x, vp1.y,
            vp.x, vp.y
        );
        return degree / Math.PI * 180;
    }

    _toCoordinate(coord) {
        if (Array.isArray(coord)) {
            return new Coordinate(coord);
        }
        return coord;
    }
}

function lerp(a, b, t) {
    return a + t * (b - a);
}

GLTFLineString.mergeOptions(options);
GLTFLineString.registerJSONType('GLTFLineString');
