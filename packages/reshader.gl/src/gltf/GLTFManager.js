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
                throw Error(e);
            });
            this.resourceMap[url].count = 1;
        } else {
            this.resourceMap[url].count += 1;
        }
    }

    logoutGLTF(url) {
        if (this.resourceMap[url]) {
            this.resourceMap[url].count -= 1;
            if (this.resourceMap[url].count < 1) {
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
                        if (resources[i].gltfPack) {
                            resources[i].gltfPack.dispose();
                        }
                    }
                    delete this.resourceMap[url];
                }
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
                count: this.resourceMap[url].count
            };
            return this.resourceMap[url];
        });
    }
}
