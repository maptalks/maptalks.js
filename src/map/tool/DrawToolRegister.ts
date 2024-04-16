import Ellipse from '../../geometry/Ellipse';
import ArcCurve from '../../geometry/ArcCurve';
import LineString from '../../geometry/LineString';
import { extendSymbol } from '../../core/util/style';
import { extend } from '../../core/util/';
import QuadBezierCurve from '../../geometry/QuadBezierCurve';
import Coordinate from '../../geo/Coordinate';
import Point from '../../geo/Point';
import Marker from '../../geometry/Marker';
import CubicBezierCurve from '../../geometry/CubicBezierCurve';
import Circle from '../../geometry/Circle';
import Polygon from '../../geometry/Polygon';
import DrawTool from './DrawTool';
import { modeActionType } from './DrawTool'

/**
 * 当地形存在时就不能通过update prj来控制Geometry的坐标数据了,因为有了地形后prj对应的
 * Coordinate是另外一个Coordinate,如果还是update prj,那么就会导致Geometry的coordinates又变成非地形下的coordinate了
 * 因为prj里没有考虑海拔
 * @param {*} projection
 * @param {*} prjCoords
 * @param {*} mapEvent
 * @returns Coordinate | Coordinate[]
 */

function queryTerrainCoordinates(projection: any, prjCoords: any, mapEvent: any): Coordinate | Array<Coordinate> {
    const isArray = Array.isArray(prjCoords);
    if (!isArray) {
        prjCoords = [prjCoords];
    }
    let coordinates;
    if (!mapEvent || !mapEvent.target || !mapEvent.target._queryTerrainInfo) {
        coordinates = prjCoords.map(c => {
            return projection.unproject(c);
        });
        return isArray ? coordinates : coordinates[0];
    }
    const map = mapEvent.target;
    const enableAltitude = mapEvent.enableAltitude;
    coordinates = prjCoords.map(c => {
        //prj to container point
        if (enableAltitude) {
            const point = map.prjToContainerPoint(c);
            const terrain = map._queryTerrainInfo(point);
            if (terrain && terrain.coordinate) {
                return terrain.coordinate;
            }
        }
        return projection.unproject(c);
    });
    return isArray ? coordinates : coordinates[0];
}

const circleHooks: modeActionType = {
    'create': function (projection, prjCoord, mapEvent) {
        // const center = projection.unproject(prjCoord[0]);
        const center = queryTerrainCoordinates(projection, prjCoord[0], mapEvent);
        const circle: Circle = new Circle(center as Coordinate, 0);
        // circle._setPrjCoordinates(prjCoord[0]);
        return circle;
    },
    'update': function (projection, prjPath, geometry, mapEvent) {
        const map = geometry.getMap();
        const prjCoord = Array.isArray(prjPath) ? prjPath[prjPath.length - 1] : prjPath;
        // const nextCoord = projection.unproject(prjCoord);
        const nextCoord = queryTerrainCoordinates(projection, prjCoord, mapEvent);
        const radius = map.computeLength(geometry.getCenter(), nextCoord);
        geometry.setRadius(radius);
    },
    'generate': function (geometry) {
        return geometry;
    }
};

DrawTool.registerMode('circle', extend({
    'clickLimit': 2,
    'action': ['click', 'mousemove', 'click'],
}, circleHooks));

DrawTool.registerMode('freeHandCircle', extend({
    'action': ['mousedown touchstart', 'mousemove touchmove', 'mouseup touchend']
}, circleHooks));

const ellipseHooks: modeActionType = {
    'create': function (projection, prjCoord, mapEvent) {
        // const center = projection.unproject(prjCoord[0]);
        const center = queryTerrainCoordinates(projection, prjCoord[0], mapEvent);
        const ellipse = new Ellipse(center as Coordinate, 0, 0);
        // ellipse._setPrjCoordinates(prjCoord[0]);
        return ellipse;
    },
    'update': function (projection, prjPath, geometry, mapEvent) {
        const map = geometry.getMap();
        const center = geometry.getCenter();
        const prjCoord = Array.isArray(prjPath) ? prjPath[prjPath.length - 1] : prjPath;
        // const nextCoord = projection.unproject(prjCoord);
        const nextCoord: any = queryTerrainCoordinates(projection, prjCoord, mapEvent);
        const rx = map.computeLength(center, new Coordinate({
            x: nextCoord.x,
            y: center.y
        }));
        const ry = map.computeLength(center, new Coordinate({
            x: center.x,
            y: nextCoord.y
        }));
        geometry.setWidth(rx * 2);
        geometry.setHeight(ry * 2);
    },
    'generate': function (geometry) {
        return geometry;
    }
};

