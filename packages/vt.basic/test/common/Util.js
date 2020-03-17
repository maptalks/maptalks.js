const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

function readPixel(target, x, y) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = target.width;
    canvas.height = target.height;
    ctx.drawImage(target, 0, 0);
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    return pixel;
}

module.exports = {
    readPixel
};
