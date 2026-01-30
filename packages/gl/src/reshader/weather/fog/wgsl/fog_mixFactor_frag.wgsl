struct FogEffectUniforms {
    fogDist: vec2f,
    cameraPosition: vec3f,
    rainDepth: f32,
};

@group(0) @binding($b) var<uniform> uniforms: FogEffectUniforms;

@fragment
fn main(vertexOutput: VertexOutput) -> @location(0) vec4f {
    let worldPosition = vertexOutput.vWorldPosition;
    let dir = vec3f(
        worldPosition.x - uniforms.cameraPosition.x,
        worldPosition.y - uniforms.cameraPosition.y,
        worldPosition.z - uniforms.cameraPosition.z
    );
    let dist = length(dir);
    let fogFactor = clamp(1.0 - (dist - uniforms.fogDist.x) / (uniforms.fogDist.y - uniforms.fogDist.x), 0.0, 1.0);

    var gl_FragColor: vec4f;

    if (worldPosition.z < uniforms.rainDepth) {
        gl_FragColor = vec4f(fogFactor, 0.0, 0.0, 1.0);
    } else {
        gl_FragColor = vec4f(fogFactor, 1.0, 0.0, 1.0);
    }

    return gl_FragColor;
}
