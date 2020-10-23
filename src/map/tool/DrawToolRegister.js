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

const circleHooks = {
    'create': function (projection, prjCoord) {
        const center = projection.unproject(prjCoord[0]);
        const circle =  new Circle(center, 0);
        circle._setPrjCoordinates(prjCoord[0]);
        return circle;
    },
    'update': function (projection, prjPath, geometry) {
        const map = geometry.getMap();
        const prjCoord = Array.isArray(prjPath) ? prjPath[prjPath.length - 1] : prjPath;
        const nextCoord = projection.unproject(prjCoord);
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

const ellipseHooks = {
    'create': function (projection, prjCoord) {
        const center = projection.unproject(prjCoord[0]);
        const ellipse = new Ellipse(center, 0, 0);
        ellipse._setPrjCoordinates(prjCoord[0]);
        return ellipse;
    },
    'update': function (projection, prjPath, geometry) {
        const map = geometry.getMap();
        const center = geometry.getCenter();
        const prjCoord = Array.isArray(prjPath) ? prjPath[prjPath.length - 1] : prjPath;
        const nextCoord = projection.unproject(prjCoord);
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

const rectangleHooks = {
    'create': function (projection, prjCoords) {
        const rect = new Polygon([]);
        rect._firstClick = prjCoords[0];
        return rect;
    },
    'update': function (projection, prjCoords, geometry, param) {
        const map = geometry.getMap();
        const containerPoint = param['containerPoint'];
        const firstClick = map._prjToContainerPoint(geometry._firstClick);
        const ring = [
            [firstClick.x, firstClick.y],
            [containerPoint.x, firstClick.y],
            [containerPoint.x, containerPoint.y],
            [firstClick.x, containerPoint.y],
        ];
        geometry.setCoordinates(ring.map(c => map.containerPointToCoord(new Point(c))));
        geometry._setPrjCoordinates(ring.map(c => map._containerPointToPrj(new Point(c))));
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
    'action': ['click'],
    'create': function (projection, prjCoord) {
        const center = projection.unproject(prjCoord[0]);
        const marker = new Marker(center);
        marker._setPrjCoordinates(prjCoord[0]);
        return marker;
    },
    'generate': function (geometry) {
        return geometry;
    }
});

const polygonHooks = {
    'create': function (projection, prjPath) {
        const path = prjPath.map(c => projection.unproject(c));
        const line = new LineString(path);
        line._setPrjCoordinates(prjPath);
        return line;
    },
    'update': function (projection, path, geometry) {
        const symbol = geometry.getSymbol();
        let prjCoords;
        if (Array.isArray(path)) {
            prjCoords = path;
        } else {
            prjCoords = geometry._getPrjCoordinates();
            prjCoords.push(path);
        }
        const coordinates = prjCoords.map(c => projection.unproject(c));
        geometry.setCoordinates(coordinates);
        geometry._setPrjCoordinates(prjCoords);
        const layer = geometry.getLayer();
        if (layer) {
            let polygon = layer.getGeometryById('polygon');
            if (!polygon && prjCoords.length >= 3) {
                polygon = new Polygon([coordinates], {
                    'id': 'polygon'
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
                polygon._setPrjCoordinates(prjCoords);
            }
        }
    },
    'generate': function (geometry) {
        const polygon = new Polygon(geometry.getCoordinates(), {
            'symbol': geometry.getSymbol()
        });
        polygon._setPrjCoordinates(geometry._getPrjCoordinates());
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

const lineStringHooks = {
    'create': function (projection, prjPath) {
        const path = prjPath.map(c => projection.unproject(c));
        const line = new LineString(path);
        line._setPrjCoordinates(prjPath);
        return line;
    },
    'update': function (projection, prjPath, geometry) {
        let prjCoords;
        if (Array.isArray(prjPath)) {
            prjCoords = prjPath;
        } else {
            prjCoords = geometry._getPrjCoordinates();
            prjCoords.push(prjPath);
        }
        const path = prjCoords.map(c => projection.unproject(c));
        geometry.setCoordinates(path);
        geometry._setPrjCoordinates(prjCoords);
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
        const marker = new Marker(center);
        marker._firstClick = prjCoord;
        return marker;
    },
    'update': function (projection, prjCoord, geometry, param) {
        const map = geometry.getMap();
        const p1 = map._prjToContainerPoint(geometry._firstClick),
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
