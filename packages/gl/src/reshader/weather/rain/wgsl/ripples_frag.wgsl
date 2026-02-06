struct RippleEffectUniforms {
    rippleRadius: f32,
    density: f32,
    time: f32,
};

@group(0) @binding($b) var<uniform> uniforms: RippleEffectUniforms;

fn hash3(p: vec2f) -> vec3f {
    let q = vec3f(
        dot(p, vec2f(127.1, 311.7)),
        dot(p, vec2f(269.5, 183.3)),
        dot(p, vec2f(419.2, 371.9))
    );
    return fract(sin(q) * 43758.5453);
}

fn noise(x: vec2f) -> f32 {
    let v = x * uniforms.density / 4000.0;
    let p = floor(v);
    let f = fract(v);

    var va: f32 = 0.0;

    for (var j: i32 = -4; j <= 4; j++) {
        for (var i: i32 = -4; i <= 4; i++) {
            let g = vec2f(f32(i), f32(j));
            let o = hash3(p + g);
            let r = g - f + o.xy;
            let d = sqrt(dot(r, r));
            let ripple = max(mix(smoothstep(0.99, 0.999, max(cos(d - uniforms.time * 2.0 + (o.x + o.y) * 5.0), 0.0)), 0.0, d), 0.0);
            va += ripple;
        }
    }

    return va;
}
@fragment
fn main(vertexOutput: VertexOutput) -> @location(0) vec4f {
    let uv = vertexOutput.vTexCoord;
    let radius = 24.0 / (uniforms.rippleRadius * 0.01);
    let f = noise(radius * uv) * smoothstep(0.0, 0.4, sin(uv.x * 3.151592) * sin(uv.y * 3.141592));
    let normal = vec3f(-dpdx(f), -dpdy(f), -dpdy(f));
    return vec4f(normal, 1.0);
}
