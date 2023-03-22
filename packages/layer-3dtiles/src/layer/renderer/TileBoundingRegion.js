import { vec3 } from '@maptalks/gl';
import { radianToCartesian3, geodeticSurfaceNormal, geodeticSurfaceNormalCartographic } from '../../common/Transform';
import { EPSILON15 } from '../../common/Math';
import Rectangle from './Rectangle';


const UNIT_X = [1, 0, 0];
const UNIT_Z = [0, 0, 1];

function cartographicToCartesian(carto, out) {
    return radianToCartesian3(out, carto[0], carto[1], carto[2]);
}


class Plane {
    constructor(normal, distance) {
        this.normal = vec3.copy([], normal);
        this.distance = distance;
    }

    static fromPointNormal(point, normal, result) {
        var distance = -vec3.dot(normal, point);

        vec3.copy(result.normal, normal);
        result.distance = distance;
        return result;
    }
}

const cartographicScratch = [];
const cartographicScratch2 = [];
const westernMidpointScratch = [];
const eastWestNormalScratch = [];
const cartesian3Scratch = [];
const cartesian3Scratch2 = [];
const cartesian3Scratch3 = [];
const easternMidpointScratch = [];

const rayOrigin = [];
const rayDirection = [];
const planeScratch = new Plane(UNIT_X, 0.0);

const vectorScratch = [];

export default class TileBoundingRegion {

    constructor(region) {
        this.southwestCornerCartesian = [];
        this.northeastCornerCartesian = [];

        this.westNormal = [];
        this.eastNormal = [];
        this.southNormal = [];
        this.northNormal = [];

        //west, south, east, north
        this.rectangle = new Rectangle(...region);
        this.minimumHeight = region[4];
        this.maximumHeight = region[5];

        this.computeBox(this.rectangle);
    }

    distanceToCamera(cameraCartesianPosition, cameraCartographicPosition) {
        var result = 0.0;
        if (!Rectangle.contains(this.rectangle, cameraCartographicPosition)) {
            var southwestCornerCartesian = this.southwestCornerCartesian;
            var northeastCornerCartesian = this.northeastCornerCartesian;
            var westNormal = this.westNormal;
            var southNormal = this.southNormal;
            var eastNormal = this.eastNormal;
            var northNormal = this.northNormal;

        // if (frameState.mode !== SceneMode.SCENE3D) {
        //     southwestCornerCartesian = frameState.mapProjection.project(
        //         Rectangle.southwest(this.rectangle),
        //         southwestCornerScratch
        //     );
        //     southwestCornerCartesian.z = southwestCornerCartesian.y;
        //     southwestCornerCartesian.y = southwestCornerCartesian.x;
        //     southwestCornerCartesian.x = 0.0;
        //     northeastCornerCartesian = frameState.mapProjection.project(
        //         Rectangle.northeast(this.rectangle),
        //         northeastCornerScratch
        //     );
        //     northeastCornerCartesian.z = northeastCornerCartesian.y;
        //     northeastCornerCartesian.y = northeastCornerCartesian.x;
        //     northeastCornerCartesian.x = 0.0;
        //     westNormal = negativeUnitY;
        //     eastNormal = Cartesian3.UNIT_Y;
        //     southNormal = negativeUnitZ;
        //     northNormal = Cartesian3.UNIT_Z;
        // }

            var vectorFromSouthwestCorner = vec3.subtract(
                vectorScratch,
                cameraCartesianPosition,
                southwestCornerCartesian
            );
            var distanceToWestPlane = vec3.dot(
                vectorFromSouthwestCorner,
                westNormal
            );
            var distanceToSouthPlane = vec3.dot(
                vectorFromSouthwestCorner,
                southNormal
            );

            var vectorFromNortheastCorner = vec3.subtract(
                vectorScratch,
                cameraCartesianPosition,
                northeastCornerCartesian
            );
            var distanceToEastPlane = vec3.dot(
                vectorFromNortheastCorner,
                eastNormal
            );
            var distanceToNorthPlane = vec3.dot(
                vectorFromNortheastCorner,
                northNormal
            );

            if (distanceToWestPlane > 0.0) {
                result += distanceToWestPlane * distanceToWestPlane;
            } else if (distanceToEastPlane > 0.0) {
                result += distanceToEastPlane * distanceToEastPlane;
            }

            if (distanceToSouthPlane > 0.0) {
                result += distanceToSouthPlane * distanceToSouthPlane;
            } else if (distanceToNorthPlane > 0.0) {
                result += distanceToNorthPlane * distanceToNorthPlane;
            }
        }

        var cameraHeight;
        var minimumHeight;
        var maximumHeight;
      // if (frameState.mode === SceneMode.SCENE3D) {
        cameraHeight = cameraCartographicPosition[2];
        minimumHeight = this.minimumHeight;
        maximumHeight = this.maximumHeight;
      // } else {
      //   cameraHeight = cameraCartesianPosition.x;
      //   minimumHeight = 0.0;
      //   maximumHeight = 0.0;
      // }

        if (cameraHeight > maximumHeight) {
            var distanceAboveTop = cameraHeight - maximumHeight;
            result += distanceAboveTop * distanceAboveTop;
        } else if (cameraHeight < minimumHeight) {
            var distanceBelowBottom = minimumHeight - cameraHeight;
            result += distanceBelowBottom * distanceBelowBottom;
        }

        return Math.sqrt(result);
    }

