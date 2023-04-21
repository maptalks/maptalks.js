
import GLTFMarker from './GLTFMarker';
import { Coordinate } from 'maptalks';
import { mat4, vec3, quat } from '@maptalks/gl';
import { coordinateToWorld, defined } from './common/Util';
// The structure of MultiGLTFMarker will like below:
// new MultiGLTFMarker([{
//     coordinates:[]
//     translation :[],
//     rotation:[],
//     scale:[],
//     color : [1,1,1,1],
// }, ...], {
//     symbol :{
//         url : '',
//         speed :1,
//         uniforms : {

//         }
//     },
//     properties : [{
//            foo : 'value'
//         },...
//     ]
// })
const DEFAULT_COLOR = [1.0, 1.0, 1.0, 1.0], EMPTY_VEC = [], EMPTY_QUAT = [], DEFAULT_SCALE = [1, 1, 1], COORD = function() {
    return new Coordinate(0, 0);
}();
export default class MultiGLTFMarker extends GLTFMarker {
    constructor(data, options) {
        super(null, options);
        this._data = data;
        this._attributeMatrixs = [];
        this._centerPosition = [0, 0, 0];
        this._centerMatrix = mat4.identity([]);
        this._type = 'multigltfmarker';
    }

    static fromJSON(json) {
        return new MultiGLTFMarker(json.data, json.options);
    }

    //支持数组[x, y]和maptalks.Coordinate两种形式
    setCoordinates(coordinates) {
        if (Array.isArray(coordinates[0])) {
            this._coordinates = coordinates.map(coord => {
                return new Coordinate(coord);
            });
        } else {
            this._coordinates = coordinates;
        }
        this.updateAllData('coordinates', this._coordinates);
        this._dirty = true;
        return this;
    }

    getCoordinates(e) {
        if (e && this._data && this._data.length) {
            const index = e.index;
            return this._data[index].coordinates;
        }
        return null;
    }

    //增
    addData(item) {
        this._data.push(item);
        const layer = this.getLayer();
        if (layer) {
            layer._updateMarkerMap();
        }
        this._dirty = true;
        return this;
    }

    //删
    removeData(index) {
        this._data.splice(index, 1);
        if (this._updateAttributeMatrix) {
            this._attributeMatrixs.splice(index, 1);
        }
        this._dirty = true;
        return this;
    }

    //查
    getData(idx) {
        return this._data[idx];
    }

    //改
    updateData(idx, name, value) {
        this._data[idx][name] = value;
        this._dirty = true;
        return this;
    }

    updateAllData(name, value) {
        for (let i = 0; i < this._data.length; i++) {
            this.updateData(i, name, value[i]);
        }
        return this;
    }

    _updateAttributeMatrix() {
        const map = this.getMap();
        if (!this._data || !map) {
            return;
        }
        this._calCenter();
        this._attributeMatrixs = this._attributeMatrixs || [];
        for (let i = 0; i < this._data.length; i++) {
            const modelMatrix = this._updateItemAttributeMatrix(i);
            this._attributeMatrixs[i] = modelMatrix;
        }
    }

    openInfoWindow(index) {
        let coordinate = null;
        if (defined(index) && this._data[index]) {
            coordinate = this._data[index].coordinates;
        } else {
            coordinate = this.getCenter();
        }
        super.openInfoWindow(coordinate);
    }

    getCenter() {
        let sumX = 0,
            sumY = 0,
            counter = 0;
        for (let i = 0, l = this._data.length; i < l; i++) {
            const coordinate = this._data[i].coordinates;
            sumX += coordinate.x;
            sumY += coordinate.y;
            counter++;
        }
        if (counter === 0) {
            return null;
        }
        const center = COORD.set(sumX / counter, sumY / counter);
        return center;
    }

    _calCenter() {
        const map = this.getMap();
        const center = this.getCenter();
        this._centerPosition = coordinateToWorld(map, center);
        const eluerQuat = quat.fromEuler(EMPTY_QUAT, 0, 0, 0);
        mat4.fromRotationTranslationScale(this._centerMatrix, eluerQuat, this._centerPosition, DEFAULT_SCALE);
    }

