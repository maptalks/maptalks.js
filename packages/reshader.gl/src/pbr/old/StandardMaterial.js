import Material from '../../Material.js';

const defaultUniforms = {
    albedoMap : null,
    albedoColor : [1, 1, 1],
    metallic : 0,
    roughness : 0.5,
    occulusionRoughnessMetallicMap : null,
    normalMap : null,
    normalStrength : 1,
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
        super(uniforms, defaultUniforms);
    }

    createDefines() {
        const defines = super.createDefines();
        const uniforms = this.uniforms;
        if (uniforms['albedoMap']) {
            defines['USE_ALBEDO_MAP'] = 1;
        }
        if (uniforms['normalMap']) {
            defines['USE_NORMAL_MAP'] = 1;
        }
        if (uniforms['occulusionRoughnessMetallicMap']) {
            defines['USE_OCCULUSIONROUGHNESSMETALLIC_MAP'] = 1;
        }
        return defines;
    }


}

export default StandardMaterial;
