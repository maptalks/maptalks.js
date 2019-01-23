const fs = require('fs');
const pixelmath = require('pixelmatch');
const expectedCanvas = document.createElement('canvas'),
    ctx = expectedCanvas.getContext('2d');
module.exports = {
    match(canvas, expectedPath, cb) {
        const image = new Image();
        image.onload = () => {
            const width = expectedCanvas.width = image.width;
            const height = expectedCanvas.height = image.height;

            ctx.drawImage(image, 0, 0);
            const expected = new Uint8Array(ctx.getImageData(0, 0, width, height).data);

            ctx.drawImage(canvas, 0, 0);
            const actual = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

            const output = new Uint8Array(width * height * 4);
            const count = pixelmath(expected, actual, output, width, height);

            cb(null, { diffImage : output, count });
        };
        image.onerror = cb;
        image.src = 'file://' + expectedPath;
        return false;
    }
};