    computeBox(rectangle) {
        const tileBB = this;
        cartographicToCartesian(
            Rectangle.southwest(rectangle, cartographicScratch2),
            tileBB.southwestCornerCartesian
        );
        cartographicToCartesian(
            Rectangle.northeast(rectangle, cartographicScratch2),
            tileBB.northeastCornerCartesian
        );

        // The middle latitude on the western edge.
        cartographicScratch[0] = rectangle.west;
        cartographicScratch[1] = (rectangle.south + rectangle.north) * 0.5;
        cartographicScratch[2] = 0.0;
        var westernMidpointCartesian = cartographicToCartesian(
            cartographicScratch,
            westernMidpointScratch
        );

        // Compute the normal of the plane on the western edge of the tile.
        var westNormal = vec3.cross(
            cartesian3Scratch,
            westernMidpointCartesian,
            UNIT_Z
        );
        vec3.normalize(tileBB.westNormal, westNormal);

        // The middle latitude on the eastern edge.
        cartographicScratch[0] = rectangle.east;
        var easternMidpointCartesian = cartographicToCartesian(
            cartographicScratch,
            easternMidpointScratch
        );

        // Compute the normal of the plane on the eastern edge of the tile.
        var eastNormal = vec3.cross(
            cartesian3Scratch,
            UNIT_Z,
            easternMidpointCartesian
        );
        vec3.normalize(tileBB.eastNormal, eastNormal);

      // Compute the normal of the plane bounding the southern edge of the tile.
        var westVector = vec3.subtract(
            cartesian3Scratch,
            westernMidpointCartesian,
            easternMidpointCartesian,
        );
        var eastWestNormal = vec3.normalize(eastWestNormalScratch, westVector);

        var south = rectangle.south;
        var southSurfaceNormal;

      if (south > 0.0) {
        // Compute a plane that doesn't cut through the tile.
        cartographicScratch[0] = (rectangle.west + rectangle.east) * 0.5;
        cartographicScratch[1] = south;
        var southCenterCartesian = cartographicToCartesian(
            cartographicScratch,
            rayOrigin
        );
        vec3.copy(rayDirection, eastWestNormal);
        var westPlane = Plane.fromPointNormal(
            tileBB.southwestCornerCartesian,
            tileBB.westNormal,
            planeScratch
        );
        // Find a point that is on the west and the south planes
        rayPlane(
            rayOrigin,
            rayDirection,
            westPlane,
            tileBB.southwestCornerCartesian
        );
        southSurfaceNormal = geodeticSurfaceNormal(
          southCenterCartesian,
          cartesian3Scratch2
        );
      } else {
        southSurfaceNormal = geodeticSurfaceNormalCartographic(
          Rectangle.southeast(rectangle, cartographicScratch2),
          cartesian3Scratch2
        );
      }
      var southNormal = vec3.cross(
          cartesian3Scratch3,
          southSurfaceNormal,
          westVector
      );
      vec3.normalize(tileBB.southNormal, southNormal);

        // Compute the normal of the plane bounding the northern edge of the tile.
        var north = rectangle.north;
        var northSurfaceNormal;
        if (north < 0.0) {
            // Compute a plane that doesn't cut through the tile.
            cartographicScratch[0] = (rectangle.west + rectangle.east) * 0.5;
            cartographicScratch[1] = north;
            var northCenterCartesian = cartographicToCartesian(
              cartographicScratch,
              rayOrigin
            );
            // Cartesian3.negate(eastWestNormal, rayDirection);
            vec3.scale(rayDirection, eastWestNormal, -1);
            var eastPlane = Plane.fromPointNormal(
              tileBB.northeastCornerCartesian,
              tileBB.eastNormal,
              planeScratch
            );
            // Find a point that is on the east and the north planes
            rayPlane(
                rayOrigin,
                rayDirection,
                eastPlane,
                tileBB.northeastCornerCartesian
            );
            northSurfaceNormal = geodeticSurfaceNormal(
              northCenterCartesian,
              cartesian3Scratch2
            );
        } else {
            northSurfaceNormal = geodeticSurfaceNormalCartographic(
                Rectangle.northwest(rectangle, cartographicScratch2),
                cartesian3Scratch2
            );
        }
        var northNormal = vec3.cross(
            cartesian3Scratch3,
            westVector,
            northSurfaceNormal,
        );
        vec3.normalize(tileBB.northNormal, northNormal);
    }
}

function rayPlane(rayOrigin, rayDirection, plane, result) {
  var origin = rayOrigin;
  var direction = rayDirection;
  var normal = plane.normal;
  var denominator = vec3.dot(normal, direction);

  if (Math.abs(denominator) < EPSILON15) {
    // Ray is parallel to plane.  The ray may be in the polygon's plane.
    return undefined;
  }

  var t = (-plane.distance - vec3.dot(normal, origin)) / denominator;

  if (t < 0) {
    return undefined;
  }

  result = vec3.scale(result, direction, t);
  return vec3.add(result, origin, result);
}
