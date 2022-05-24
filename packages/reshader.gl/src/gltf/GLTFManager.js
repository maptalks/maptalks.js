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

    loginGLTF(url, gltf) {
        if (!this.resourceMap[url]) {
            this.resourceMap[url] = this._requestor(url);
        } else if (this.resourceMap[url].then && gltf) {
            this.resourceMap[url] = this._exportGLTFResource(gltf, url);
        }
        if (gltf) {
            this.resourceMap[url].refCount = !this.resourceMap[url].refCount ? 1 : this.resourceMap[url].refCount + 1;
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
}
