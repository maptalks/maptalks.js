const vert = /* wgsl */`
    #define ALTITUDE_SCALE 32767.0;
    #define EXTRUDE_SCALE 63.0;

    struct LineExtrusionVertex {
        linePixelScale: f32;
        #if HAS_LINE_WIDTH
        #else
            lineWidth: f32;
        #endif
        #if HAS_LINE_HEIGHT
        #else
            lineHeight: f32;
        #endif
    }

    @group(0) @binding($b) var<uniform> lineExtrusionVertex : LineExtrusionVertex;

    fn getLineExtrudePosition(position: vec3f, input: VertexInput) -> vec3f {
        #if HAS_LINE_WIDTH
            let lineWidth: f32 = input.aLineWidth / 2.0;
        #else
            let lineWidth: f32 = lineExtrusionVertex.lineWidth;
        #endif
        #if HAS_LINE_HEIGHT
            // aLineHeight单位是分米
            let lineHeight: f32 = input.aLineHeight / 10.0;
        #else
            let lineHeight: f32 = lineExtrusionVertex.lineHeight
        #endif

        let halfwidth: f32 = lineWidth / 2.0;
        let outset: f32 = halfwidth;
        let dist: vec2f = outset * input.aExtrude / EXTRUDE_SCALE;
        let z_scaled: f32 = position.z * (lineHeight / ALTITUDE_SCALE);
    return position + vec3f(dist, 0.0) * linePixelScale;
}
`;


const attributes = [
    {
        defines: ['HAS_LINE_WIDTH'],
        name: 'aLineWidth',
        type: 'f32',
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
