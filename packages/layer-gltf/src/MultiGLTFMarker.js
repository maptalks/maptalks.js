
import GLTFMarker from './GLTFMarker';
import { Coordinate } from 'maptalks';
import { mat4, vec3, quat, reshader } from '@maptalks/gl';
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
const TEMP_FIXSIZE_SCALE = [1, 1, 1];
const defaultColor = [1, 1, 1];
const defaultOpacity = 1;
export default class MultiGLTFMarker extends GLTFMarker {
    constructor(data, options) {
        super(null, options);
        this._data = data || [];
        this._attributeMatrixs = [];
        this._centerPosition = [0, 0, 0];
        this._centerMatrix = mat4.identity([]);
        this._type = 'multigltfmarker';
        this._bloomMeshes = [];
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
        if (!this._data) {
            this._data = [];
        }
        this._data.push(item);
        this._dirty = true;
        return this;
    }

    //删
    removeData(index) {
        this._data.splice(index, 1);
        if (this._attributeMatrixs) {
            this._attributeMatrixs.splice(index, 1);
        }
        const layer = this.getLayer();
        if (layer) {
            layer._updateMarkerMap();
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

    getAllData() {
        return this._data;
    }

    updateAllData(name, value) {
        for (let i = 0; i < this._data.length; i++) {
            this.updateData(i, name, value[i]);
        }
        return this;
    }

    removeAllData() {
        if (!this._data) {
            return;
        }
        this._data = [];
        this._attributeMatrixs = [];
        this._dirty = true;
    }

    _updateAttributeMatrix() {
        const map = this.getMap();
        if (!this._data || !map) {
            return;
        }
        this._calCenter();
        this._attributeMatrixs = this._attributeMatrixs || [];
        for (let i = 0; i < this._data.length; i++) {
            if (this._data[i].visible !== false) {
                const modelMatrix = this._updateItemAttributeMatrix(i);
                this._attributeMatrixs[i] = modelMatrix;
            }
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
            sumZ = 0,
            counter = 0;
        for (let i = 0, l = this._data.length; i < l; i++) {
            let coordinate = this._data[i].coordinates;
            if (coordinate instanceof Coordinate) {
                coordinate = coordinate.toArray();
            }
            sumX += coordinate[0];
            sumY += coordinate[1];
            sumZ += coordinate[2] || 0;
            counter++;
        }
        if (counter === 0) {
            return null;
        }
        const center = COORD.set(sumX / counter, sumY / counter, sumZ / counter);
        return center;
    }

    getMap() {
        const map = super.getMap();
        return map || (this._layer && this._layer.getMap());
    }

    _setLayer(layer) {
        this._layer = layer;
    }

    getLayer() {
        return super.getLayer() || this._layer;
    }

    _calCenter() {
        const map = this.getMap();
        const center = this.getCenter();
        if (!center) {
            return;
        }
        this._centerPosition = coordinateToWorld(map, center);
        const eluerQuat = quat.fromEuler(EMPTY_QUAT, 0, 0, 0);
        mat4.fromRotationTranslationScale(this._centerMatrix, eluerQuat, this._centerPosition, DEFAULT_SCALE);
    }

    _updateItemAttributeMatrix(idx) {
        const data = this._data[idx];
        const position = this._getPosition(data.coordinates);
        if (!position) {
            return null;
        }
        const sub = vec3.sub(EMPTY_VEC, position, this._centerPosition);
        const trans = this._translationToWorldPoint(data['translation'] || this._defaultTRS.translation);
        const translation = vec3.add(EMPTY_VEC, trans || this._defaultTRS.translation, sub || this._defaultTRS.translation);
        const rotation = data['rotation'] || this._defaultTRS.rotation;
        const scale = this._getDataItemScale(idx);
        const eluerQuat = quat.fromEuler(EMPTY_QUAT, rotation[0] || 0, rotation[1] || 0, rotation[2] || 0);
        const modelMatrix = mat4.fromRotationTranslationScale(this._attributeMatrixs[idx] || [], eluerQuat, translation, scale);
        return modelMatrix;
    }

    _getDataItemScale(idx) {
        const data = this._data[idx];
        const { modelHeight, markerPixelHeight } = data;
        const scale = data['scale'] || this._defaultTRS.scale;
        if (this._gltfModelBBox) {
            if (markerPixelHeight && markerPixelHeight > 0) {
                const pixelHeightScale = this._calFixSizeScale(TEMP_FIXSIZE_SCALE, markerPixelHeight);
                return vec3.multiply(pixelHeightScale, pixelHeightScale, scale);
            } else if (modelHeight) {
                const modelHeightScale = this._calModelHeightScale(TEMP_FIXSIZE_SCALE, modelHeight);
                return vec3.multiply(modelHeightScale, modelHeightScale, scale);
            }
        }
        return scale;
    }

    
    _setLoadState(state) {
        super._setLoadState(state);
        if (this._data) {
            for (let i = 0; i < this._data.length; i++) {
                const dataItem = this._data[i];
                if (dataItem.target && dataItem.target instanceof GLTFMarker) {
                    dataItem.target._setLoadState(state);
                }
            }
        }
    }

    _updateTRSMatrix() {
        super._updateTRSMatrix();
        this._updateAttributeMatrix();
    }

    _updateInstanceAttributesData() {
        this._attributesData = {
            'instance_vectorA' : [],
            'instance_vectorB' : [],
            'instance_vectorC' : [],
            'instance_color' : [],
            'aPickingId' : [],
            'aOutline': [],
            'highlight_color': [],
            'aBloom': []
        };
        this._bloomAttributeData = {
            'instance_vectorA' : [],
            'instance_vectorB' : [],
            'instance_vectorC' : [],
            'instance_color' : [],
            'aPickingId' : [],
            'aOutline': [],
            'highlight_color': [],
            'aBloom': []
        };
        for (let i = 0; i < this._attributeMatrixs.length; i++) {
            let data = this._attributesData;
            if(this._data[i]['bloom']) {
                data = this._bloomAttributeData;
            }
            const matrix = this._attributeMatrixs[i];
            const len = data['instance_vectorA'].length / 4;
            this._setDataForAttributes(data, 'instance_vectorA', len, matrix, 0);
            this._setDataForAttributes(data, 'instance_vectorB', len, matrix, 1);
            this._setDataForAttributes(data, 'instance_vectorC', len, matrix, 2);
            const color = this._data[i]['color'] || DEFAULT_COLOR;
            const highlightColor = this._data[i]['highlightColor'] || DEFAULT_COLOR;
            data['instance_color'][len * 4] = color[0];
            data['instance_color'][len * 4 + 1] = color[1];
            data['instance_color'][len * 4 + 2] = color[2];
            data['instance_color'][len * 4 + 3] = color[3];
            data['aPickingId'][len] = this._getPickingId() + i;
            data['aOutline'][len] = this._data[i]['outline'] ? 1 : 0;
            data['highlight_color'][len * 4] = highlightColor[0];
            data['highlight_color'][len * 4 + 1] = highlightColor[1];
            data['highlight_color'][len * 4 + 2] = highlightColor[2];
            data['highlight_color'][len * 4 + 3] = highlightColor[3]; 
            data['aBloom'][len] = this._data[i]['bloom'] ? 1 : 0;
        }
        return { attributesData: this._attributesData, bloomAttributesData: this._bloomAttributeData };
    }

    _updateInstancedMeshData(mesh) {
        const { attributesData, bloomAttributesData } = this._getInstanceAttributesData();
        for (const key in attributesData) {
            mesh.updateInstancedData(key, attributesData[key]);
        }
        if (this.regl) {
            mesh.generateInstancedBuffers(this.regl);
        } else {
            this._noBuffersMeshes = this._noBuffersMeshes || [];
            this._noBuffersMeshes.push(mesh);
        }
        mesh.instanceCount = this._attributesData['instance_vectorA'].length / 4;
        if (this._hasBloom()) {
            const bloomAttrData = bloomAttributesData;
            const count = bloomAttrData['aBloom'].length;
            mesh.properties.bloomMesh = mesh.properties.bloomMesh || new reshader.InstancedMesh(bloomAttrData, count, mesh.geometry, mesh.material);
            const bloomMesh = mesh.properties.bloomMesh;
            bloomMesh.positionMatrix = mesh.positionMatrix;
            bloomMesh.localTransform = mesh.localTransform;
            for (const key in bloomAttrData) {
                bloomMesh.updateInstancedData(key, bloomAttrData[key]);
            }
            bloomMesh.generateInstancedBuffers(this.regl);
            const defines = mesh.getDefines();
            bloomMesh.setDefines(defines);
            bloomMesh.uniforms = mesh.uniforms;
            bloomMesh.bloom = 1;
            bloomMesh.instanceCount = count;
        } else if (mesh.properties.bloomMesh) {
            mesh.properties.bloomMesh.dispose();
            delete mesh.properties.bloomMesh;
        }
    }

    _setDataForBloomAttributes(name, idx, matrix, col) {
        if (!this._bloomAttributeData[name] || !matrix) {
            return;
        }
        this._bloomAttributeData[name][idx * 4] = matrix[col];
        this._bloomAttributeData[name][idx * 4 + 1] = matrix[col + 4];
        this._bloomAttributeData[name][idx * 4 + 2] = matrix[col + 8];
        this._bloomAttributeData[name][idx * 4 + 3] = matrix[col + 12];
    }

    _hasBloom() {
        return this._bloomAttributeData && this._bloomAttributeData['aBloom'].length;
    }

    _setDataForAttributes(data, name, idx, matrix, col) {
        if (!data[name] || !matrix) {
            return;
        }
        data[name][idx * 4] = matrix[col];
        data[name][idx * 4 + 1] = matrix[col + 4];
        data[name][idx * 4 + 2] = matrix[col + 8];
        data[name][idx * 4 + 3] = matrix[col + 12];
    }

    _getInstanceAttributesData(localTransform) {
        if (!this._dirty &&  this._attributesData) {
            return { attributesData: this._attributesData, bloomAttributesData: this._bloomAttributeData };
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

    _getBloomDataCount() {
        this._updateAttributeMatrix();
        return !this._bloomAttributeData ? 0 : this._bloomAttributeData['aBloom'].length;
    }

    _getNoBloomDataCount() {
        return this.getCount() - this._getBloomDataCount();
    }

    toJSON() {
        const json = JSON.parse(JSON.stringify({
            data : this._data,
            options: this.options,
            type: 'MultiGLTFMarker'
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

    _isTransparent() {
        const data = this.getAllData();
        for (let i = 0; i < data.length; i++) {
            const color = data[i].color;
            if (color && color[3] < 1) {
                return true;
            }
        }
        return false;
    }

    highlightNodes(index, highlights) {
        const meshes = this._meshes;
        if (!meshes) {
            return;
        }
        const dataItem = this._data[index];
        if (!dataItem) {
            return;
        }
        highlights.forEach(highlight => {
            meshes.forEach(mesh => {
                if (mesh.properties.nodeIndex === highlight.nodeIndex) {
                    const { color, opacity, bloom } = highlight;
                    dataItem['highlightColor'] = color || defaultColor;
                    dataItem['highlightColor'][3] = opacity || defaultOpacity;
                    dataItem['highlightBloom'] = bloom;
                    const defines = mesh.getDefines();
                    defines['HAS_INSTANCE_HIGHLIGHT'] = 1;
                    mesh.setDefines(defines);
                }
            });
        });
        this._dirty = true;
    }

    highlight(index, highlight) {
        const { color, opacity, bloom } = highlight;
        const meshes = this._meshes;
        if (!meshes) {
            return;
        }
        const dataItem = this._data[index];
        if (!dataItem) {
            return;
        }
        dataItem['highlightColor'] = color || defaultColor;
        dataItem['highlightColor'][3] = opacity || defaultOpacity;
        dataItem['highlightBloom'] = bloom;
        meshes.forEach(mesh => {
            const defines = mesh.getDefines();
            defines['HAS_INSTANCE_HIGHLIGHT'] = 1;
            mesh.setDefines(defines);
        });
        this._dirty = true;
    }

    cancelHighlight(index, nodes) {
        let meshes = this._meshes;
        if (!meshes) {
            return;
        }
        const dataItem = this._data[index];
        if (!dataItem) {
            return;
        }
        if (nodes) {
            let nodeList = nodes;
            if (!Array.isArray(nodeList)) {
                nodeList = [nodeList];
            }
            meshes = meshes.filter(mesh => { return nodeList.indexOf(mesh.properties.nodeIndex) > -1 });
        }
        meshes.forEach(mesh => {
            const defines = mesh.getDefines();
            delete defines['HAS_INSTANCE_HIGHLIGHT'];
            mesh.setDefines(defines);
            dataItem['highlightColor'] = defaultColor;
            dataItem['highlightColor'][3] = defaultOpacity;
            dataItem['highlightBloom'] = 0;
        });
        this._dirty = true;
    }

    /**
     * set transltion, rotation and scale for specific node
     * @param  {Object} options   an option object including animation{boolean}、duration{number}、pitch{number}、bearing{number}、zoomOffset{number}
     * @param  {Function}  - step function during animation, animation frame as the parameter
     * @return this
     */
    zoomAt(index, options = { animation: true, zoomOffset: 0 }, step) {
        const dataItem = this._data[index];
        if (!dataItem) {
            throw new Error('data item is not exist');
        }
        const center = new Coordinate(dataItem.coordinates);
        return this._zoomTo(center, options, step);
    }
}

MultiGLTFMarker.registerJSONType('MultiGLTFMarker');
