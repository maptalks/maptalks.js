#define DEVICE_PIXEL_RATIO 1.0

#if HAS_SHADOWING && !HAS_BLOOM
    #include <vsm_shadow_frag>
#endif

struct LineFragmentUniforms {
    lineBlur: f32,
    lineColor: vec4f,
    lineStrokeColor: vec4f,
    lineOpacity: f32,
    tileExtent: f32,
    lineDasharray: vec4f,
    lineDashColor: vec4f,
    #ifdef HAS_PATTERN
        atlasSize: vec2f,
        flipY: f32,
        linePatternAnimSpeed: f32,
        linePatternGap: f32,
        linePatterGapColor: vec4f,
    #endif
}

struct ShaderUniforms {
    layerOpacity: f32,
    isRenderingTerrain: f32,
    trailSpeed: f32,
    trailLength: f32,
    trailCircle: f32,
    currentTime: f32,
    cameraPosition: vec3f,
    cameraToCenterDistance: f32,
    fogFactor: f32
}

@group(0) @binding($b) var<uniform> uniforms: LineFragmentUniforms;
@group(0) @binding($b) var<uniform> shaderUniforms: ShaderUniforms;
#ifdef HAS_PATTERN
    @group(0) @binding($b) var linePatternFile: texture_2d<f32>;
    @group(0) @binding($b) var linePatternFileSampler: sampler;
#endif

struct VertexOutput {
    @location($i) vNormal: vec2f,
    @location($i) vWidth: vec2f,
    @location($i) vGammaScale: f32,
#ifndef ENABLE_TILE_STENCIL
    @location($i) vPosition: vec2f,
#endif
    @location($i) vVertex: vec3f,

#if HAS_PATTERN || HAS_DASHARRAY || HAS_GRADIENT || HAS_TRAIL
    @location($i) vLinesofar: f32,
#endif

#ifndef HAS_GRADIENT
    #ifdef HAS_COLOR
        @location($i) vColor: vec4f,
    #endif

    #ifdef HAS_PATTERN
        #ifdef HAS_PATTERN_ANIM
            @location($i) vLinePatternAnimSpeed: f32,
        #endif

        #ifdef HAS_PATTERN_GAP
            @location($i) vLinePatternGap: f32,
        #endif

        @location($i) vTexInfo: vec4f,
    #endif

    #ifdef HAS_DASHARRAY
        #ifdef HAS_DASHARRAY_ATTR
            @location($i) vDasharray: vec4f,
        #endif

        #ifdef HAS_DASHARRAY_COLOR
            @location($i) vDashColor: vec4f,
        #endif
    #endif
#endif

#ifdef HAS_STROKE_COLOR
    @location($i) vStrokeColor: vec4f,
#endif

#ifdef HAS_OPACITY
    @location($i) vOpacity: f32,
#endif

#ifdef HAS_GRADIENT
    @location($i) vGradIndex: f32,
#endif


};

#include <highlight_frag>

#ifdef HAS_PATTERN
fn computeUV(texCoord: vec2f) -> vec2f {
    let uv = texCoord % 1.0;
    let uvStart = input.vTexInfo.xy;
    let uvSize = input.vTexInfo.zw;
    return (uvStart + uv * uvSize) / uniforms.atlasSize;
}
#endif

fn dashAntialias(input: VertexOutput, dashMod: f32, dashWidth: f32) -> f32 {
    //dash两边的反锯齿
    let dashHalf = dashWidth / 2.0;
    let dashDist = abs(dashMod - dashHalf);
    let blur2 = (0.1 + 1.0 / DEVICE_PIXEL_RATIO) * input.vGammaScale;
    return clamp(min(dashDist + blur2, dashHalf - dashDist) / blur2, 0.0, 1.0);
}

