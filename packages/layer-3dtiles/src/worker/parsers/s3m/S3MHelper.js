import { vec3, mat4 } from 'gl-matrix';
import { radianToCartesian3 } from '../../../common/Transform';
import { toRadian } from '../../../common/Util';
import { eastNorthUpToFixedFrame } from '../../../common/TileHelper';
// import { parse as txml } from './txml.min.js';

const TMP_VEC3_0 = [];
const TMP_VEC3_1 = [];

function convertToVersion3(config) {
    const json = JSON.parse(JSON.stringify(config));
    const rootTiles = json.rootTiles;
    for (let i = 0; i < rootTiles.length; i++) {
        const { boundingbox } = rootTiles[i];
        const { center, xExtent, yExtent, zExtent } = boundingbox;
        const min = {
            x: center.x * 2 - xExtent.x,
            y: center.y * 2 - yExtent.y,
            z: center.z * 2 - zExtent.z,
        }
        const max = {
            x: xExtent.x,
            y: yExtent.y,
            z: zExtent.z
        };
        boundingbox.min = min;
        boundingbox.max = max;
    }
    json.tiles = rootTiles;
    return json;
}

export function convertS3MJSON(config) {
    if (config.version === '3.0') {
        config = convertToVersion3(config);
    }
    const tilesetJson = {
        asset: {
            version: "1.0",
            gltfUpAxis: "Z",
            s3mType: config.dataType
        },
        extensions: config.extensions,
        geometricError: 0,
        root: {
            boundingVolume: {
            },
            content: {
                uri: ''
            },
            transform: [],
            geometricError: 0,
            refine: 'REPLACE',
            children: [

            ]
        }
    };
    const lon = config.position.x;
    const lat = config.position.y;
    const height = config.position.z;
    const position = radianToCartesian3([], toRadian(lon), toRadian(lat), height);
    const modelMatrix = eastNorthUpToFixedFrame(position, null, []);
    tilesetJson.root.transform = mat4.copy([], modelMatrix);
    const allCenters = [];
    for(let i = 0, len = config.tiles.length; i < len; i++) {
        if (config.tiles[i].boundingbox) {
            const bbox = config.tiles[i].boundingbox;

            vec3.set(TMP_VEC3_0, bbox.min.x, bbox.min.y, bbox.min.z);
            vec3.set(TMP_VEC3_1, bbox.max.x, bbox.max.y, bbox.max.z);

            // vec3.add(TMP_VEC3_0, TMP_VEC3_0, position);
            // vec3.add(TMP_VEC3_1, TMP_VEC3_1, position);

            const sphere = { center: [0, 0, 0], radius: 0 };
            cornerPointsToBoundingSphere(TMP_VEC3_0, TMP_VEC3_1, sphere);
            tilesetJson.root.children.push({
                boundingVolume: {
                    sphere: [...sphere.center, sphere.radius]
                },
                content: {
                    uri: config.tiles[i].url
                },
                geometricError: 70,
                refine: "REPLACE"
            });
            allCenters.push(sphere);
        } else if (config.tiles[i].boundingsphere) {
            const { boundingsphere } = config.tiles[i];
            const sphere = {
                center: [boundingsphere.center.x, boundingsphere.center.y, boundingsphere.center.z],
                radius: boundingsphere.radius
            };
            tilesetJson.root.children.push({
                boundingVolume: {
                    sphere: [...sphere.center, sphere.radius]
                },
                content: {
                    uri: config.tiles[i].url
                },
                geometricError: 70,
                refine: "REPLACE"
            });
            allCenters.push(sphere);
        }

    }

    const sphere = fromBoundingSpheres(allCenters, { center: [0, 0, 0], radius: 0 });

    // tilesetJson.root.boundingVolume.region = [toRadian(minx), toRadian(miny), toRadian(maxx), toRadian(maxy), minHeight, maxHeight];
    tilesetJson.root.boundingVolume.sphere = [...sphere.center, sphere.radius];
    return tilesetJson;
}

