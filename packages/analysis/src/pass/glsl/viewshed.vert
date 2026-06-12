#if defined(IS_TERRAIN)
    attribute vec3 aPosition;
    attribute vec2 aTexCoord;
    uniform float minAltitude;
    uniform mat4 projViewModelMatrix;
    uniform mat4 modelMatrix;
    uniform mat4 positionMatrix;
    uniform sampler2D flatMask;
    #include <common_pack_float>

    uniform mat4 viewshed_projViewMatrixFromViewpoint;
    varying vec4 viewshed_positionFromViewpoint;

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
        vec4 localPosition = positionMatrix * position;
        viewshed_positionFromViewpoint = viewshed_projViewMatrixFromViewpoint * modelMatrix * localPosition;
        gl_PointSize = 1.0;
        gl_Position = projViewModelMatrix * localPosition;
    }

#else

    attribute vec3 aPosition;
    uniform mat4 modelMatrix;
    uniform mat4 positionMatrix;
    uniform mat4 projViewModelMatrix;
    uniform mat4 viewshed_projViewMatrixFromViewpoint;
    varying vec4 viewshed_positionFromViewpoint;
    #include <get_output>
    void main()
    {
        mat4 localPositionMatrix = getPositionMatrix();
        vec4 localPosition = localPositionMatrix * getPosition(aPosition);
        viewshed_positionFromViewpoint = viewshed_projViewMatrixFromViewpoint * modelMatrix * localPosition;
        gl_PointSize = 1.0;
        gl_Position = projViewModelMatrix * localPosition;
    }

#endif
