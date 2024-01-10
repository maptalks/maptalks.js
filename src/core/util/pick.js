/**
 *
 * layer pick utils
 * can use by PointLayer,LineStringLayer,PolygonLayer,VectorTileLayer,Geo3DTilesLayer,GLTFLayer etc
 *
 * @returns
 */
import Canvas from '../Canvas';

export function isGLRenderLayer(layer) {
    if (!layer) {
        return false;
    }
    const renderer = layer.getRenderer && layer.getRenderer();
    return !!(renderer && renderer.gl);
}

export function checkCanvasSize(targetCanvas, sourceCanvas) {
    if (!targetCanvas || !sourceCanvas) {
        return null;
    }
    const { width, height, style } = sourceCanvas;
    if (targetCanvas.width !== width || targetCanvas.height !== height) {
        targetCanvas.width = width;
        targetCanvas.height = height;
    }
    if (targetCanvas.style.width !== style.width || targetCanvas.style.height !== style.height) {
        targetCanvas.style.width = style.width;
        targetCanvas.style.height = style.height;
    }
    return targetCanvas;
}

export function clearCanvas(canvas) {
    if (!canvas) {
        return null;
    }
    const ctx = Canvas.getCanvas2DContext(canvas);
    Canvas.clearRect(ctx, 0, 0, canvas.width, canvas.height);
    return ctx;
}

let tempCanvas;
export function layerIsBlankInPoint(layer, containerPoint, tolerance = 1) {
    if (!layer || !containerPoint) {
        return true;
    }
    const renderer = layer.getRenderer && layer.getRenderer();
    if (!renderer || !renderer.canvas) {
        return true;
    }
    const map = layer.getMap();
    if (!map) {
        return true;
    }
    if (!tempCanvas) {
        tempCanvas = Canvas.createCanvas(1, 1);
        // document.body.appendChild(tempCanvas);
    }
    tempCanvas = checkCanvasSize(tempCanvas, renderer.canvas);
    if (!tempCanvas) {
        return true;
    }
    const ctx = clearCanvas(tempCanvas);
    if (!ctx) {
        return true;
    }
    tolerance = Math.max(layer.options.geometryEventTolerance || 1, tolerance);
    tolerance = Math.abs(Math.round(tolerance));
    tolerance = Math.max(1, tolerance);
    const r = map.getDevicePixelRatio();
    const { x, y } = containerPoint;
    let left = x - tolerance, top = y - tolerance;
    left = Math.round(left * r);
    top = Math.round(top * r);
    left = Math.max(0, left);
    top = Math.max(0, top);
    const size = tolerance * 2;
    let imageData;
    try {
        ctx.drawImage(renderer.canvas, 0, 0);
        imageData = ctx.getImageData(left, top, size, size);
    } catch (error) {
        console.warn('hit detect failed with tainted canvas, some geometries have external resources in another domain:\n', error);
    }
    if (!imageData) {
        return false;
    }
    const data = imageData.data;
    for (let i = 0, len = data.length; i < len; i += 4) {
        const A = data[i + 3];
        if (A > 0) {
            return false;
        }
    }
    return true;

}