// const errorMsg = 'Unrecognized S3M xml.';
// export function convertS3MXML(xmlSource) {
//     const doc = txml(xmlSource);
//     console.log(doc);
//     if (doc.length !== 2) {
//         throw new Error(errorMsg);
//     }

//     const ns = doc[1].attributes['xmlns:sml'];
//     if (!ns || ns !== 'http://www.supermap.com/SuperMapCache/vectorltile') {
//         throw new Error(errorMsg);
//     }
//     const scp = {};
//     const childrenTags = doc[1].children;
//     for (let i = 0; i < childrenTags.length; i++) {
//         if (childrenTags[i].tagName === 'sml:HeightRange') {
//             scp.heightRange = {};
//             const children = childrenTags[i].children;
//             for (let j = 0; j < children.length; j++) {
//                 if (children[j].tagName === 'sml:MaxHeight') {
//                     scp.heightRange.max = +children[j].children[0];
//                 } else if (children[j].tagName === 'sml:MinHeight') {
//                     scp.heightRange.min = +children[j].children[0];
//                 }
//             }
//         } else if (childrenTags[i].tagName === 'sml:Position') {
//             scp.position = {
//                 units: "Degree"
//             };
//             const children = childrenTags[i].children;
//             for (let j = 0; j < children.length; j++) {
//                 if (children[j].tagName === 'sml:X') {
//                     scp.position.x = +children[j].children[0];
//                 } else if (children[j].tagName === 'sml:Y') {
//                     scp.position.y = +children[j].children[0];
//                 } else if (children[j].tagName === 'sml:Z') {
//                     scp.position.z = +children[j].children[0];
//                 }
//             }
//         } else if (childrenTags[i].tagName === 'sml:OSGFiles') {
//             scp.tiles = [];
//             const tileFiles = childrenTags[i].children;
//             for (let j = 0; j < tileFiles.length; j++) {
//                 const tile = {};
//                 scp.tiles.push(tile);
//                 const attrs = tileFiles[j].children;
//                 for (let k = 0; k < attrs.length; k++) {
//                     if (attrs[k].tagName === 'sml:FileName') {
//                         tile.url = encodeURI(attrs[k].children[0]);
//                         tile.url = tile.url.replace(/\+/g, '%2B');
//                     } else if (attrs[k].tagName === 'sml:BoundingSphere') {
//                         tile.boundingsphere = { center: {} };
//                         const bboxTags = attrs[k].children;
//                         for (let n = 0; n < bboxTags.length; n++) {
//                             if (bboxTags[n].tagName === 'sml:CenterX') {
//                                 tile.boundingsphere.center.x = +bboxTags[n].children[0];
//                             } else if (bboxTags[n].tagName === 'sml:CenterY') {
//                                 tile.boundingsphere.center.y = +bboxTags[n].children[0];
//                             } else if (bboxTags[n].tagName === 'sml:CenterZ') {
//                                 tile.boundingsphere.center.z = +bboxTags[n].children[0];
//                             } else if (bboxTags[n].tagName === 'sml:Radius') {
//                                 tile.boundingsphere.radius = +bboxTags[n].children[0];
//                             }
//                         }
//                     }
//                 }
//             }
//         }
//     }
//     return convertS3MJSON(scp);
// }


// from cesium, BoundingSphere.fromCornerPoints
export function cornerPointsToBoundingSphere(corner, oppositeCorner, result) {
    let center = midpoint(corner, oppositeCorner, result.center);
    result.radius = vec3.distance(center, oppositeCorner);
    return result;
}

function midpoint(left, right, result) {
    result[0] = (left[0] + right[0]) * 0.5;
    result[1] = (left[1] + right[1]) * 0.5;
    result[2] = (left[2] + right[2]) * 0.5;

    return result;
}

