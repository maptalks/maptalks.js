import * as reshader from 'reshader.gl';

class PBRScenePainter {
    constructor(regl, sceneConfig) {
        this.regl = regl;
        this.sceneConfig = sceneConfig;
        this.meshCache = {};
        this._init();
    }

    createMesh(key, data, indices) {
        const geometry = new reshader.Geometry(data, indices);
        const mesh = new reshader.Mesh(geometry, this.material);
        this.addMesh(key, mesh);
        return mesh;
    }

    addMesh(key, mesh) {
        this.meshCache[key] = mesh;
        this.scene.addMesh(mesh);
    }

    paint(layer) {
        const map = layer.getMap();
        if (!map) {
            return {
                redraw : false
            };
        }
        //TODO implement shadow pass
        this.renderer.render(this.shader, this._getUniformValues(map), this.scene);
        return {
            redraw : this.loader.isLoading()
        };
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

    clear() {
        this.meshCache = {};
        this.scene.clear();
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
            'ambientColor',
            'dirLightDirections[0]', 'dirLightColors[0]',
            // 'lightPositions[0]', 'lightPositions[1]', 'lightPositions[2]', 'lightPositions[3]',
            // 'lightColors[0]', 'lightColors[1]', 'lightColors[2]', 'lightColors[3]',
            // 'irradianceMap', 'prefilterMap', 'brdfLUT'
        ];
    }

    _getUniformValues(map) {
        const view = map.viewMatrix,
            projection = map.projMatrix,
            camPos = map.cameraPosition;
        return {
            view, projection, camPos,
            ambientColor : [0.01, 0.01, 0.01],
            dirLightDirections : {
                '0' : reshader.Util.normalize([], [0, 0, 1])
            },
            dirLightColors : {
                '0' : [1, 1, 1]
            },
            // lightPositions : {
            //     '0' : lightPositions[0],
            //     '1' : lightPositions[1],
            //     '2' : lightPositions[2],
            //     '3' : lightPositions[3],
            // },
            // lightColors : {
            //     '0' : lightColors[0],
            //     '1' : lightColors[1],
            //     '2' : lightColors[2],
            //     '3' : lightColors[3],
            // }
            // irradianceMap : iblMaps.irradianceCubeMap,
            // prefilterMap : iblMaps.prefilterCubeMap,
            // brdfLUT : iblMaps.brdfLUT,
        };
    }

    _getDefines() {
        return {
            'USE_COLOR' : 1,
            'USE_DIR_LIGHT' : 1,
            'NUM_OF_DIR_LIGHTS' : '(1)',
            // 'USE_SPOT_LIGHT' : 1,
            // 'NUM_OF_LIGHTS' : '(4)',
            // 'USE_AMBIENT_CUBEMAP' : 1
        };
    }
}

export default PBRScenePainter;
