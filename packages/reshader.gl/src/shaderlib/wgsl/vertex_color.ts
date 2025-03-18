//用于识别顶点颜色类型: topPolygonFill 还是 bottomPolygonFill

const vert = /* wgsl */`
#if HAS_VERTEX_COLOR
    struct VertexColors {
        vertexColorsOfType: array<vec4f, VERTEX_TYPES_COUNT>;
    }

    @group(0) @binding($b) var<uniform> vertexColors: VertexColors;

    fn vertexColor_update(input: VertexInput, out: VertexOutput) {
        // 将 aVertexColorType 转换为整数索引
        let index: i32 = i32(input.aVertexColorType);
        // 获取对应的颜色
        output.vertexColor_color = vertexColors.vertexColorsOfType[index];
    }
#endif
`;

const frag = /* wgsl */`
#if HAS_VERTEX_COLOR
    fn vertexColor_get(input: FragmentInput) -> vec4<f32> {
        return input.vertexColor_color;
    }
#endif
`;

const attributes = [
    {
        name: 'aVertexColorType',
        type: 'i32',
    }
];

const varyings = [
    {
        name: 'vertexColor_color',
        type: 'vec4f'
    }
];

export default {
    vert, frag, attributes, varyings,
    defines: ['HAS_VERTEX_COLOR']
};