DrawTool.registerMode('ellipse', extend({
    'clickLimit': 2,
    'action': ['click', 'mousemove', 'click']
}, ellipseHooks));

DrawTool.registerMode('freeHandEllipse', extend({
    'action': ['mousedown touchstart', 'mousemove touchmove', 'mouseup touchend']
}, ellipseHooks));

const rectangleHooks: modeActionType = {
    'create': function (projection, prjCoords) {
        const rect: any = new Polygon([]);
        rect._firstClick = prjCoords[0];
        return rect;
    },
    'update': function (projection, prjCoords, geometry, mapEvent) {
        const map = geometry.getMap();
        const containerPoint = mapEvent['containerPoint'];
        const firstClick = map.prjToContainerPoint(geometry._firstClick);
        const ring = [
            [firstClick.x, firstClick.y],
            [containerPoint.x, firstClick.y],
            [containerPoint.x, containerPoint.y],
            [firstClick.x, containerPoint.y],
        ];
        const prjs = ring.map((c: any) => map._containerPointToPrj(new Point(c)));
        const coordinates = queryTerrainCoordinates(projection, prjs, mapEvent);
        // geometry.setCoordinates(ring.map(c => map.containerPointToCoord(new Point(c))));
        // geometry._setPrjCoordinates(prjs);
        geometry.setCoordinates(coordinates);
    },
    'generate': function (geometry) {
        return geometry;
    }
};

DrawTool.registerMode('rectangle', extend({
    'clickLimit': 2,
    'action': ['click', 'mousemove', 'click'],
}, rectangleHooks));

DrawTool.registerMode('freeHandRectangle', extend({
    'action': ['mousedown touchstart', 'mousemove touchmove', 'mouseup touchend']
}, rectangleHooks));

DrawTool.registerMode('point', {
    'clickLimit': 1,
    'action': ['click', 'mousemove'],
    'create': function (projection, prjCoord, mapEvent) {
        // const center = projection.unproject(prjCoord[0]);
        const center = queryTerrainCoordinates(projection, prjCoord[0], mapEvent);
        const marker = new Marker(center as Coordinate);
        // marker._setPrjCoordinates(prjCoord[0]);
        return marker;
    },
    'generate': function (geometry) {
        return geometry;
    },
    'update': function (projection, prjCoord, geometry, mapEvent) {
        if (Array.isArray(prjCoord)) {
            prjCoord = prjCoord[prjCoord.length - 1];
        }
        if (!prjCoord) {
            return geometry;
        }
        // const coordinate = projection.unproject(prjCoord);
        const coordinate = queryTerrainCoordinates(projection, prjCoord, mapEvent);
        geometry.setCoordinates(coordinate);
        return geometry;
    }
});

const polygonHooks: modeActionType = {
    'create': function (projection, prjPath, mapEvent) {
        // const path = prjPath.map(c => projection.unproject(c));
        const path: any = queryTerrainCoordinates(projection, prjPath, mapEvent);
        const line = new LineString(path);
        // line._setPrjCoordinates(prjPath);
        line.setCoordinates(path);
        return line;
    },
    'update': function (projection, path, geometry, mapEvent) {
        const symbol = geometry.getSymbol();
        let prjCoords;
        if (Array.isArray(path)) {
            prjCoords = path;
        } else {
            // prjCoords = geometry._getPrjCoordinates();
            prjCoords = geometry._drawPrjs || [];
            prjCoords.push(path);
        }
        geometry._drawPrjs = prjCoords;
        // const coordinates = prjCoords.map(c => projection.unproject(c));
        const coordinates: any = queryTerrainCoordinates(projection, prjCoords, mapEvent);

        // geometry._setPrjCoordinates(prjCoords);
        geometry.setCoordinates(coordinates);
        const layer = geometry.getLayer();
        if (layer) {
            let polygon = layer.getGeometryById('polygon');
            if (!polygon && prjCoords.length >= 3) {
                polygon = new Polygon([coordinates], {
                    'id': 'polygon',
                    'zIndex': -1
                });
                if (symbol) {
                    const pSymbol = extendSymbol(symbol, {
                        'lineOpacity': 0
                    });
                    polygon.setSymbol(pSymbol);
                }
                polygon.addTo(layer);
            }
            if (polygon) {
                // polygon._setPrjCoordinates(prjCoords);
                polygon.setCoordinates([coordinates]);
            }
        }
    },
    'generate': function (geometry) {
        const polygon = new Polygon(geometry.getCoordinates(), {
            'symbol': geometry.getSymbol(),
            'properties': geometry.getProperties()
        });
        // polygon._setPrjCoordinates(geometry._getPrjCoordinates());
        polygon._projCode = geometry._projCode;
        return polygon;
    }
};

