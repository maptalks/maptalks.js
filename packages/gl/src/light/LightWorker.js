
import projectEnvironmentMapCPU from './../reshader/pbr/SH.js';
export const onmessage = function (message, postResponse) {
    const data = message.data || {};
    const { cubePixels, width, height, updateTime } = data;
    if (!cubePixels || !width || !height || !updateTime) {
        const message = 'Invalid parameters to create light projectEnvironmentMapCPU.';
        console.error(data);
        postResponse({ error: message });
        return;
    }
    const faces = cubePixels.map(face => {
        return new Uint8Array(face);
    });
    const shList = projectEnvironmentMapCPU(faces, width, height);
    postResponse(null, { shList, updateTime });

}

export const initialize = function () {
};
