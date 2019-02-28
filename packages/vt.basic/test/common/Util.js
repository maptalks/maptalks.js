const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

function readPixel(target, x, y) {
    canvas.width = target.width;
    canvas.height = target.height;
    ctx.drawImage(target, 0, 0);
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    return pixel;
}

module.exports = {
    readPixel
};