// from cesium, BoundingSphere.fromBoundingSpheres
export function fromBoundingSpheres(boundingSpheres, result) {
    if (boundingSpheres.length === 0) {
        return result;
    }

    const length = boundingSpheres.length;
    if (length === 1) {
        return cloneSphere(boundingSpheres[0], result);
    }

    if (length === 2) {
        return unionSphere(boundingSpheres[0], boundingSpheres[1], result);
    }

    const positions = [];
    for (let i = 0; i < length; i++) {
        positions.push(boundingSpheres[i].center);
    }

    result = fromPoints(positions, result);

    const center = result.center;
    let radius = result.radius;
    for (let i = 0; i < length; i++) {
        const tmp = boundingSpheres[i];
        radius = Math.max(
            radius,
            vec3.distance(center, tmp.center) +
        tmp.radius
        );
    }
    result.radius = radius;

    return result;
}

function cloneSphere(boundingSphere, result) {
    vec3.copy(result.center, boundingSphere.center);
    result.radius = boundingSphere.radius;
    return result;
}

const unionScratch = [];
const unionScratchCenter = [];
function unionSphere(left, right, result) {
    const leftCenter = left.center;
    const leftRadius = left.radius;
    const rightCenter = right.center;
    const rightRadius = right.radius;

    const toRightCenter = vec3.subtract(
        unionScratch,
        rightCenter,
        leftCenter
    );
    const centerSeparation = magnitude(toRightCenter);

    if (leftRadius >= centerSeparation + rightRadius) {
    // Left sphere wins.
        left.clone(result);
        return result;
    }

    if (rightRadius >= centerSeparation + leftRadius) {
    // Right sphere wins.
        right.clone(result);
        return result;
    }

    // There are two tangent points, one on far side of each sphere.
    const halfDistanceBetweenTangentPoints =
    (leftRadius + centerSeparation + rightRadius) * 0.5;

    // Compute the center point halfway between the two tangent points.
    const center = vec3.scale(
        unionScratchCenter,
        toRightCenter,
        (-leftRadius + halfDistanceBetweenTangentPoints) / centerSeparation
    );
    vec3.add(center, center, leftCenter);
    vec3.copy(result.center, center);
    result.radius = halfDistanceBetweenTangentPoints;

    return result;
}



const fromPointsXMin = [];
const fromPointsYMin = [];
const fromPointsZMin = [];
const fromPointsXMax = [];
const fromPointsYMax = [];
const fromPointsZMax = [];
const fromPointsCurrentPos = [];
const fromPointsScratch = [];
const fromPointsRitterCenter = [];
const fromPointsMinBoxPt = [];
const fromPointsMaxBoxPt = [];
const fromPointsNaiveCenterScratch = [];

