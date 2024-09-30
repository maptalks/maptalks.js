import { mat4, reshader, quat, vec3, gltf } from '@maptalks/gl';
import partsModels from './models';
import * as maptalks from 'maptalks';

const point = [];
function createGLTFMesh(modelName) {
    const loader = new gltf.GLTFLoader('', JSON.parse(JSON.stringify(partsModels[modelName])));//避免tc在移除后，再添加新的，内置的gltf受影响
    return loader.load().then(gltf => {
        return gltf;
    });
}

export function prepareMesh(modelName, translate, rotation, scale, color, pickingId) {
    const meshes = [];
    const rotate = quat.fromEuler([], rotation[0], rotation[1], rotation[2]);
    const modelMatrix = mat4.fromRotationTranslationScale([], rotate, translate, scale);
    const promise = createGLTFMesh(modelName);
    promise.then(data => {
        const gltfPack = reshader.GLTFHelper.exportGLTFPack(data);
        const geometries = gltfPack.getMeshesInfo();
        geometries.forEach((g, i) => {
            const material = new reshader.Material({ color: color || g.materialInfo.baseColorFactor });
            const mesh = new reshader.Mesh(g.geometry, material);
            mesh.setUniform('uPickingId', pickingId + i);
            const defines = mesh.getDefines();
            defines.HAS_PICKING_ID = 2;
            mesh.setDefines(defines);
            mesh.translate = translate;
            mesh.rotation = rotation;
            mesh.scaling = scale;
            mat4.multiply(mesh.localTransform, modelMatrix, g.nodeMatrix);
            mesh.originTransform = mat4.copy([], mesh.localTransform);
            mesh.originColor = color || g.materialInfo.baseColorFactor;
            meshes.push(mesh);
        });
        if (pickingId > 100) {
            meshes[0].properties['relatedMeshes'] = meshes.slice(1, 2);
            meshes[1].properties['relatedMeshes'] = meshes.slice(0, 1);
            meshes[2].properties['relatedMeshes'] = meshes.slice(3, 4);
            meshes[3].properties['relatedMeshes'] = meshes.slice(2, 3);
            meshes[4].properties['relatedMeshes'] = meshes.slice(5, 6);
            meshes[5].properties['relatedMeshes'] = meshes.slice(4, 5);
            meshes[6].properties['relatedMeshes'] = meshes.slice(0, 6);
        }
    });
    return meshes;
}

function containerPointToPoint(map, containerPoint, targetRes, altitude) {
    if (altitude) {
        const res = targetRes / map['_getResolution']();
        const w2 = map.width / 2, h2 = map.height / 2;
        point[0] = (containerPoint.x - w2) / w2;
        point[1] = containerPoint.y / h2 - 1;
        point[3] = altitude * res;
        const inverseMat = mat4.invert([], map.projViewMatrix);
        vec3.transformMat4(point, point, inverseMat);
        const glScale = map.getGLScale();
        vec3.set(point, point[0] / glScale, point[1] / glScale, point[2] / glScale);
        vec3.scale(point, point, 1 / res);
        return new maptalks.Point(point[0], point[1]);
    } else {
        const coordExtend = map.containerPointToCoordinate(containerPoint);
        return map.coordinateToPointAtRes(coordExtend, targetRes);
    }
}

function pointToContainerPoint(map, point, res, altitude) {
    return map['_pointAtResToContainerPoint'](point, res, altitude);
}

function getAbsoluteValue(value, s) {
    return Math.abs(value) * Math.sign(s);
}

export function calFixedScale(target, map) {
    const coordinate = target.getCoordinates();
    const coordPoint = map.coordinateToPointAtRes(coordinate, map.getGLRes());
    const trans = [coordPoint.x, coordPoint.y, 0];
    const currentTrans = getTranslationPoint(map, target.getTranslation());
    vec3.add(trans, trans, currentTrans);
    const containerPoint = pointToContainerPoint(map, new maptalks.Point(trans[0], trans[1]), map.getGLRes());
    containerPoint.x += 85;
    const worldCoordExtend = containerPointToPoint(map, containerPoint, map.getGLRes());
    const currentLength = Math.sqrt(Math.pow(worldCoordExtend.x - trans[0], 2) + Math.pow(worldCoordExtend.y - trans[1], 2));
    const fixedScale = currentLength / 5.272881136101205;
    return fixedScale;
}

export function containerPointToWorldPoint(point, map) {
    const coordinate = map.containerPointToCoordinate(new maptalks.Point(point.x, point.y));
    return map.coordinateToPointAtRes(coordinate, map.getGLRes());
}

export function getTranslationPoint(map, translation) {
    if (!map) {
        return translation;
    }
    const point = map.distanceToPointAtRes(translation[0], translation[1], map.getGLRes());
    const z = map.altitudeToPoint(translation[2], map.getGLRes());
    return vec3.set([], getAbsoluteValue(point.x, translation[0]), getAbsoluteValue(point.y, translation[1]), getAbsoluteValue(z, translation[2]));
}
