const path = require('path');
const fs = require('fs');
const pixelmath = require('pixelmatch');
const expectedCanvas = document.createElement('canvas'),
    ctx = expectedCanvas.getContext('2d');
const image0 = new Image();
module.exports = {
    match(canvas, expectedPath, cb) {
        image0.onload = () => {
            const width = expectedCanvas.width = image0.width;
            const height = expectedCanvas.height = image0.height;

            ctx.drawImage(image0, 0, 0);
            const expected = ctx.getImageData(0, 0, width, height).data;

            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(canvas, 0, 0);
            const imageData = ctx.getImageData(0, 0, width, height);
            const actual = imageData.data;

            const output = new Uint8Array(width * height * 4);
            const diffCount = pixelmath(expected, actual, output, width, height);
            // console.log(diffCount);

            cb(null, { diffImage: output, diffCount, width, height });
        };
        image0.onerror = cb;
        image0.src = 'file://' + expectedPath;
        return false;
    },

    readSpecs(specPath) {
        /* eslint-disable global-require */
        const specs = {};
        const dirs = fs.readdirSync(specPath, { withFileTypes: true });
        for (let i = 0; i < dirs.length; i++) {
            const dir = dirs[i];
            if (!dir.isDirectory()) {
                continue;
            }
            const name = dir.name;
            specs[name] = require(path.resolve(specPath, name));
            specs[name].expected = path.resolve(specPath, name, 'expected.png');
        }
        return specs;
        /* eslint-enable global-require */
    }
};
