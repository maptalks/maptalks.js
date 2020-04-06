import * as maptalks from 'maptalks';

const defaultOptions = {
    renderer: 'gl',
    forceRenderOnZooming: true,
    forceRenderOnMoving: true,
    forceRenderOnRotating: true
};

class Vector3DLayer extends maptalks.OverlayLayer {

    static registerPainter(name, clazz) {
        if (!Vector3DLayer.painters) {
            Vector3DLayer.painters = {};
        }
        Vector3DLayer.painters[name] = clazz;
    }

    static getPainterClass(name) {
        return Vector3DLayer.painters[name];
    }

    /**
     * 获取图层的polygonOffsetCount
     * 用于GroupGLLayer全局管理polygonOffset
     */
    getPolygonOffsetCount() {
        return 1;
    }

    /**
     * 获取图层的polygonOffset
     * 用于GroupGLLayer全局管理polygonOffset
     */
    getPolygonOffset() {
        return this._polygonOffset || 0;
    }

    setPolygonOffset(offset, total) {
        this._polygonOffset = offset;
        this._totalPolygonOffset = total;
        return this;
    }

    getTotalPolygonOffset() {
        return this._totalPolygonOffset;
    }
}

Vector3DLayer.mergeOptions(defaultOptions);

export default Vector3DLayer;
