import { reshader } from '@maptalks/gl';

class Painter {
    constructor(regl, layer, sceneConfig) {
        this.regl = regl;
        this.layer = layer;
        this.canvas = layer.getRenderer().canvas;
        this.sceneConfig = sceneConfig || {};
        this.scene = new reshader.Scene();
        this.init();
    }

    needToRedraw() {
        throw new Error('not implemented');
    }

    createGeometry(glData, features) {
        const packs = glData.packs;
        if (!packs || !packs.length) {
            return null;
        }
        const geometries = [];
        for (let i = 0; i < packs.length; i++) {
            const geometry = new reshader.Geometry(packs[i].data, packs[i].indices);
            geometry._features = features;
            geometry._symbol = packs[i].symbol;
            geometry.generateBuffers(this.regl);
        }

        return geometries;
    }

    createMesh(/* geometries, transform */) {
        throw new Error('not implemented');
    }

    addMesh(meshes) {
        this.scene.addMesh(meshes);
        return meshes;
    }

    paint() {
        throw new Error('not implemented');
    }

    pick(/* x, y */) {
        throw new Error('not implemented');
    }

    updateSceneConfig(/* config */) {
    }

    deleteMesh(meshes) {
        if (!meshes) {
            return;
        }
        this.scene.removeMesh(meshes);
        for (let i = 0; i < meshes.length; i++) {
            const geometry = meshes[i].geometry;
            geometry.dispose();
            meshes[i].dispose();
        }
    }

    clear() {
        this.scene.clear();
    }

    resize() {}

    remove() {
        throw new Error('not implemented');
    }
}

export default Painter;
