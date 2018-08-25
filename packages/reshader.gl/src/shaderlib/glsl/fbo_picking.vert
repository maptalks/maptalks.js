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
#ifdef USE_PICKING_ID
attribute float aPickingId;
varying float vPickingId;
#endif
varying float vFbo_picking_viewZ;
#endif

void fbo_picking_setData(float viewPosZ) {
    #ifdef ENABLE_PICKING
    #ifdef USE_PICKING_ID
        vPickingId = aPickingId;
    #endif
        vFbo_picking_viewZ = viewPosZ;
    #endif
}
