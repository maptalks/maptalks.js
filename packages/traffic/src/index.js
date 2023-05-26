import TrafficScene from './TrafficScene.js';

if (typeof window !== 'undefined') {
    // append GroupGLLayer on maptalks manually
    if (window.maptalks) {
        window.maptalks.TrafficScene = TrafficScene;
    }
}