@fragment
fn main(input: VertexOutput) -> @location(0) vec4f {
    #ifndef ENABLE_TILE_STENCIL
    //当position的x, y超出tileExtent时，丢弃该片元
        let clip = sign(uniforms.tileExtent - min(uniforms.tileExtent, abs(input.vPosition.x))) *
            sign(1.0 + sign(input.vPosition.x)) *
            sign(uniforms.tileExtent - min(uniforms.tileExtent, abs(input.vPosition.y))) *
            sign(1.0 + sign(input.vPosition.y));
        if (clip == 0.0) {
            discard;
        }
    #endif
    #if HAS_PATTERN || HAS_DASHARRAY || HAS_GRADIENT || HAS_TRAIL
        let linesofar = input.vLinesofar;
    #endif

    //outset
    let dist = length(input.vNormal) * input.vWidth.x;

    #ifdef HAS_PATTERN
        let uvSize = input.vTexInfo.zw;
        let hasPattern = sign(uvSize.x * uvSize.y);
        let blur = mix(uniforms.lineBlur, 0.0, hasPattern);
    #else
        let blur = uniforms.lineBlur;
    #endif

    let blur2 = (blur + 1.0 / DEVICE_PIXEL_RATIO) * input.vGammaScale;
    let alpha = clamp(min(dist - (input.vWidth.y - blur2), input.vWidth.x - dist) / blur2, 0.0, 1.0);
    #ifdef HAS_COLOR
        var color = input.vColor / 255.0;
    #else
        var color = uniforms.lineColor;
    #endif

    #ifdef HAS_PATTERN
        if (hasPattern == 1.0) {
            #ifdef HAS_PATTERN_GAP
                let myGap = input.vLinePatternGap;
            #else
                let myGap = uniforms.linePatternGap;
            #endif
            #ifdef HAS_PATTERN_ANIM
                let myAnimSpeed = input.vLinePatternAnimSpeed;
            #else
                let myAnimSpeed = uniforms.linePatternAnimSpeed;
            #endif
            let patternWidth = uvSize.x * input.vWidth.x * 2.0 / uvSize.y;
            let plusGapWidth = patternWidth * (1.0 + myGap);
            let animatedLinesofar = linesofar + ((shaderUniforms.currentTime * -myAnimSpeed * 0.2) % plusGapWidth);
            let patternx = (animatedLinesofar / plusGapWidth) % 1.0;
            let patterny = ((uniforms.flipY * input.vNormal.y + 1.0) / 2.0) % 1.0;

            let patternColor = textureSample(
                linePatternFile,
                linePatternFileSampler,
                computeUV(vec2f(patternx * (1.0 + myGap), patterny))
            );

            let inGap = clamp(sign(1.0 / (1.0 + myGap) - patternx) + 0.000001, 0.0, 1.0);
            let finalPatternColor = mix(uniforms.linePatterGapColor, patternColor, inGap);
            color *= finalPatternColor;
        }
    #endif

    #ifdef HAS_DASHARRAY
        #ifdef HAS_DASHARRAY_ATTR
            let dasharray = input.vDasharray;
        #else
            let dasharray = uniforms.lineDasharray;
        #endif

        #ifdef HAS_DASHARRAY_COLOR
            let dashColor = input.vDashColor;
        #else
            let dashColor = uniforms.lineDashColor;
        #endif

        let dashWidth = dasharray[0] + dasharray[1] + dasharray[2] + dasharray[3];
        let dashMod = linesofar % dashWidth;
        //判断是否在第一个dash中
        let firstInDash = max(sign(dasharray[0] - dashMod), 0.0);
        //判断是否在第二个dash中
        let secondDashMod = dashMod - dasharray[0] - dasharray[1];
        let secondInDash = max(sign(secondDashMod), 0.0) * max(sign(dasharray[2] - secondDashMod), 0.0);

        let isInDash = firstInDash + secondInDash;

        //dash两边的反锯齿
        let firstDashAlpha = dashAntialias(input, dashMod, dasharray[0]);
        let secondDashAlpha = dashAntialias(input, secondDashMod, dasharray[2]);

        let dashAlpha = firstDashAlpha * firstInDash + secondDashAlpha * secondInDash;
        color = color * (1.0 - dashAlpha) + dashColor * dashAlpha;
    #endif

    #ifdef HAS_STROKE_COLOR
        var strokeColor = input.vStrokeColor / 255.0;
    #else
        var strokeColor = uniforms.lineStrokeColor;
    #endif
    strokeColor = mix(color, strokeColor, sign(input.vWidth.y));
    color = strokeColor * alpha + max(sign(input.vWidth.y - dist), 0.0) * color * (1.0 - alpha);

    #ifdef HAS_TRAIL
        let trailMod = (linesofar - shaderUniforms.currentTime * shaderUniforms.trailSpeed * 0.1) % shaderUniforms.trailCircle;
        let trailAlpha = select(0.0, mix(0.0, 1.0, trailMod / shaderUniforms.trailLength), trailMod < shaderUniforms.trailLength);
        color *= trailAlpha;
    #endif

    #ifdef HAS_OPACITY
        let opacity = input.vOpacity;
    #else
        let opacity = uniforms.lineOpacity;
    #endif
    var fragColor = color * opacity * shaderUniforms.layerOpacity;

    #if HAS_SHADOWING && !HAS_BLOOM
        let shadowCoeff = shadow_computeShadow(input);
        fragColor = vec4(shadow_blend(fragColor.rgb, shadowCoeff), fragColor.a);
    #endif
    let cameraPosition = shaderUniforms.cameraPosition;
    let perspectiveAlpha = select(
        clamp(shaderUniforms.cameraToCenterDistance * 1.5 / distance(input.vVertex, cameraPosition), 0.0, 1.0),
        1.0,
        shaderUniforms.isRenderingTerrain == 1.0
    );

    fragColor *= perspectiveAlpha;
    #if HAS_HIGHLIGHT_COLOR || HAS_HIGHLIGHT_OPACITY
    fragColor = highlight_blendColor(fragColor, input);
    #endif
    if (shaderUniforms.fogFactor > 0.0) {
        let dir = vec3f(input.vVertex.x - cameraPosition.x, input.vVertex.y - cameraPosition.y, input.vVertex.z - cameraPosition.z);
        let fog_dist = length(dir);
        let fog_alpha = clamp(1.0 - (fog_dist * 1.2) / shaderUniforms.fogFactor, 0.0, 1.0);
        fragColor *= fog_alpha;
    }
    return fragColor;
}
