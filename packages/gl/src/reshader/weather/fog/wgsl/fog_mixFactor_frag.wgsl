struct FogEffectUniforms {
    fogDist: vec2f,
    cameraPosition: vec3f,
    rainDepth: f32,
};

@group(0) @binding($b) var<uniform> uniforms: FogEffectUniforms;

@fragment
fn main(vertexOutput: VertexOutput) -> @location(0) vec4f {
    let dir = vec3f(
        vertexOutput.vWorldPosition.x - uniforms.cameraPosition.x,
        vertexOutput.vWorldPosition.y - uniforms.cameraPosition.y,
        vertexOutput.vWorldPosition.z - uniforms.cameraPosition.z
    );
    let dist = length(dir);
    let fogFactor = clamp(1.0 - (dist - uniforms.fogDist.x) / (uniforms.fogDist.y - uniforms.fogDist.x), 0.0, 1.0);

    var gl_FragColor: vec4f;

    if (vertexOutput.vWorldPosition.z < uniforms.rainDepth) {
        gl_FragColor = vec4f(fogFactor, 0.0, 0.0, 1.0);
    } else {
        gl_FragColor = vec4f(fogFactor, 1.0, 0.0, 1.0);
    }

    return gl_FragColor;
}
