const fs = require("fs");
const path = require("path");

const curPath = path.resolve("./");
const packagePath = path.join(curPath, "package.json");

fs.readFile(packagePath, "utf8", function (err, data) {
    if (err) throw err;
    const obj = JSON.parse(data);
    if (!obj.module) {
        console.log("No module field in package.json");
        return;
    }
    const modulePath = path.join(curPath, obj.module);
    replace(modulePath);
    const mainPath = path.join(curPath, obj.main);
    replace(mainPath);
});

function replace(filePath) {
    fs.readFile(filePath, "utf8", function (err, data) {
        if (err) {
            return console.log(err);
        }
        const result = data.replace(/@maptalks\/gl\b/g, "@maptalks/gpu").replace(/"@maptalks\/gltf-layer"/g, "\"@maptalks/gltf-layer/dist/maptalks.gltf.gpu.es.js\"");
        let gpuFileName;
        if (filePath.indexOf('es.js') > 0) {
            gpuFileName = filePath.replace(/\.es\.js$/, ".gpu.es.js");
        } else {
            gpuFileName = filePath.replace(/\.js$/, ".gpu.js");
        }
        fs.writeFile(gpuFileName, result, "utf8", function (err) {
            if (err) return console.log(err);
        });
    });
}
