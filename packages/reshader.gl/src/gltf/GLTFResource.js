import { isArray } from '../common/Util';
import Geometry from '../Geometry';

export default class GeometryResource {
    constructor(resource) {
        this._init(resource);
    }

    _init(resource) {
        this.geometry = resource.geometry;
        this.nodeMatrix = resource.nodeMatrix;
        this.materialInfo = resource.materialInfo;
        this.extraInfo = resource.extraInfo;
        this.animationMatrix = resource.animationMatrix;
        this.morphWeights = resource.morphWeights;
        this.skin = resource.skin;
    }

    copy() {
        if (!this.copyGeometry) {
            //在重复利用geometry时，之前创建过拷贝份的copyGeometry就不用创建了
            this.copyGeometry = this._copyGeometry(this.geometry);
        }
    }

    createCopyBarycentric() {
        if (this.copyGeometry && !this.copyGeometry.data.aBarycentric) {
            //重新组织attribute数据，让每个顶点有独立的数据
            this.copyGeometry.buildUniqueVertex();
            //创建barycentric属性数据，参数是attribute名字
            this.copyGeometry.createBarycentric('aBarycentric');
        }
    }


    _copyGeometry(geometry) {
        const data = geometry.data;
        const indices = geometry.elements;
        const newData = {};
        const vertexCount = geometry.getVertexCount();
        for (const p in data) {
            if (isArray(data[p])) {
                const size = data[p].length / vertexCount;
                newData[p] = new data[p].constructor(vertexCount * size);
                for (let i = 0; i < vertexCount * size; i++) {
                    newData[p][i] = data[p][i];
                }
            } else {
                const size = data[p].interleavedArray.length / vertexCount;
                newData[p] = new data[p].interleavedArray.constructor(vertexCount * size);
                for (let i = 0; i < vertexCount * size; i++) {
                    newData[p][i] = data[p].interleavedArray[i];
                }
            }
        }

        const newElements = indices.length !== undefined ? indices.slice() : indices;
        const count = geometry.count;
        const desc = JSON.parse(JSON.stringify(geometry.desc));
        const copyGeometry = new Geometry(newData, newElements, count, desc);
        copyGeometry.properties = geometry.properties;
        return copyGeometry;
    }
}
