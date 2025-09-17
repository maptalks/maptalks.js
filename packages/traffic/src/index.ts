import TrafficScene from './TrafficScene';
export { TrafficScene };

if (typeof window !== 'undefined') {
    // append GroupGLLayer on maptalks manually
    if (window.maptalks) {
        window.maptalks.TrafficScene = TrafficScene;
    }
}
