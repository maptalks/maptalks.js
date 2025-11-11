import { isArray } from '../common/Util';
import EdgeGeometry from '../EdgeGeometry';

export default class GeometryResource {
    constructor(resource) {
        this._init(resource);
    }

    _init(resource) {
        this.bbox = resource.bbox;
        this.geometry = resource.geometry;
        this.nodeMatrix = resource.nodeMatrix;
        this.materialInfo = resource.materialInfo;
        this.extraInfo = resource.extraInfo;
        this.animationMatrix = resource.animationMatrix;
        this.morphWeights = resource.morphWeights;
        this.skin = resource.skin;
        this.nodeIndex = resource.nodeIndex;
    }

    copyEdgeGeometry() {
        if (!this.copyGeometry) {
            //在重复利用geometry时，之前创建过拷贝份的copyGeometry就不用创建了
            this.copyGeometry = this._copyEdgeGeometry(this.geometry);
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


    _copyEdgeGeometry(geometry) {
        const data = geometry.data;
        const indices = geometry.indices || geometry.elements;
        const newData = {};
        for (const p in data) {
            if (p !== geometry.desc.positionAttribute) {
                continue;
            }
            if (isArray(data[p])) {
                newData[p] = data[p].slice();
            } else if (data[p].buffer && data[p].buffer.destroy) {
                newData[p] = { buffer: data[p].buffer };
                if (isArray(data[p].array)) {
                    newData[p].array = data[p].array.slice();
                }
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
        const desc = JSON.parse(JSON.stringify(geometry.desc));
        const copyGeometry = new EdgeGeometry(newData, newElements, 0, desc);
        copyGeometry.properties = geometry.properties;
        return copyGeometry;
    }
}
