    attribute vec3 position;

    uniform mat4 projMatrix;
    uniform mat4 viewMatrix;

    varying vec3 worldPos;

    void main()
    {
        worldPos = position;

        mat4 rotViewMatrix = mat4(mat3(viewMatrix)); // remove translation from the view matrix
        vec4 clipPos = projMatrix * rotViewMatrix * vec4(worldPos, 1.0);

        gl_Position = clipPos.xyww;
    }
