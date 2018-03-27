export default `
    attribute vec3 aPosition;
    attribute vec2 aTexCoord;
    attribute vec3 aNormal;

    varying vec2 vTexCoord;
    varying vec3 vWorldPos;
    varying vec3 vNormal;

    uniform mat4 projection;
    uniform mat4 view;
    uniform mat4 model;

    void main()
    {
        vTexCoord = aTexCoord;
        vWorldPos = vec3(model * vec4(aPosition, 1.0));
        vNormal = mat3(model) * aNormal;

        gl_Position =  projection * view * vec4(vWorldPos, 1.0);
    }
`;
