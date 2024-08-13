import TrafficScene from './TrafficScene';
export { TrafficScene };

if (typeof window !== 'undefined') {
    // append GroupGLLayer on maptalks manually
    if (window.maptalks) {
        // @ts-expect-error-error
        window.maptalks.TrafficScene = TrafficScene;
    }
}
