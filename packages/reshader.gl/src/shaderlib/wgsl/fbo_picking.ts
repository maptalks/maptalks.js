const vert = /*wgsl*/`
//--------------------------
// Picking
//
// #define ENABLE_PICKING 整型 是否开启PICKING
//
// uniform int batchId geometry的批次id
//
//
// fn fbo_picking_setData(viewPosZ: f32, visible: bool)
//   设置picking数据,必须在设置gl_Position后调用
//
// 示例：
// fbo_picking_setData(output.position.w, true);
//--------------------------

#ifdef ENABLE_PICKING
#if HAS_PICKING_ID == 2
    struct PickingUniforms {
        uPickingId: f32,
    }
    @group(0) @binding($b) var<uniform> pickingUniforms: PickingUniforms;
#endif

struct PickingVertexOutput {
    #ifdef ENABLE_PICKING
        vPickingId: f32,
        vFbo_picking_viewZ: f32,
        vFbo_picking_visible: f32,
    #endif
    vFbo_picking_fragDepth: f32,
}
#endif

fn fbo_picking_setData(input: VertexInput, output: VertexOutput, viewPosZ: f32, visible: bool) {
    #ifdef ENABLE_PICKING
    #if HAS_PICKING_ID == 1
       output.vPickingId = input.aPickingId;
    #elif HAS_PICKING_ID == 2
        output.vPickingId = pickingUniforms.uPickingId;
    #endif
        output.vFbo_picking_viewZ = viewPosZ;
    #endif
    output.vFbo_picking_visible = select(0.0, 1.0, visible);
    output.vFbo_picking_fragDepth = viewPosZ + 1.0;
}
`;

export default {
    defines: ['PICKING_MODE'],
    vert,
    attributes: [
        {
            defines: ['HAS_PICKING_ID == 1'],
            name: 'aPickingId',
            type: 'f32'
        }
    ],
    varyings: [
        {
            defines: ['ENABLE_PICKING'],
            name: 'vPickingId',
            type: 'f32'
        },
        {
            defines: ['ENABLE_PICKING'],
            name: 'vFbo_picking_viewZ',
            type: 'f32'
        },
        {
            defines: ['ENABLE_PICKING'],
            name: 'vFbo_picking_visible',
            type: 'f32'
        },
        {
            name: 'vFbo_picking_fragDepth',
            type: 'f32'
        },
    ]
};