    _updateItemAttributeMatrix(idx) {
        const data = this._data[idx];
        const position = this._getPosition(data.coordinates);
        if (!position) {
            return;
        }
        const map = this.getMap();
        position[2] = map.altitudeToPoint(data.coordinates.z, map.getGLRes());
        const sub = vec3.sub(EMPTY_VEC, position, this._centerPosition);
        const trans = this._translationToWorldPoint(data['translation'] || this._defaultTRS.translation);
        const translation = vec3.add(EMPTY_VEC, trans || this._defaultTRS.translation, sub || this._defaultTRS.translation);
        const rotation = data['rotation'] || this._defaultTRS.rotation;
        const scale = data['scale'] || this._defaultTRS.scale;
        const eluerQuat = quat.fromEuler(EMPTY_QUAT, rotation[0] || 0, rotation[1] || 0, rotation[2] || 0);
        const modelMatrix = mat4.fromRotationTranslationScale(this._attributeMatrixs[idx] || [], eluerQuat, translation, scale);
        return modelMatrix;
    }

    _updateMatrix() {
        super._updateMatrix();
        this._updateAttributeMatrix();
    }

    _updateInstanceAttributesData() {
        if (!this._attributesData || this._attributesData['instance_vectorA'].length / 4 !== this._attributeMatrixs.length) {
            this._attributesData = {
                'instance_vectorA' : [],
                'instance_vectorB' : [],
                'instance_vectorC' : [],
                'instance_color' : [],
                'aPickingId' : [],
                'aOutline': []
            };
        }
        for (let i = 0; i < this._attributeMatrixs.length; i++) {
            // const matrix = mat4.multiply(EMPTY_MAT, this._attributeMatrixs[i], localTransform);
            const matrix = this._attributeMatrixs[i];
            this._setDataForAttributes('instance_vectorA', i, matrix, 0);
            this._setDataForAttributes('instance_vectorB', i, matrix, 1);
            this._setDataForAttributes('instance_vectorC', i, matrix, 2);
            const color = this._data[i]['color'] || DEFAULT_COLOR;
            this._attributesData['instance_color'][i * 4] = color[0];
            this._attributesData['instance_color'][i * 4 + 1] = color[1];
            this._attributesData['instance_color'][i * 4 + 2] = color[2];
            this._attributesData['instance_color'][i * 4 + 3] = color[3];
            this._attributesData['aPickingId'][i] = this._getPickingId() + i;
            this._attributesData['aOutline'][i] = this._data[i]['outline'] ? 1 : 0;
        }
        return this._attributesData;
    }

    _updateInstancedMeshData(mesh) {
        const attributes = this._getInstanceAttributesData();
        for (const key in attributes) {
            mesh.updateInstancedData(key, attributes[key]);
        }
        if (this.regl) {
            mesh.generateInstancedBuffers(this.regl);
        } else {
            this._noBuffersMeshes = this._noBuffersMeshes || [];
            this._noBuffersMeshes.push(mesh);
        }
        mesh.instanceCount = this.getCount();
    }

    _setDataForAttributes(name, idx, matrix, col) {
        if (!this._attributesData[name] || !matrix) {
            return;
        }
        this._attributesData[name][idx * 4] = matrix[col];
        this._attributesData[name][idx * 4 + 1] = matrix[col + 4];
        this._attributesData[name][idx * 4 + 2] = matrix[col + 8];
        this._attributesData[name][idx * 4 + 3] = matrix[col + 12];
    }

    _getInstanceAttributesData(localTransform) {
        if (!this._dirty &&  this._attributesData) {
            return this._attributesData;
        }
        //每次拿取instanceData前，先更新数据
        return this._updateInstanceAttributesData(localTransform);
    }

    _getCenterMatrix() {
        return this._centerMatrix;
    }

    getCount() {
        return this._data.length;
    }

    toJSON() {
        const json = JSON.parse(JSON.stringify({
            data : this._data,
            options: this.options
        }));
        const properties = this.getProperties();
        if (json.options) {
            json.options['properties'] = properties;
        }
        return json;
    }

    getIndexByPickingId(pickingId) {
        return pickingId - this._getPickingId();
    }

    outline(idx) {
        if (defined(idx)) {
            this.updateData(idx, 'outline', true);
        }
        return this;
    }

    cancelOutline(idx) {
        if (defined(idx)) {
            this.updateData(idx, 'outline', false);
        }
        return this;
    }

    isOutline() {
        if (!this._data || !this._data.length) {
            return false;
        }
        for (let i = 0; i < this._data.length; i++) {
            if (this._data[i].outline) {
                return true;
            }
        }
        return false;
    }
}
