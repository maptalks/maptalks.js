#include <gl2_vert>

#if defined(IS_TERRAIN)
    attribute vec3 aPosition;
    attribute vec2 aTexCoord;
    uniform float minAltitude;
    uniform mat4 projViewModelMatrix;
    uniform mat4 projMatrix;
    uniform mat4 modelMatrix;
    uniform mat4 modelViewMatrix;
    uniform mat4 positionMatrix;
    uniform sampler2D flatMask;
    #include <common_pack_float>

    varying vec2 vHighPrecisionZW;
    varying float vFragDepth;

    void main() {
        vec2 uv = aTexCoord;
        uv.y = 1.0 - uv.y;
        vec4 encodedHeight = texture2D(flatMask, uv);
        float altitude = aPosition.z;
        if (length(encodedHeight) < 2.0) {
            float maskHeight = decodeFloat32(encodedHeight);
            altitude = min(aPosition.z, maskHeight);
        }
        vec4 position = vec4(aPosition.xy, (altitude + minAltitude), 1.0);
        position = positionMatrix * position;
        #ifdef HAS_MASK_EXTENT
            gl_Position = projMatrix * getMaskPosition(position, modelMatrix);
        #else
            gl_Position = projViewModelMatrix * position;
        #endif
        vFragDepth = 1.0 + gl_Position.w;
        vHighPrecisionZW = gl_Position.zw;
    }

#else

    #ifdef HAS_ALTITUDE
        attribute vec2 aPosition;
        attribute float aAltitude;
    #else
        attribute vec3 aPosition;
    #endif
    // uniform mat4 projViewMatrix;
    // uniform mat4 modelMatrix;
    uniform mat4 projViewModelMatrix;
    uniform mat4 positionMatrix;
    #include <get_output>

    varying vec2 vHighPrecisionZW;
    varying float vFragDepth;

    #ifdef HAS_ALTITUDE
        vec3 unpackVTPosition() {
            return vec3(aPosition, aAltitude);
        }
    #endif
    void main()
    {
        #ifdef HAS_ALTITUDE
            vec3 i = unpackVTPosition();
            vec4 j = vec4(i, 1.);
            gl_Position = projViewModelMatrix * j;
        #else
            mat4 localPositionMatrix = getPositionMatrix();
            gl_Position = projViewModelMatrix * localPositionMatrix * getPosition(aPosition);
        #endif
        vFragDepth = 1.0 + gl_Position.w;
        vHighPrecisionZW = gl_Position.zw;
    }
#endif