function fromPoints(positions, result) {
    if (positions.length === 0) {
        result.center = vec3.set(result.center, 0, 0, 0);
        result.radius = 0.0;
        return result;
    }

    const currentPos = vec3.copy(fromPointsCurrentPos, positions[0]);

    const xMin = vec3.copy(fromPointsXMin, currentPos);
    const yMin = vec3.copy(fromPointsYMin, currentPos);
    const zMin = vec3.copy(fromPointsZMin, currentPos);

    const xMax = vec3.copy(fromPointsXMax, currentPos);
    const yMax = vec3.copy(fromPointsYMax, currentPos);
    const zMax = vec3.copy(fromPointsZMax, currentPos);

    const numPositions = positions.length;
    for (let i = 1; i < numPositions; i++) {
        vec3.copy(currentPos, positions[i]);

        const x = currentPos[0];
        const y = currentPos[1];
        const z = currentPos[2];

        // Store points containing the the smallest and largest components
        if (x < xMin[0]) {
            vec3.copy(xMin, currentPos);
        }

        if (x > xMax[0]) {
            vec3.copy(xMax, currentPos);
        }

        if (y < yMin[1]) {
            vec3.copy(yMin, currentPos);
        }

        if (y > yMax[1]) {
            vec3.copy(yMax, currentPos);
        }

        if (z < zMin[2]) {
            vec3.copy(zMin, currentPos);
        }

        if (z > zMax[2]) {
            vec3.copy(zMax, currentPos);
        }
    }

    // Compute x-, y-, and z-spans (Squared distances b/n each component's min. and max.).
    const xSpan = magnitudeSquared(
        vec3.subtract(fromPointsScratch, xMax, xMin)
    );
    const ySpan = magnitudeSquared(
        vec3.subtract(fromPointsScratch, yMax, yMin)
    );
    const zSpan = magnitudeSquared(
        vec3.subtract(fromPointsScratch, zMax, zMin)
    );

    // Set the diameter endpoints to the largest span.
    let diameter1 = xMin;
    let diameter2 = xMax;
    let maxSpan = xSpan;
    if (ySpan > maxSpan) {
        maxSpan = ySpan;
        diameter1 = yMin;
        diameter2 = yMax;
    }
    if (zSpan > maxSpan) {
        maxSpan = zSpan;
        diameter1 = zMin;
        diameter2 = zMax;
    }

    // Calculate the center of the initial sphere found by Ritter's algorithm
    const ritterCenter = fromPointsRitterCenter;
    ritterCenter[0] = (diameter1[0] + diameter2[0]) * 0.5;
    ritterCenter[1] = (diameter1[1] + diameter2[1]) * 0.5;
    ritterCenter[2] = (diameter1[2] + diameter2[2]) * 0.5;

    // Calculate the radius of the initial sphere found by Ritter's algorithm
    let radiusSquared = magnitudeSquared(
        vec3.subtract(fromPointsScratch, diameter2, ritterCenter)
    );
    let ritterRadius = Math.sqrt(radiusSquared);

    // Find the center of the sphere found using the Naive method.
    const minBoxPt = fromPointsMinBoxPt;
    minBoxPt[0] = xMin[0];
    minBoxPt[1] = yMin[1];
    minBoxPt[2] = zMin[2];

    const maxBoxPt = fromPointsMaxBoxPt;
    maxBoxPt[0] = xMax[0];
    maxBoxPt[1] = yMax[1];
    maxBoxPt[2] = zMax[2];

    const naiveCenter = midpoint(
        minBoxPt,
        maxBoxPt,
        fromPointsNaiveCenterScratch
    );

    // Begin 2nd pass to find naive radius and modify the ritter sphere.
    let naiveRadius = 0;
    for (let i = 0; i < numPositions; i++) {
        vec3.copy(currentPos, positions[i]);

        // Find the furthest point from the naive center to calculate the naive radius.
        const r = magnitude(
            vec3.subtract(fromPointsScratch, currentPos, naiveCenter)
        );
        if (r > naiveRadius) {
            naiveRadius = r;
        }

        // Make adjustments to the Ritter Sphere to include all points.
        const oldCenterToPointSquared = magnitudeSquared(
            vec3.subtract(fromPointsScratch, currentPos, ritterCenter)
        );
        if (oldCenterToPointSquared > radiusSquared) {
            const oldCenterToPoint = Math.sqrt(oldCenterToPointSquared);
            // Calculate new radius to include the point that lies outside
            ritterRadius = (ritterRadius + oldCenterToPoint) * 0.5;
            radiusSquared = ritterRadius * ritterRadius;
            // Calculate center of new Ritter sphere
            const oldToNew = oldCenterToPoint - ritterRadius;
            ritterCenter[0] =
        (ritterRadius * ritterCenter[0] + oldToNew * currentPos[0]) /
        oldCenterToPoint;
            ritterCenter[1] =
        (ritterRadius * ritterCenter[1] + oldToNew * currentPos[1]) /
        oldCenterToPoint;
            ritterCenter[2] =
        (ritterRadius * ritterCenter[2] + oldToNew * currentPos[2]) /
        oldCenterToPoint;
        }
    }

    if (ritterRadius < naiveRadius) {
        vec3.copy(result.center, ritterCenter);
        result.radius = ritterRadius;
    } else {
        vec3.copy(result.center, naiveCenter);
        result.radius = naiveRadius;
    }

    return result;
}

function magnitudeSquared(v) {
    return v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
}

function magnitude(v) {
    return Math.hypot(v[0], v[1], v[2]);
}
