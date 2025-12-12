const vert = /* wgsl */`
    #define ALTITUDE_SCALE 32767.0
    #define EXTRUDE_SCALE 63.0

    struct LineExtrusionVertex {
        linePixelScale: f32,
        #if HAS_LINE_WIDTH
        #else
            lineWidth: f32,
        #endif
        #if HAS_LINE_HEIGHT
        #else
            lineHeight: f32,
        #endif
    }

    @group(0) @binding($b) var<uniform> lineExtrusionVertex : LineExtrusionVertex;

    fn getLineExtrudePosition(position: vec3f, input: VertexInput) -> vec3f {
        let uniforms = lineExtrusionVertex;
        #if HAS_LINE_WIDTH
            let lineWidth = f32(input.aLineWidth) / 2.0;
        #else
            let lineWidth = uniforms.lineWidth;
        #endif
        #if HAS_LINE_HEIGHT
            // aLineHeight单位是分米
            let lineHeight = f32(input.aLineHeight) / 10.0;
        #else
            let lineHeight = uniforms.lineHeight;
        #endif

        let halfwidth = lineWidth / 2.0;
        let outset = halfwidth;
        let dist = outset * vec2f(input.aExtrude.xy) / EXTRUDE_SCALE;
        let z_scaled = position.z * (lineHeight / ALTITUDE_SCALE);
        return position + vec3f(dist, 0.0) * uniforms.linePixelScale;
    }
`;


const attributes = [
    {
        name: 'aExtrude',
        type: 'vec2i',
    },
    {
        defines: ['HAS_LINE_WIDTH'],
        name: 'aLineWidth',
        type: 'u32',
    },
    {
        defines: ['HAS_LINE_HEIGHT'],
        name: 'aLineHeight',
        type: 'f32',
    }
];

export default {
    vert,
    attributes,
    defines: ['IS_LINE_EXTRUSION']
};
