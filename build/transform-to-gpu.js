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
    if (obj.module) {
        const modulePath = path.join(curPath, obj.module);
        replace(modulePath);
    }
    if (obj.main) {
        const mainPath = path.join(curPath, obj.main);
        replace(mainPath);
    }

});

function replace(filePath) {
    const data = fs.readFileSync(filePath, 'utf-8');
    const result = data.replaceAll(/@maptalks\/gl\b/g, "@maptalks/gpu").replace(/@maptalks\/gltf-layer\b/g, "@maptalks/gltf-layer/dist/maptalks.gltf.gpu.es.js");
    let gpuFileName;
    if (filePath.indexOf('.es.js') > 0) {
        gpuFileName = filePath.substring(0, filePath.length - 6) + ".gpu.es.js";
    } else {
        gpuFileName = filePath.substring(0, filePath.length - 3) + ".gpu.js";
    }
    console.log(filePath, gpuFileName);
    fs.writeFileSync(gpuFileName, result, "utf-8");
}
