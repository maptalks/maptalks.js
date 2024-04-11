let offscreenCanvas = false;
try {
    const canvas = new OffscreenCanvas(1, 1);
    const ctx = canvas.getContext('2d');
    ctx.fillText('hello', 0, 0);
    offscreenCanvas = true;
} catch (err) {
    offscreenCanvas = false;
}

export default {
    offscreenCanvas
};
