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
        for (const p in data) {
            if (isArray(data[p])) {
                newData[p] = data[p].slice();
            } else {
                const interleavedArray = geometry._getAttributeData(p);
                if (p !== geometry.desc.positionAttribute) {
                    newData[p] = interleavedArray;
                } else {
                    newData[p] = interleavedArray.slice();
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
