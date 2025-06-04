
const DEFINE_ORDER = [
    'HAS_ALTITUDE',
    'HAS_OFFSET_Z',
    'HAS_TEXT_SIZE',
    new Set(['HAS_MARKER_WIDTH', 'HAS_MARKER_HEIGHT']),
    'HAS_TEXT_FILL',
    new Set(['HAS_MARKER_DX', 'HAS_MARKER_DY', 'HAS_TEXT_DX', 'HAS_TEXT_DY']),
    'HAS_OPACITY',
    new Set(['HAS_MARKER_PITCH_ALIGN', 'HAS_TEXT_PITCH_ALIGN']),
    new Set(['HAS_MARKER_ROTATION_ALIGN', 'HAS_TEXT_ROTATION_ALIGN']),
    new Set(['HAS_MARKER_ROTATION', 'HAS_TEXT_ROTATION']),
    'HAS_TEXT_HALO_FILL',
    new Set(['HAS_HALO_ATTR', 'HAS_TEXT_HALO_RADIUS', 'HAS_TEXT_HALO_OPACITY'])
];

//  @location(0) aPosition: vec2f,
//  @location(1) aAltitude: f32,
//  @location(2) aShape: vec4f,
//  @location(3) aColorOpacity: vec2f,
//  @location(4) aTextSize: f32,
//  @location(5) aDxDy: vec4f,
//  @location(6) aPitchAlign: vec2f,
//  @location(7) aRotationAlign: vec2f,
//  @location(8) aRotation: vec2f,
//  @location(9) aTextFill: vec4f,
//  @location(10) aTextHaloFill: vec4f,
//  @location(11) aTextHalo: vec2f,

export function limitDefinesByDevice(device, defines) {
    if (!device.wgpu) {
        return defines;
    }
    // aPosition, aShape
    const currentAttrCount = 2;
    const limit = device.wgpu.limits.maxVertexBuffers;
    let keyName;
    let checked = new Set();
    let count = 0;
    let limitDefines = {};
    for (let i = 0; i < DEFINE_ORDER.length; i++) {
        const define = DEFINE_ORDER[i];
        if (define instanceof Set) {
            //如果是Set，则遍历Set中的每个define
            let hit = null;
            for (const d of define) {
                if (defines[d]) {
                    hit = d;
                    break;
                }
            }
            if (hit && !checked.has(hit)) {
                define.forEach(checked.add, checked);
                count++;
            }
            if (hit) {
                keyName = hit;
            }
        } else if (defines[define]) {
            count++;
            keyName = define;
        }
        if (keyName && count + currentAttrCount <= limit) {
            limitDefines[keyName] = defines[keyName];
        }
        keyName = null;
    }
    return limitDefines;
}
