#include <get_output>

struct VertexInput {
    @location($i) aPosition: vec3f,
    @location($i) aNormal: vec3f,
    @location($i) aTexCoord: vec2f,
};

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location($o) vTexCoord: vec2f,
};

struct Uniforms {
    modelMatrix: mat4x4f,
    modelViewMatrix: mat4x4f,
    positionMatrix: mat4x4f,
    top: f32,
    bottom: f32,
};

struct VertexShaderUniforms {
    projMatrix: mat4x4f,
    cameraPosition: vec3f,
    time: f32,
};

@group(0) @binding($b) var<uniform> uniforms: Uniforms;
@group(0) @binding($b) var<uniform> shaderUniforms: VertexShaderUniforms;

fn angle(x: f32, y: f32) -> f32 {
    return atan2(y, x);
}

fn getFoot(camera: vec2f, normal: vec2f, pos: vec2f) -> vec2f {
    var position = vec2f(0.0, 0.0);
    let distanceLen = distance(pos, normal);
    var a = angle(camera.x - normal.x, camera.y - normal.y);

    if pos.x > normal.x {
        a -= 0.785;
    } else {
        a += 0.785;
    }

    position.x = cos(a) * distanceLen;
    position.y = sin(a) * distanceLen;
    return position + normal;
}

@vertex
fn main(vertexInput: VertexInput) -> VertexOutput {
    var output: VertexOutput;

    let localPositionMatrix: mat4x4f = getPositionMatrix(vertexInput, &output, uniforms.positionMatrix);
    let localPosition: vec4f = localPositionMatrix * getPosition(vec3f(vertexInput.aPosition.xyz), vertexInput);

    let foot = getFoot(
        vec2f(shaderUniforms.cameraPosition.x, shaderUniforms.cameraPosition.z),
        vec2f(vertexInput.aNormal.x, vertexInput.aNormal.z),
        vec2f(localPosition.x, localPosition.z)
    );

    let height = uniforms.top - uniforms.bottom;
    var y = vertexInput.aNormal.y - uniforms.bottom - height * shaderUniforms.time;

    if y < 0.0 {
        y += height;
    }

    let ratio = (1.0 - y / height) * (1.0 - y / height);
    y = height * (1.0 - ratio);
    y += uniforms.bottom;
    y += vertexInput.aPosition.y - vertexInput.aNormal.y;

    let finalLocalPosition = vec4f(foot.x, y, foot.y, 1.0);

    output.position = shaderUniforms.projMatrix *
                     uniforms.modelViewMatrix *
                     localPositionMatrix *
                     finalLocalPosition;

    output.vTexCoord = vertexInput.aTexCoord;

    return output;
}
