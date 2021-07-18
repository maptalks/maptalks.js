import * as GLTFHelper  from '../GLTFHelper.js';

export default class GLTFManager {
    constructor(regl) {
        this.regl = regl;
        this.resourceMap = {};
    }

    getGLTF(url) {
        return this.resourceMap[url];
    }

    loginGLTF(url) {
        if (!this.resourceMap[url]) {
            this.resourceMap[url] = this._loadGLTFModel(url).catch(e => {
                return e;
            });
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

    _loadData(url) {
        return GLTFHelper.load(url).then(gltfData => {
            return gltfData;
        });
    }

    _loadGLTFModel(url) {
        return this._loadData(url).then(data => {
            const gltfPack = GLTFHelper.exportGLTFPack(data, this.regl);
            const geometries = gltfPack.getMeshesInfo();
            this.resourceMap[url] = {
                gltfPack,
                resources: geometries,
                json: data,
                refCount: this.resourceMap[url].refCount
            };
            return this.resourceMap[url];
        });
    }
}
