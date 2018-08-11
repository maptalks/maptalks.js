    attribute vec3 position;

    uniform mat4 projection;
    uniform mat4 view;

    varying vec3 worldPos;

    void main()
    {
        worldPos = position;

        mat4 rotView = mat4(mat3(view)); // remove translation from the view matrix
        vec4 clipPos = projection * rotView * vec4(worldPos, 1.0);

        gl_Position = clipPos.xyww;
    }
