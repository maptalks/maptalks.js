const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const srcRoot = path.join(path.join(__dirname, '..', 'src'));

function walkSync(dir, filelist) {
    const files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            filelist = walkSync(fullPath, filelist);
        } else {
            filelist.push('.' + path.sep + path.relative(root, fullPath));
        }
    });
    return filelist;
}

const sources = walkSync(srcRoot);

/**
 * Source files to generate API Docs, to keep right parsing order.
 * @type {Array}
 */
module.exports = sources;
