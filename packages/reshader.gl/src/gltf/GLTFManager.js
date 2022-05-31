import * as GLTFHelper  from '../GLTFHelper.js';

export default class GLTFManager {
    constructor(regl, requestor) {
        this.regl = regl;
        this.resourceMap = {};
        this._requestor = requestor;
    }

    getGLTF(url) {
        return this.resourceMap[url];
    }

    loginGLTF(url) {
        if (!this.resourceMap[url]) {
            if (this._requestor) {
                this.resourceMap[url] = this._requestor(url).then(gltf => {
                    const gltfpack = this._exportGLTFResource(gltf, url);
                    this.resourceMap[url] = gltfpack;
                    return gltfpack;
                });
            } else {
                this.resourceMap[url] = this._loadGLTFModel(url).catch(e => {
                    return e;
                });
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

    _exportGLTFResource(gltf, url) {
        const gltfPack = GLTFHelper.exportGLTFPack(gltf, this.regl);
        const geometries = gltfPack.getMeshesInfo();
        const resourceMap = {
            gltfPack,
            resources: geometries,
            //目前只用到gltf原始数据中的assets和animations,为避免占用内存，只保存需要用到的信息
            json: { asset: gltf.asset, animations: gltf.animations ? gltf.animations.map(animation => { return { name: animation.name }; }) : null },
            refCount: this.resourceMap[url] ? this.resourceMap[url].refCount : 0 //这里不能设置为0，由于是异步，会把前面累增的量重置为0
        };
        return resourceMap;
    }

    _loadData(url) {
        return GLTFHelper.load(url).then(gltfData => {
            return gltfData;
        });
    }

    _loadGLTFModel(url) {
        return this._loadData(url).then(data => {
            this.resourceMap[url] = this._exportGLTFResource(data, url);
            return this.resourceMap[url];
        });
    }
}
