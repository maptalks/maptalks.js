const vert = /* wgsl */`
#include <invert_matrix>
#include <draco_decode_vert>

#include <instance_vert>

#ifdef HAS_SKIN
    struct SkinUniforms {
        skinAnimation: i32,
    };
    @group(0) @binding($b) var<uniform> skinUniforms: SkinUniforms;
    #include <skin_vert>
#endif

#include <mask_vert>

#ifdef HAS_MORPH
    struct MorphUniforms {
        morphWeights1: vec4f,
        morphWeights2: vec4f,
    };
    @group(0) @binding($b) var<uniform> morphUniforms: MorphUniforms;
#endif

#ifdef HAS_MIN_ALTITUDE
    struct AltitudeUniforms {
        minAltitude: f32,
    };
    @group(0) @binding($b) var<uniform> altitudeUniforms: AltitudeUniforms;
#endif

#ifdef HAS_TERRAIN_FLAT_MASK
    struct TerrainMaskUniforms {
        maskResolution: vec2f
    };
    @group(0) @binding($b) var<uniform> terrainMaskUniforms: TerrainMaskUniforms;
    @group(0) @binding($b) var flatMask: texture_2d<f32>;
#endif

fn getPositionMatrix(input: VertexInput, vertexOutput: ptr<function, VertexOutput>, positionMatrix: mat4x4f) -> mat4x4f {
    var worldMatrix: mat4x4f;
#ifdef HAS_INSTANCE
    let attributeMatrix = instance_getAttributeMatrix(input);
    #ifdef HAS_INSTANCE_COLOR
        vertexOutput.vInstanceColor = instance_getInstanceColor();
    #endif
    #ifdef HAS_SKIN
        if (skinUniforms.skinAnimation == 1) {
            worldMatrix = attributeMatrix * positionMatrix * skin_getSkinMatrix();
        } else {
            worldMatrix = attributeMatrix * positionMatrix;
        }
    #else
        worldMatrix = attributeMatrix * positionMatrix;
    #endif
#else
    #ifdef HAS_SKIN
        if (skinUniforms.skinAnimation == 1) {
            worldMatrix = skin_getSkinMatrix() * positionMatrix;
        } else {
            worldMatrix = positionMatrix;
        }
    #else
        worldMatrix = positionMatrix;
    #endif
#endif
    return worldMatrix;
}

fn getPosition(inputPosition: vec3f, vertexInput: VertexInput) -> vec4f {
    var position = decode_getPosition(inputPosition);
    #ifdef HAS_MORPH
        let outputPosition = vec4f(position +
            morphUniforms.morphWeights1[0] * vertexInput.POSITION0 +
            morphUniforms.morphWeights1[1] * vertexInput.POSITION1 +
            morphUniforms.morphWeights1[2] * vertexInput.POSITION2 +
            morphUniforms.morphWeights1[3] * vertexInput.POSITION3 +
            morphUniforms.morphWeights2[0] * vertexInput.POSITION4 +
            morphUniforms.morphWeights2[1] * vertexInput.POSITION5 +
            morphUniforms.morphWeights2[2] * vertexInput.POSITION6 +
            morphUniforms.morphWeights2[3] * vertexInput.POSITION7, 1.0);
    #else
        var outputPosition = vec4f(position, 1.0);
    #endif
    #ifdef HAS_TERRAIN_ALTITUDE
        outputPosition.z += vertexInput.aTerrainAltitude * 100.0;
    #endif
    #ifdef HAS_TERRAIN_FLAT_MASK
        var uv = vertexInput.aTexCoord;
        uv.y = 1.0 - uv.y;
        let texCoord = vec2i(uv * terrainMaskUniforms.maskResolution);
        let encodedHeight = textureLoad(flatMask, texCoord, 0);
        if (length(encodedHeight) < 2.0) {
            let maskHeight = decodeFloat32(encodedHeight);
            outputPosition.z = min(outputPosition.z, maskHeight);
        }
    #endif
    #ifdef HAS_MIN_ALTITUDE
        outputPosition.z += altitudeUniforms.minAltitude * 100.0;
    #endif
    return outputPosition;
}

fn appendMorphNormal(inputNormal: vec3f, vertexInput: VertexInput) -> vec3f {
    #ifdef HAS_MORPHNORMALS
        let normal = inputNormal +
            morphUniforms.morphWeights1[0] * vertexInput.NORMAL0 +
            morphUniforms.morphWeights1[1] * vertexInput.NORMAL1 +
            morphUniforms.morphWeights1[2] * vertexInput.NORMAL2 +
            morphUniforms.morphWeights1[3] * vertexInput.NORMAL3;
    #else
        let normal = inputNormal;
    #endif
    return normal;
}
`;

const varyings =[
    {
        defines: ['HAS_INSTANCE_COLOR', 'HAS_INSTANCE'],
        name: 'vInstanceColor',
        type: 'vec4f'
    }
];

const attributes = [
    {
        defines: ['HAS_MORPH'],
        name: 'POSITION0',
        type: 'vec3f'
    },
    {
        defines: ['HAS_MORPH'],
        name: 'POSITION0',
        type: 'vec3f'
    },
    {
        defines: ['HAS_MORPH'],
        name: 'POSITION1',
        type: 'vec3f'
    },
    {
        defines: ['HAS_MORPH'],
        name: 'POSITION2',
        type: 'vec3f'
    },
    {
        defines: ['HAS_MORPH'],
        name: 'POSITION3',
        type: 'vec3f'
    },
    {
        defines: ['HAS_MORPH'],
        name: 'POSITION4',
        type: 'vec3f'
    },
    {
        defines: ['HAS_MORPH'],
        name: 'POSITION5',
        type: 'vec3f'
    },
    {
        defines: ['HAS_MORPH'],
        name: 'POSITION6',
        type: 'vec3f'
    },
    {
        defines: ['HAS_MORPH'],
        name: 'POSITION7',
        type: 'vec3f'
    },
    {
        defines: ['HAS_MORPH', 'HAS_MORPHNORMALS'],
        name: 'NORMAL0',
        type: 'vec3f'
    },
    {
        defines: ['HAS_MORPH', 'HAS_MORPHNORMALS'],
        name: 'NORMAL0',
        type: 'vec3f'
    },
    {
        defines: ['HAS_MORPH', 'HAS_MORPHNORMALS'],
        name: 'NORMAL1',
        type: 'vec3f'
    },
    {
        defines: ['HAS_MORPH', 'HAS_MORPHNORMALS'],
        name: 'NORMAL2',
        type: 'vec3f'
    },
    {
        defines: ['HAS_TERRAIN_ALTITUDE'],
        name: 'aTerrainAltitude',
        type: 'f32'
    }
];

export default {
    attributes,
    varyings,
    vert
};
