import vertContent from './s3m.vert';
import fragContent from './s3m.frag';
import vertContent3 from './s3m3.vert';
import fragContent3 from './s3m3.frag';

const extension = {
    "programs": [
        {
            "attributes": [
                "aPosition",
                "instanceId",
                "batchId",
                "aTexCoord0",
                "aTexCoord1",
                "aNormal",
                "aColor",
                "uv2",
                "uv3",
                "uv4",
                "secondary_colour",
                "uv6"
            ],
            "fragmentShader": 1,
            "vertexShader": 0
        }
    ],
    "shaders": [
        {
            "type": 35633,
            "content": vertContent
        },
        {
            "type": 35632,
            "content": fragContent
        }
    ],
    "techniques": [
        {
            "attributes": {
                "aPosition": {
                    "semantic": "POSITION",
                    "type": 35666
                },
                "instanceId": {
                    "semantic": "instanceId",
                    "type": 5126
                },
                "batchId": {
                    "semantic": "_BATCHID",
                    "type": 5126
                },
                "aTexCoord0": {
                    "semantic": "TEXCOORD_0",
                    "type": 35664
                },
                "aTexCoord1": {
                    "semantic": "aTexCoord1",
                    "type": 35666,
                },
                "aNormal": {
                    "semantic": "aNormal",
                    "type": 35665,
                },
                "aColor": {
                    "semantic": "COLOR_0",
                    "type": 35666,
                },
                "uv2": {
                    "semantic": "uv2",
                    "type": 35666,
                },
                "uv3": {
                    "semantic": "uv3",
                    "type": 35666,
                },
                "uv4": {
                    "semantic": "uv4",
                    "type": 35666,
                },
                "secondary_colour": {
                    "semantic": "secondary_colour",
                    "type": 35666,
                },
                "uv6": {
                    "semantic": "uv6",
                    "type": 35666,
                },
                "TextureCoordMatrix": {
                    "semantic": "TextureCoordMatrix",
                    "type": 35664
                }
            },
            "program": 0,
            "uniforms": {
                "czm_modelView": {
                    "type": 0x8B5C,
                    "semantic": "MODELVIEW"
                },
                "czm_normal": {
                    "type": 0x8B5B,
                    "semantic": "MODELINVERSETRANSPOSE"
                },
                "czm_modelViewProjection": {
                    "type": 0x8B5C,
                    "semantic": "MODELVIEWPROJECTION"
                },
                "uTexMatrix": {
                    "type": 0x8B5C
                },
                "uTexture0Width": {
                    "type": 5126
                },
                "uFillForeColor": {
                    "type": 0x8B52
                },
                "uSelectedColor": {
                    "type": 0x8B52
                },
                "uDiffuseColor": {
                    "type": 0x8B52
                },
                "uTexture": {
                    // "type": 0x8B5E
                    'type': 35678
                },
                "uTexture2": {
                    "type": 35678
                },
                "uTexture1Width": {
                    "type": 5126
                }
            }
        }
    ]
};

export function getKHR_techniques(version) {
    if (version === 3) {
        const extension3 = JSON.parse(JSON.stringify(extension));
        extension3.shaders[0].content = vertContent3;
        extension3.shaders[1].content = fragContent3;
        return extension3;
    }
    return extension;
}
