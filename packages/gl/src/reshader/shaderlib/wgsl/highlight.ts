const vert = /* wgsl */`

    // 顶点着色器函数
    fn highlight_setVarying(input: VertexInput, output: ptr<function, VertexOutput>) {
        // 如果有高亮颜色
    #if HAS_HIGHLIGHT_COLOR
        output.vHighlightColor = vec4f(input.aHighlightColor) / 255.0;
    #endif

        // 如果有高亮透明度
    #if HAS_HIGHLIGHT_OPACITY
        output.vHighlightOpacity = f32(input.aHighlightOpacity) / 255.0;
    #endif
    }
`;

const frag = /* wgsl */`
    // 高亮颜色混合函数
    fn highlight_blendColor(color: vec4f, output: VertexOutput) -> vec4f {
        var outColor: vec4f = color;

        // 如果有高亮颜色
        #if HAS_HIGHLIGHT_COLOR
            let highlightColor = output.vHighlightColor;
            let opacity = highlightColor.a;
            outColor = vec4f(outColor.rgb * (1.0 - opacity) + highlightColor.rgb * opacity, outColor.a);
            #ifndef HAS_HIGHLIGHT_COLOR_POINT
                // 如果没有高亮颜色点
                outColor.a = outColor.a * (1.0 - opacity) + opacity;
            #endif
        #endif

            // 如果有高亮透明度
        #if HAS_HIGHLIGHT_OPACITY
            outColor *= output.vHighlightOpacity;
        #endif

        return outColor;
    }
`;

const attributes = [
    {
        defines: ['HAS_HIGHLIGHT_COLOR'],
        name: 'aHighlightColor',
        type: 'vec4u'
    },
    {
        defines: ['HAS_HIGHLIGHT_OPACITY'],
        name: 'aHighlightOpacity',
        type: 'u32'
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
    defines: (defines) => {
        return defines['HAS_HIGHLIGHT_OPACITY'] || defines['HAS_HIGHLIGHT_COLOR'];
    },
    vert, frag, attributes, varyings
};
