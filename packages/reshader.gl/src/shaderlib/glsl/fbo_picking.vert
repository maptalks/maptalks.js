//--------------------------
// Picking
//
// #define ENABLE_PICKING 整型 是否开启PICKING
//
// uniform int batchId geometry的批次id
//
//
// void fbo_picking_setData(viewPosZ)
//   设置picking数据,必须在设置gl_Position后调用
//
// 示例：
// fbo_picking_setData(gl_Position.w);
//--------------------------

#ifdef ENABLE_PICKING
#if USE_PICKING_ID == 1 // USE_PICKING_ID == 1 时读取attributes
attribute float aPickingId; // USE_PICKING_ID == 2 时读取uniforms
#elif USE_PICKING_ID == 2
uniform float uPickingId;
#endif
varying float vPickingId;
varying float vFbo_picking_viewZ;
varying float vFbo_picking_visible;
#endif

void fbo_picking_setData(float viewPosZ, bool visible) {
    #ifdef ENABLE_PICKING
    #if USE_PICKING_ID == 1
       vPickingId = aPickingId;
    #elif USE_PICKING_ID == 2
        vPickingId = uPickingId;
    #endif
        vFbo_picking_viewZ = viewPosZ;
    #endif
    vFbo_picking_visible = visible ? 1.0 : 0.0;
}
