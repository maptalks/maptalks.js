const frag = /*wgsl*/`
#ifdef HAS_SNOW
fn lerp(a: f32, b: f32, w: f32) -> f32 {
    return a + w * (b - a);
}

fn snow(sceneColor: vec4f, normalColor: vec3f, height: f32) -> vec3f {
    let snowIntense = normalColor.b;
    let fixedC = vec3f(1.0, 1.0, 1.0);

    if (height < 1.0) {
        let r = lerp(0.5, fixedC.x, snowIntense);
        let g = lerp(0.5, fixedC.y, snowIntense);
        let b = lerp(0.5, fixedC.z, snowIntense);
        return vec3f(r, g, b);
    } else {
        let r = lerp(sceneColor.r, fixedC.x, snowIntense);
        let g = lerp(sceneColor.g, fixedC.y, snowIntense);
        let b = lerp(sceneColor.b, fixedC.z, snowIntense);
        return vec3f(r, g, b);
    }
}
#endif
`;

export default {
    defines: ['HAS_SNOW'],
    frag
};
