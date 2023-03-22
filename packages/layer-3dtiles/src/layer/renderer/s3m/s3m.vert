#include <gl2_vert>
uniform mat4 czm_modelViewProjection;
uniform mat4 czm_modelView;
uniform mat3 czm_normal;

attribute vec4 aPosition;

#ifdef VertexColor
    attribute vec4 aColor;
#endif
#ifdef VertexNormal
    attribute vec3 aNormal;
#endif
#ifdef Instance
    attribute float instanceId;
#else
    attribute float batchId;
#endif

#ifdef TexCoord
    attribute vec4 aTexCoord0;
    varying vec4 vTexCoord;
    uniform mat4 uTexMatrix;
#ifdef COMPUTE_TEXCOORD
    uniform float uTexture0Width;
    varying vec4 vTexMatrix;
    varying vec4 vTexCoordTransform;
    varying vec2 vIsRGBA;
#endif
#endif

#ifdef TexCoord2
    attribute vec4 aTexCoord1;
    uniform float uTexture1Width;
    varying vec4 vTexMatrix2;
#endif
#ifdef InstanceBim
    attribute vec4 uv2;
    attribute vec4 uv3;
    attribute vec4 uv4;
    attribute vec4 secondary_colour;
    attribute vec4 uv6;
#endif

    uniform vec4 uFillForeColor;
    uniform vec4 uSelectedColor;
    varying vec4 vSecondColor;
    varying vec4 vPositionMC;
    varying vec3 vPositionEC;
#ifdef VertexNormal
    varying vec3 vNormalEC;
#endif
    varying vec4 vColor;

    const float SHIFT_LEFT8 = 256.0;
    const float SHIFT_RIGHT8 = 1.0 / 256.0;
    const float SHIFT_RIGHT4 = 1.0 / 16.0;
    const float SHIFT_LEFT4 = 16.0;
    void getTextureMatrixFromZValue(in float nZ, inout float XTran, inout float YTran, inout float scale, inout float isRGBA)
    {
        if(nZ <= 0.0)
        {
            return;
        }
        float nDel8 = floor(nZ * SHIFT_RIGHT8);
        float nDel16 = floor(nDel8 * SHIFT_RIGHT8);
        float nDel20 = floor(nDel16 * SHIFT_RIGHT4);
        isRGBA = floor(nDel20);
        YTran = nZ - nDel8 * SHIFT_LEFT8;
        XTran = nDel8 - nDel16 * SHIFT_LEFT8;
        float nLevel = nDel16 - nDel20 * SHIFT_LEFT4;
        scale = 1.0 / pow(2.0, nLevel);
    }

    void operation(vec4 operationType, vec4 color, vec4 selectedColor, inout vec4 vertexColor)
    {
        float right_2 = operationType.x * 0.5;
        float right_4 = right_2 * 0.5;
        float right_8 = right_4 * 0.5;
        float right_16 = right_8 * 0.5;
        float isSetColor = fract(right_2);
        if(isSetColor > 0.1)
        {
            vertexColor *= color;
        }
        float isPicked = fract(floor(right_2)* 0.5);
        if(isPicked > 0.1)
        {
            vertexColor *= selectedColor;
        }
        float isHide = fract(floor(right_4)* 0.5);
        if(isHide > 0.1)
        {
            vertexColor.a = 0.0;
        }
    }

    void main()
    {
    #ifdef TexCoord
        vTexCoord.xy = aTexCoord0.xy;
    #ifdef COMPUTE_TEXCOORD
        vTexMatrix = vec4(0.0,0.0,1.0,0.0);
        vIsRGBA.x = 0.0;
        vTexCoordTransform.x = aTexCoord0.z;
        if(vTexCoordTransform.x < -90000.0)
        {
            vTexMatrix.z = -1.0;
        }
        getTextureMatrixFromZValue(floor(vTexCoordTransform.x), vTexMatrix.x, vTexMatrix.y, vTexMatrix.z, vIsRGBA.x);
        vTexMatrix.w = log2(uTexture0Width * vTexMatrix.z);
    #endif
    #endif

    #ifdef TexCoord2
        vTexCoord.zw = aTexCoord1.xy;
        vTexMatrix2 = vec4(0.0,0.0,1.0,0.0);
        vIsRGBA.y = 0.0;
        vTexCoordTransform.y = aTexCoord1.z;
        if(vTexCoordTransform.y < -90000.0)
        {
            vTexMatrix2.z = -1.0;
        }
        getTextureMatrixFromZValue(floor(vTexCoordTransform.y), vTexMatrix2.x, vTexMatrix2.y, vTexMatrix2.z, vIsRGBA.y);
        vTexMatrix2.w = log2(uTexture1Width * vTexMatrix.z);
    #endif

    vec4 vertexPos = aPosition;
    vec4 vertexColor = uFillForeColor;
#ifdef VertexColor
    vertexColor *= aColor / 255.0;
#endif
#ifdef VertexNormal
    vec3 normal = aNormal;
#endif
    #ifdef InstanceBim
        mat4 worldMatrix;
        worldMatrix[0] = uv2;
        worldMatrix[1] = uv3;
        worldMatrix[2] = uv4;
        worldMatrix[3] = vec4(0, 0, 0, 1);
        vertexPos = vec4(vertexPos.xyz,1.0) * worldMatrix;
        vertexColor *= secondary_colour;
    #endif


    #ifdef Instance
        float index = instanceId;
    #else
        float index = batchId;
    #endif
        // vec4 operationType = batchTable_operation(index);
        // operation(operationType, vec4(1.0), uSelectedColor, vertexColor);
        // vSecondColor = batchTable_pickColor(index);
        vec4 positionMC = vec4(vertexPos.xyz, 1.0);
        vColor = vertexColor;
    #ifdef VertexNormal
        vNormalEC = czm_normal * normal;
    #endif
        vPositionMC = positionMC;
        vPositionEC = (czm_modelView * positionMC).xyz;
        gl_Position = czm_modelViewProjection * vec4(vertexPos.xyz, 1.0);
    }