DrawTool.registerMode('polygon', extend({
    'action': ['click', 'mousemove', 'dblclick']
}, polygonHooks));

DrawTool.registerMode('freeHandPolygon', extend({
    'action': ['mousedown touchstart', 'mousemove touchmove', 'mouseup touchend']
}, polygonHooks));

const lineStringHooks: modeActionType = {
    'create': function (projection, prjPath, mapEvent) {
        // const path = prjPath.map(c => projection.unproject(c));
        const path: any = queryTerrainCoordinates(projection, prjPath, mapEvent);
        const line = new LineString(path);
        // line._setPrjCoordinates(prjPath);
        line.setCoordinates(path);
        return line;
    },
    'update': function (projection, prjPath, geometry, mapEvent) {
        let prjCoords;
        if (Array.isArray(prjPath)) {
            prjCoords = prjPath;
        } else {
            // prjCoords = geometry._getPrjCoordinates();
            prjCoords = geometry._drawPrjs || [];
            prjCoords.push(prjPath);
        }
        // const path = prjCoords.map(c => projection.unproject(c));
        // geometry.setCoordinates(path);
        // geometry._setPrjCoordinates(prjCoords);
        geometry._drawPrjs = prjCoords;
        const path = queryTerrainCoordinates(projection, prjCoords, mapEvent);
        geometry.setCoordinates(path);
    },
    'generate': function (geometry) {
        return geometry;
    }
};

DrawTool.registerMode('linestring', extend({
    'action': ['click', 'mousemove', 'dblclick']
}, lineStringHooks));

DrawTool.registerMode('freeHandLinestring', extend({
    'action': ['mousedown touchstart', 'mousemove touchmove', 'mouseup touchend']
}, lineStringHooks));

DrawTool.registerMode('arccurve', {
    'action': ['click', 'mousemove', 'dblclick'],
    'create': function (projection, prjPath) {
        const path = prjPath.map(c => projection.unproject(c));
        const arc = new ArcCurve(path);
        arc._setPrjCoordinates(prjPath);
        return arc;
    },
    'update': lineStringHooks.update,
    'generate': function (geometry) {
        return geometry;
    }
});

DrawTool.registerMode('quadbeziercurve', {
    'action': ['click', 'mousemove', 'dblclick'],
    'create': function (projection, prjPath) {
        const path = prjPath.map(c => projection.unproject(c));
        const curve = new QuadBezierCurve(path);
        curve._setPrjCoordinates(prjPath);
        return curve;
    },
    'update': lineStringHooks.update,
    'generate': function (geometry) {
        return geometry;
    }
});

DrawTool.registerMode('cubicbeziercurve', {
    'action': ['click', 'mousemove', 'dblclick'],
    'create': function (projection, prjPath) {
        const path = prjPath.map(c => projection.unproject(c));
        const curve = new CubicBezierCurve(path);
        curve._setPrjCoordinates(prjPath);
        return curve;
    },
    'update': lineStringHooks.update,
    'generate': function (geometry) {
        return geometry;
    }
});

// TODO When action contains 'mousedown', It is in drag mode.
DrawTool.registerMode('boxZoom', {
    'action': ['mousedown', 'mousemove', 'mouseup'],
    'create': function (projection, prjCoord) {
        prjCoord = prjCoord[0];
        const center = projection.unproject(prjCoord);
        const marker: any = new Marker(center);
        marker._firstClick = prjCoord;
        return marker;
    },
    'update': function (projection, prjCoord, geometry, param) {
        const map = geometry.getMap();
        const p1 = map.prjToContainerPoint(geometry._firstClick),
            p2 = param['containerPoint'];
        prjCoord = map._containerPointToPrj(new Coordinate(Math.min(p1.x, p2.x), Math.min(p1.y, p2.y)));
        const center = projection.unproject(prjCoord);
        geometry.setCoordinates(center)
            ._setPrjCoordinates(prjCoord);
        geometry.updateSymbol({
            markerWidth: Math.abs(p1.x - p2.x),
            markerHeight: Math.abs(p1.y - p2.y)
        });
    },
    'generate': function (geometry) {
        return geometry;
    }
});
