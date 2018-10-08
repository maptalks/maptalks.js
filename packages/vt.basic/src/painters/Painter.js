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
        const regl = this.regl;
        let iconAtlas, glyphAtlas;
        if (glData.iconAtlas) {
            const image = glData.iconAtlas.image;
            iconAtlas = regl.texture({
                width : image.width,
                height : image.height,
                data : image.data,
                format : image.format,
                mag : 'linear', //very important
                min : 'linear', //very important
                flipY : false,
            });
        }
        if (glData.glyphAtlas) {
            const sdf = glData.glyphAtlas.image;
            glyphAtlas = regl.texture({
                width : sdf.width,
                height : sdf.height,
                data : sdf.data,
                format : sdf.format,
                mag : 'linear', //very important
                min : 'linear', //very important
                flipY : false,
            });
        }

        const geometries = [];
        for (let i = 0; i < packs.length; i++) {
            const geometry = new reshader.Geometry(packs[i].data, packs[i].indices);
            geometry['_features'] = features;
            geometry['_symbol'] = packs[i].symbol;
            geometry['_iconAtlas'] = iconAtlas;
            geometry['_glyphAtlas'] = glyphAtlas;
            geometry.generateBuffers(this.regl);
            geometries.push(geometry);
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
