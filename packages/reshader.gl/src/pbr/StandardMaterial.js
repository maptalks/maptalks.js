import Material from '../Material.js';

const defaultUniforms = {
    albedoMap : null,
    albedoColor : [1, 1, 1],
    metallic : 1,
    roughness : 0,
    normalMap : null,
    normalStrength : 1,
    heightMap : null,
    heightStrength : 1,
    occlusionMap : null,
    emissionMap : null
};

/**
 * {
        albedoMap,     //RGB, A可以用来存cutoff
        albedoColor, //vec3
        metallic,   //float / R
        roughtness, //float / A
        normalMap,  //RGB
        normalStrength, //float
        heightMap,  //?
        heightStrength, //float,
        occlusionMap,   //?
        emissionMap,    //RGB
    }
 */
class StandardMaterial extends Material {
    constructor(uniforms) {
        if (uniforms['roughness'] <= 0) {
            uniforms['roughness'] = 0.02;
        }
        super(uniforms, defaultUniforms);
    }

    createDefines() {
        const uniforms = this.uniforms;
        const defines = {};
        if (uniforms['albedoMap']) {
            defines['USE_ALBEDO_MAP'] = 1;
        }
        if (uniforms['normalMap']) {
            defines['USE_NORMAL_MAP'] = 1;
        }
        if (uniforms['occulusionRoughnessMetallicMap']) {
            defines['USE_OcculusionRoughnessMetallic_MAP'] = 1;
        }
        // if (uniforms['occlusionMap']) {
        //     defines['OCCULUSION_MAP'] = 1;
        // }
        // if (this.isTexture(uniforms['metallic'])) {
        //     defines['METALLIC_ROUGHNESS_MAP'] = 1;
        // }
        return defines;
    }


}

export default StandardMaterial;
