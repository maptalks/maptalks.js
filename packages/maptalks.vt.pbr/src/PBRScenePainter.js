import * as reshader from 'reshader.gl';

export default class PBRScenePainter {
    constructor(regl, sceneConfig) {
        this.regl = regl;
        this.sceneConfig = sceneConfig;
        this.meshCache = {};
        this._init();
    }

    addData(key, data) {
        const mesh = new reshader.Mesh(data, this.material);
        this.meshCache[key] = mesh;
        this.scene.addMesh(mesh);
    }

    paint() {
        //TODO implement shadow pass
        this.renderer.render(this.shader, this._getUniformValues(), this.scene);
    }

    getMesh(key) {
        return this.meshCache[key];
    }

    delete(key) {
        const mesh = this.meshCache[key];
        if (mesh) {
            const geometry = mesh.geometry;
            geometry.dispose();
            mesh.dispose();
            delete this.meshCache[key];
        }
    }

    remove() {
        for (const p in this.meshCache) {
            if (this.meshCache.hasOwnProperty(p)) {
                this.delete(p);
            }
        }
        this.material.dispose();
        this.shader.dispose();
    }

    _init() {
        const regl = this.regl;
        this.loader = new reshader.ResourceLoader(regl.texture(2));
        this.shader = new reshader.MeshShader(
            reshader.pbr.StandardVert, reshader.pbr.StandardFrag,
            this._getUniforms(),
            this._getDefines()
        );
        this.scene = new reshader.Scene();
        this.renderer = new reshader.Renderer(regl);

        const mConfig = this.sceneConfig.material;
        const m = {};
        for (const p in mConfig) {
            if (mConfig.hasOwnProperty(p)) {
                if (p.indexOf('Map') > 0) {
                    //a texture image
                    m[p] = new reshader.Texture2D({ url : mConfig[p] }, this.loader);
                } else {
                    m[p] = mConfig[p];
                }
            }
        }

        this.material = new reshader.pbr.StandardMaterial(m);
        /* {
            metallic : 1,
            roughness : 0.2,
            albedoColor : [1, 1, 1],
            albedoMap : new reshader.Texture2D({
                url : './resources/rusted_iron/albedo.png'
            }, loader),
            normalMap : new reshader.Texture2D({
                url : './resources/rusted_iron/normal.png'
            }, loader),
            occulusionRoughnessMetallicMap : new reshader.Texture2D({
                url : './resources/rusted_iron/occulusionRoughnessMetallicMap-1024.png'
            }, loader)
        } */
    }

    _getUniforms() {
        return [
            'view', 'projection', 'camPos',
            'lightPositions[0]', 'lightPositions[1]', 'lightPositions[2]', 'lightPositions[3]',
            'lightColors[0]', 'lightColors[1]', 'lightColors[2]', 'lightColors[3]',
            'ambientColor',
            'irradianceMap', 'prefilterMap', 'brdfLUT'
        ];
    }

    _getUniformValues() {
        // return {
        //     view, projection, camPos,
        //     irradianceMap : iblMaps.irradianceCubeMap,
        //     prefilterMap : iblMaps.prefilterCubeMap,
        //     brdfLUT : iblMaps.brdfLUT,
        //     ambientColor : [0.01, 0.01, 0.01],
        //     lightPositions : {
        //         '0' : lightPositions[0],
        //         '1' : lightPositions[1],
        //         '2' : lightPositions[2],
        //         '3' : lightPositions[3],
        //     },
        //     lightColors : {
        //         '0' : lightColors[0],
        //         '1' : lightColors[1],
        //         '2' : lightColors[2],
        //         '3' : lightColors[3],
        //     }
        // };
    }

    _getDefines() {
        return {
            'NUM_OF_LIGHTS' : '(4)',
            'USE_SPOT_LIGHT' : 1,
            'USE_AMBIENT_CUBEMAP' : 1
        };
    }
}