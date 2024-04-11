const { match, writeImageData } = require('../integration/util');
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const assert = require('assert');

function readPixel(target, x, y) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = target.width;
    canvas.height = target.height;
    ctx.drawImage(target, 0, 0);
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    return [pixel[0], pixel[1], pixel[2], pixel[3]];
}


function compareExpected(canvas, { expectedPath, expectedDiffCount }, done) {
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
            writeImageData(actualPath, canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
        }
        assert(result.diffCount <= expectedDiffCount);
        if (done) {
            done();
        }
    });
}


module.exports = {
    readPixel, compareExpected
};
