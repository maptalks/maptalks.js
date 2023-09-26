const path = require('path');
const fs = require('fs');
const pixelmath = require('pixelmatch');
const expectedCanvas = document.createElement('canvas'),
    ctx = expectedCanvas.getContext('2d');
const image0 = new Image();

const canvas = document.createElement('canvas');
module.exports = {
    hasOwn(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
    },

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
            const indexPath = path.resolve(specPath, name, 'index.js');
            if (!fs.existsSync(indexPath)) {
                continue;
            }
            specs[name] = require(path.resolve(specPath, name));
            specs[name].expected = path.resolve(specPath, name, 'expected.png');
        }
        return specs;
        /* eslint-enable global-require */
    },

    writeImageData(path, arr, width, height) {
        canvas.width = width;
        canvas.height = height;
        const imageData = canvas.getContext('2d').getImageData(0, 0, width, height);

        for (let i = 0; i < arr.length; i++) {
            imageData.data[i] = arr[i];
        }
        canvas.getContext('2d').putImageData(imageData, 0, 0);
        const dataURL = canvas.toDataURL();
        const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
        fs.writeFileSync(path, base64Data, 'base64');
    }

};
