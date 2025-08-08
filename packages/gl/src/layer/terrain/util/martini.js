import Martini from '@maptalks/martini';

const martinis = {};

export function createMartiniData(error, heights, width/* , hasSkirts */) {
    let martini = martinis[width];
    if (!martini) {
        martini = martinis[width] = new Martini(width);
    }
    const terrainTile = martini.createTile(heights);
    //TODO 需要增加判断，只有pbr渲染时，才需要把isolateSkirtVertices设成true
    const isolateSkirtVertices = true;
    const mesh = terrainTile.getMeshWithSkirts(error, isolateSkirtVertices);

    const { triangles, vertices, leftSkirtIndex, rightSkirtIndex, bottomSkirtIndex, topSkirtIndex } = mesh;
    let { numVerticesWithoutSkirts, numTrianglesWithoutSkirts } = mesh;
    if (!numVerticesWithoutSkirts) {
        numVerticesWithoutSkirts = vertices.length / 2;
        numTrianglesWithoutSkirts = triangles.length / 3;
    }
    const count = vertices.length / 2;
    const positions = new Float32Array(count * 3), texcoords = new Float32Array(count * 2);
    const skirtOffset = 0;//terrainStructure.skirtOffset;
    let minHeight = Infinity;
    let maxHeight = -Infinity;
    const maxWidth = width - 1;
    for (let i = 0; i < count; i++) {
        const x = vertices[i * 2], y = vertices[i * 2 + 1];
        if (i >= numVerticesWithoutSkirts) {
            // positions.push(0);
            const index = x / 2 * 3;
            let height;
            // 侧面因为顶底uv[1]相等，导致和normal合并计算tangent时会出现NaN，导致侧面的normal结果错误
            // 给skirt顶面的uv的x和y都增加一点偏移量即能解决该问题
            let texOffset = 0.001;
            if (isolateSkirtVertices) {
                const start = i < leftSkirtIndex / 2 ? numVerticesWithoutSkirts :
                    i < rightSkirtIndex / 2 ? leftSkirtIndex / 2 :
                        i < bottomSkirtIndex / 2 ? rightSkirtIndex / 2 : bottomSkirtIndex / 2;
                if ((i - start) % 3 === 0) {
                    height = Math.min(0, minHeight);
                    texOffset = 0;
                } else {
                    height = positions[index + 2];
                }
            } else {
                height = Math.min(0, minHeight);
            }
            positions[i * 3] = positions[index];
            positions[i * 3 + 1] = positions[index + 1];
            positions[i * 3 + 2] = height;

            texcoords[i * 2] = positions[index] / maxWidth + texOffset;
            texcoords[i * 2 + 1] = -positions[index + 1] / maxWidth + texOffset;
        } else {
            const height = heights[y * width + x];
            positions[i * 3] = x * (1 + skirtOffset);
            positions[i * 3 + 1] = -y * (1 + skirtOffset);
            positions[i * 3 + 2] = height;

            texcoords[i * 2] = x / maxWidth;
            texcoords[i * 2 + 1] = y / maxWidth;

            if (height < minHeight) {
                minHeight = height;
            }
            if (height > maxHeight) {
                maxHeight = height;
            }
        }
    }
    const terrain = {
        positions, texcoords, triangles,
        leftSkirtIndex,
        rightSkirtIndex,
        bottomSkirtIndex,
        topSkirtIndex,
        numTrianglesWithoutSkirts,
        numVerticesWithoutSkirts,
        minHeight: Math.min(0, minHeight),
        maxHeight,
        terrainWidth: width
    };
    return terrain;
}
