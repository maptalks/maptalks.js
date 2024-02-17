import * as GLTFHelper  from '../GLTFHelper.js';
import { simpleModels, getSimpleModel, setSimpleModel } from './SimpleModel';

export default class GLTFManager {
    constructor(regl, options) {
        this.regl = regl;
        this.resourceMap = {};
        this.options = options || {};
    }

    getGLTF(url) {
        return this.resourceMap[url];
    }

    loginGLTF(url, requestor) {
        if (!this.resourceMap[url]) {
            if (simpleModels[url]) { //简单模型不需要request，直接返回数据
                const data = getSimpleModel(url);
                this.resourceMap[url] = this._exportGLTFResource(data, url, false);
            } else if (requestor) {
                this.resourceMap[url] = requestor(url).then(gltf => {
                    this.resourceMap[url] = this._exportGLTFResource(gltf, url);
                    return this.resourceMap[url];
                });
            } else {
                this.resourceMap[url] = this._loadGLTFModel(url);
            }
            this.resourceMap[url].refCount = 1;
        } else {
            this.resourceMap[url].refCount += 1;
        }
    }

    logoutGLTF(url) {
        if (this.resourceMap[url]) {
            this.resourceMap[url].refCount -= 1;
            if (this.resourceMap[url].refCount < 1) {
                const resources = this.resourceMap[url].resources;
                if (resources) {
                    for (let i = 0; i < resources.length; i++) {
                        resources[i].geometry.dispose();
                        if (resources[i].copyGeometry) {
                            resources[i].copyGeometry.dispose();
                        }
                        if (resources[i].material) {
                            resources[i].material.dispose();
                        }
                    }
                }
                if (this.resourceMap[url].gltfPack) {
                    this.resourceMap[url].gltfPack.dispose();
                }
                delete this.resourceMap[url];
            }
        }
    }

    isSimpleModel(url) {
        return simpleModels[url];
    }

    addSimpleModel(id, gltfData) {
        setSimpleModel(id, gltfData);
    }

    removeSimpleModel(id) {
        delete simpleModels[id];
    }

    _exportGLTFResource(gltf, url, useUniqueREGLBuffer = true) {
        if (!gltf) {
            return null;
        }
        const gltfPack = GLTFHelper.exportGLTFPack(gltf, useUniqueREGLBuffer ? this.regl : null);
        const geometries = gltfPack.getMeshesInfo();
        const bbox = gltfPack.getGLTFBBox();
        const resourceMap = {
            bbox,
            gltfPack,
            resources: geometries,
            //保存gltf的原始结构
            json: gltf.json,
            refCount: this.resourceMap[url] ? this.resourceMap[url].refCount : 0 //这里不能设置为0，由于是异步，会把前面累增的量重置为0
        };
        return resourceMap;
    }

    fetchGLTF(url) {
        return GLTFHelper.load(url, this.options).then(gltfData => {
            return gltfData;
        });
    }

    _loadGLTFModel(url) {
        return this.fetchGLTF(url).then(data => {
            this.resourceMap[url] = this._exportGLTFResource(data, url);
            return this.resourceMap[url];
        });
    }
}
