const vert = /* wgsl */`

    // 顶点着色器函数
    fn highlight_setVarying(input: VertexInput, output: VertexOutput) {
        // 如果有高亮颜色
    #if HAS_HIGHLIGHT_COLOR
        output.vHighlightColor = input.aHighlightColor / 255.0;
    #endif

        // 如果有高亮透明度
    #if HAS_HIGHLIGHT_OPACITY
        output.vHighlightOpacity = input.aHighlightOpacity / 255.0;
    #endif
    }
`;

const frag = /* wgsl */`
    // 高亮颜色混合函数
    fn highlight_blendColor(color: vec4f, input: VertexOutput) -> vec4f {
        var outColor: vec4f = color;

        // 如果有高亮颜色
        #if HAS_HIGHLIGHT_COLOR
            outColor.rgb = outColor.rgb * (1.0 - input.vHighlightColor.a) + input.vHighlightColor.rgb * input.vHighlightColor.a;
            #if HAS_HIGHLIGHT_COLOR_POINT
            #else
            // 如果没有高亮颜色点
                outColor.a = outColor.a * (1.0 - input.vHighlightColor.a) + input.vHighlightColor.a;
            #endif
        #endif

            // 如果有高亮透明度
        #if HAS_HIGHLIGHT_OPACITY
            outColor *= input.vHighlightOpacity;
        #endif

        return outColor;
    }
`;

const attributes = [
    {
        defines: ['HAS_HIGHLIGHT_COLOR'],
        name: 'aHighlightColor',
        type: 'vec4f'
    },
    {
        defines: ['HAS_HIGHLIGHT_OPACITY'],
        name: 'aHighlightOpacity',
        type: 'f32'
    }
];

const varyings = [
    {
        defines: ['HAS_HIGHLIGHT_COLOR'],
        name: 'vHighlightColor',
        type: 'vec4f'
    },
    {
        defines: ['HAS_HIGHLIGHT_OPACITY'],
        name: 'vHighlightOpacity',
        type: 'f32'
    }
];

export default {
    vert, frag, attributes, varyings
};
