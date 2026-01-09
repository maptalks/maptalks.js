const { match, writeImageData } = require('../integration/util');
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const assert = require('assert');

function readPixel(target, x, y, width = 1, height = 1) {
    if (target.readbackCanvas) {
        target = target.readbackCanvas;
    }
    canvas.width = target.width;
    canvas.height = target.height;
    ctx.drawImage(target, 0, 0);
    const pixel = ctx.getImageData(x, y, width, height).data;
    return Array.from(pixel);
}

function readCanvasPixels(target) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = target.width;
    canvas.height = target.height;
    ctx.drawImage(target, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
}

function compareExpected(canvas, { expectedPath, expectedDiffCount }, done) {
    if (canvas.readbackCanvas) {
        canvas = canvas.readbackCanvas;
    }
    match(canvas, expectedPath, (err, result) => {
        if (err) {
            if (done) {
                done(err);
            }
            return;
        }
        expectedDiffCount = expectedDiffCount || 0;
        if (result.diffCount > 0) {
            //保存差异图片
            const dir = expectedPath.substring(0, expectedPath.length - 'expected.png'.length);
            const diffPath = dir + 'diff.png';
            writeImageData(diffPath, result.diffImage, result.width, result.height);
            const actualPath = dir + 'actual.png';
            writeImageData(actualPath, readCanvasPixels(canvas), canvas.width, canvas.height);
        }
        assert(result.diffCount <= expectedDiffCount, result.diffCount + ' pixels are different from expected ' + expectedDiffCount);
        if (done) {
            done();
        }
    });
}


module.exports = {
    readPixel, compareExpected
};
