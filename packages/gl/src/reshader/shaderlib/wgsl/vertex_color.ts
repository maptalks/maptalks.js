//用于识别顶点颜色类型: topPolygonFill 还是 bottomPolygonFill

const vert = /* wgsl */`
struct VertexColorsUniforms {
    vertexColorsOfType: array<vec4f, VERTEX_TYPES_COUNT>
}

@group(0) @binding($b) var<uniform> vertexColors: VertexColorsUniforms;

fn vertexColor_update(input: VertexInput, output: ptr<function, VertexOutput>) {
    // 将 aVertexColorType 转换为整数索引
    let index: i32 = i32(input.aVertexColorType);
    // 获取对应的颜色
    output.vertexColorColor = vertexColors.vertexColorsOfType[index];
}

`;

const frag = /* wgsl */`
fn vertexColor_get(input: VertexOutput) -> vec4<f32> {
    return input.vertexColorColor;
}
`;

const attributes = [
    {
        name: 'aVertexColorType',
        type: 'u32',
    }
];

const varyings = [
    {
        name: 'vertexColorColor',
        type: 'vec4f'
    }
];

export default {
    vert, frag, attributes, varyings,
    defines: ['HAS_VERTEX_COLOR']
};
