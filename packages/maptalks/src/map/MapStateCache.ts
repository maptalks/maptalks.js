type MapStateCacheValue = {
    pitch: number,
    bearing: number,
    zoom: number,
    devicePixelRatio: number;
    resolution: number;
    center: any;
    groundExtent: any;
    glScale: number;
    glRes: number;
    //other states can be added later
}
export const MapStateCache: Record<number, MapStateCacheValue> = {

}

export function updateMapStateCache(map) {
    if (!map) {
        return;
    }
    const mapId = map.id;
    MapStateCache[mapId] = {
        pitch: map.getPitch(),
        bearing: map.getBearing(),
        zoom: map.getZoom(),
        devicePixelRatio: map.getDevicePixelRatio(),
        resolution: map.getResolution(),
        center: map.getCenter(),
        groundExtent: map.getGroundExtent(),
        glScale: map.getGLScale(),
        glRes: map.getGLRes()
        //other states can be added later
    };
}
